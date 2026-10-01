---
title: "Deploy to a VM with GitHub Actions on RumptyCloud"
description: "Set up CI/CD on RumptyCloud — connect a GitHub repo to a virtual machine with a GitHub Actions workflow, and ship every push to nginx automatically."
publishedDate: 2026-09-30
author: "Odukoya Abdullahi"
authorType: "Person"
cover: "/journal/img/github-actions-deploy-social.jpg"
coverWidth: 1200
coverHeight: 630
card: "/journal/img/github-actions-deploy-card.webp"
hero: "/journal/img/github-actions-deploy-hero.webp"
coverAlt: "An orange repository connected by a deploy line to a stack of cream server units on a blue Journal background"
tags:
  - "Deployment"
  - "GitHub Actions"
  - "CI/CD"
  - "Nginx"
  - "Virtual Machines"
draft: true
---

In our [Django guide](https://blog.rumptycloud.com/blog/how-to-deploy-a-django-app-on-rumptycloud/) we deployed an app the honest way: SSH into the VM, pull the code, restart gunicorn, reload nginx. It works, and it's how a lot of servers are run. But notice what it costs you. Every deploy means logging in and typing commands by hand.

This post removes that step. You'll wire a GitHub Actions workflow to a RumptyCloud virtual machine, so the sequence becomes: **you push, GitHub builds, the artifact lands on your VM, nginx reloads.** No SSH, no manual steps, no forgetting to restart the service.

## Two ways to deploy from GitHub

Worth clearing up first, because the docs use similar words for two different things.

| | **Deployments** | **VM Deploy tab** |
| --- | --- | --- |
| Where it runs | RumptyCloud's own container runtime | a VM you own and configure |
| GitHub integration | GitHub App | GitHub Actions workflow |
| Who builds it | the platform (Auto or Dockerfile) | your workflow |
| Servers, ports, TLS | handled for you | yours to run |
| Rollback | instant, from a stored artifact | redeploy an earlier commit |

If you don't want to run a server at all, the [Deployments route](https://blog.rumptycloud.com/blog/how-to-deploy-nodejs-app-on-rumptycloud/) is less work: no nginx, no firewall rules, no SSH. Choose it when you just want the app online.

Choose the VM route when you need the machine: custom services, a non-Node stack, your own network layout, or processes you'd rather manage with systemd. That's the route this post covers.

## Before you start

- **A running VM.** See [spin up a virtual machine](https://blog.rumptycloud.com/blog/how-to-spin-up-a-virtual-machine-on-rumptycloud/) if you don't have one.
- **A GitHub repo that builds a frontend.** This walkthrough uses Node: `npm ci && npm run build` producing a `dist/` folder. Vite, CRA, and Next.js static exports all do this.
- **nginx on the VM.** One-time setup, covered in step 3. We walk through nginx serving a static build; if you'd rather forward to an app running on a port, HAProxy works too and the Deploy tab has example configs for both.
- **The Rumpty CLI**, for the local-testing workflow at the end. Install it with `curl -fsSL https://get.rumptycloud.com | sh`.

## 1. Open the Deploy tab

Go to **Compute → Virtual Machines** and open your VM, then select the **Deploy** tab.

![The VM Deploy tab, showing the secrets, the generated workflow template, and the reverse proxy config paths](/images/how-to-deploy-to-vm-github-actions-deploy-tab.png)

The tab lays out the whole flow in four steps — add secrets, configure a proxy, create the workflow, push to deploy — and gives you two values to copy:

- `RUMPTY_TOKEN` — your platform API token
- `RUMPTY_VM_ID` — this VM's unique ID

It also generates a starter workflow you can copy, and shows the config path for nginx or HAProxy under **Configure reverse proxy**.

> The Deploy tab also shows a one-line `rumpty deploy` command for testing from your project root. It's a convenient shortcut, but it isn't in the released CLI yet — `rumpty copy` and `rumpty exec` are, and that's what the workflow below uses.

## 2. Add the GitHub secrets

In your repository, go to **Settings → Secrets and variables → Actions** and add two repository secrets:

| Secret | Value |
| --- | --- |
| `RUMPTY_TOKEN` | the platform API token from the Deploy tab |
| `VM_SSH_KEY` | a private SSH key whose public half is authorized on the VM (below) |

![The GitHub Actions secrets page with the deploy secrets configured](/images/how-to-deploy-to-vm-github-actions-repo-secrets.png)

The second one catches people out. GitHub's runner has no SSH agent and no keys of its own, so it has no way to prove who it is. Rumpty connects in two hops: the first one, to the platform, is handled for you, but the second one, into the VM, needs a real key. That's why we pass one in.

Use a key the VM already trusts. The easiest one is the SSH key you attached when you created the VM. Grab its private half from your machine:

```bash
cat ~/.ssh/id_rsa | pbcopy
```

Paste that into the `VM_SSH_KEY` secret. If that key has a passphrase, generate a dedicated one instead so nothing prompts mid-run:

```bash
ssh-keygen -t ed25519 -C "rumpty-deploy" -f ~/.ssh/rumpty_deploy -N ""
cat ~/.ssh/rumpty_deploy.pub
```

Then add that public key to the VM (browser console → Connect → Launch console):

```bash
echo "ssh-ed25519 AAAA..." >> /root/.ssh/authorized_keys
```

and store the matching private key as `VM_SSH_KEY`.

> **Keep keys out of the repo.** A private key in GitHub secrets can be read by anything that can run a workflow in that repository. A dedicated key like the one above is far easier to revoke than a personal key, and you should never commit either.

## 3. Point nginx at your build directory

This is one-time setup, and there are two things that will bite you if you skip them.

First, install nginx and create the directory:

```bash
apt update && apt install -y nginx
mkdir -p /var/www/tutorial-vm
```

**Then take port 8080 back from the platform.** Every new VM ships with a small welcome service already listening on 8080. If you configure nginx for 8080 and reload without stopping it, nginx fails to bind, the reload does nothing, and your deploy still reports success while the welcome page keeps serving. Stop it first:

```bash
systemctl disable --now rumpty-welcome.service
```

Confirm nginx can have the port:

```bash
ss -tlnp | grep 8080
```

You want to see `nginx` in that output, not `python3`.

Now write the site config at the path the Deploy tab expects:

```bash
cat > /etc/nginx/sites-available/tutorial-vm << 'EOF'
server {
    listen 8080;
    server_name _;

    root /var/www/tutorial-vm/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -s /etc/nginx/sites-available/tutorial-vm /etc/nginx/sites-enabled/tutorial-vm
nginx -t && systemctl reload nginx
```

![Configuring the nginx site, testing the config, and reloading nginx on the VM](/images/how-to-deploy-to-vm-github-actions-nginx-terminal.png)

Note the `root` line ends in `/dist`. That is deliberate, and it's the second thing that will bite you. The upload step copies the **folder**, not its contents, so after the first deploy the files land in `/var/www/tutorial-vm/dist/` rather than `/var/www/tutorial-vm/`. Point nginx at the real path. If you'd rather keep the tidier path, copy the contents up after the transfer instead.

The `try_files` line is what makes client-side routing work — a deep link like `/dashboard` returns `index.html` instead of a 404.

> **Why 8080?** It's the default app port for RumptyCloud VMs and is already allowed by the default firewall policy, so this works with no firewall changes. If you'd rather serve on 80 or 443, change `listen` and add an allow rule as in step 4.

## 4. Only if you changed the port: open it in the firewall

If you kept `listen 8080`, skip this.

RumptyCloud blocks inbound traffic by default, and the default policy only allows **TCP 22** and **TCP 8080**. Serving on 80 or 443 means adding a rule under **Networking & Security → Firewall Policies**:

| Field | Value |
| --- | --- |
| Direction | Inbound |
| Protocol | TCP |
| Port(s) | `80` (and `443` if you're serving HTTPS) |
| Source (CIDR) | `0.0.0.0/0` |
| Description | Allow HTTP traffic |

> **Don't delete the port 22 default rule.** Attaching a policy turns on default inbound deny, so removing the SSH rule locks you out of `rumpty ssh`. Our [firewall policy guide](https://blog.rumptycloud.com/blog/how-to-create-a-firewall-policy-on-rumptycloud/) covers the rules in detail.

## 5. Add the workflow file

Create `.github/workflows/rumpty-deploy.yml` in your repository:

```yaml
name: Deploy to RumptyCloud

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Build
        run: |
          npm ci
          npm run build

      - name: Install Rumpty CLI
        run: curl -fsSL https://get.rumptycloud.com | sh

      - name: Deploy to VM
        env:
          RUMPTY_API_KEY: ${{ secrets.RUMPTY_TOKEN }}
          VM_SSH_KEY: ${{ secrets.VM_SSH_KEY }}
        run: |
          printf '%s\n' "$VM_SSH_KEY" > /tmp/deploy_key
          chmod 600 /tmp/deploy_key
          rumpty copy ./dist tutorial-vm:/var/www/tutorial-vm --ws <workspace-slug> --identity /tmp/deploy_key
          rumpty exec tutorial-vm --ws <workspace-slug> --identity /tmp/deploy_key -- sudo systemctl reload nginx
```

The build runs in GitHub, not on your VM. Only the finished `dist/` folder is transferred, so the workflow stays fast and your VM needs no build tooling.

Three things to get right:

- **`branches`** — this must match your default branch. The generated template says `main`; if your repo uses `master`, change it or the workflow will never fire.
- **`--identity`** — the key from step 2, without which the upload fails with `Permission denied (publickey)`.
- **`target` and `--ws`** — the upload destination and your workspace slug, both shown on the Deploy tab and the VM detail page.

> The workflow builds its own key file from the `VM_SSH_KEY` secret rather than checking one into the repo. That's deliberate: the key exists only for the length of the run.

## 6. Push and watch it deploy

Commit the workflow and push. The run starts immediately — watch it in the **Actions** tab.

A successful run builds the project, uploads `dist/` to the VM, and reloads nginx.

![A successful GitHub Actions run showing the deploy step completing](/images/how-to-deploy-to-vm-github-actions-workflow-success.png)

## 7. Open the live site

Click **View app** on the Deploy tab, or open the VM's app URL directly.

![The deployed Vite application serving on the VM's public app URL](/images/how-to-deploy-to-vm-github-actions-live-site.png)

That's the whole loop: a `git push`, a green tick, and your updated site on a public HTTPS URL.

## Updating it later

This is the payoff. Shipping an update is now just:

```bash
git push
```

Every push to your default branch rebuilds and redeploys. For a manual run, use **Actions → your workflow → Run workflow**, which is what `workflow_dispatch:` in the file enables. To roll back, redeploy an earlier commit — this route keeps no build artifacts, so there's no one-click rollback the way RumptyCloud Deployments has.

## Test a deploy without pushing

Handy while you're getting nginx right. The CLI does the same two things the workflow does, and running it from your laptop isolates nginx problems from workflow problems:

```bash
rumpty copy ./dist tutorial-vm:/var/www/tutorial-vm --ws <workspace-slug>
rumpty exec tutorial-vm --ws <workspace-slug> -- sudo systemctl reload nginx
```

`rumpty copy` uses rsync when it's available and falls back to scp. `rumpty exec` runs the remote command after `--`. If this works but the workflow doesn't, the problem is in your workflow or secrets, not your nginx setup.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Workflow never runs | Folder is `.github/workflow` | Rename to `.github/workflows` — plural, or Actions ignores it |
| Workflow never runs | `branches:` doesn't match your default branch | Use `master` or `main` to match the repo |
| `Unable to resolve action rumptycloud/deploy-action` | The published action isn't available on your plan or isn't yet public | Use the CLI steps in step 5 instead |
| `unauthorized` during deploy | `RUMPTY_TOKEN` is missing, mistyped, or copied while masked | Create a key under Profile → Personal API keys; copy it before leaving the page |
| `Load key ... error in libcrypto` | `VM_SSH_KEY` is empty or the paste was truncated | Re-paste the full key, BEGIN and END lines included |
| `root@<vm>: Permission denied (publickey)` | No usable key on the runner | Add `VM_SSH_KEY` and pass `--identity` |
| Site still shows the welcome page | `rumpty-welcome.service` holds port 8080 | `systemctl disable --now rumpty-welcome.service`, then reload nginx |
| `403 Forbidden` on your app | nginx root points at the parent folder | The upload nests at `dist/` — set `root` to `/var/www/tutorial-vm/dist` |
| Every route 404s except `/` | Missing SPA fallback | Add `try_files $uri $uri/ /index.html;` |
| Can't reach the site at all | Port blocked | Add a firewall allow rule for the port you're serving on |
| Lost access after attaching a policy | Port 22 rule removed | Re-add the SSH allow rule, or detach the policy |

## Conclusion

The VM you started with a plain `git clone` is now a deployment target. GitHub builds it, the artifact ships itself, and nginx picks it up, all triggered by a push you were going to make anyway.

The two things that cost me the most time here are worth repeating: **stop the welcome service before pointing nginx at 8080**, and **give the runner a key**. Both fail quietly — the deploy reports success either way, and you find out from a browser. Check the app URL after your first run rather than trusting the green tick.

## Which route should you pick?

If you read this and thought "all I want is the app online, I don't want to maintain a server," use [Deployments](https://blog.rumptycloud.com/blog/how-to-deploy-nodejs-app-on-rumptycloud/). It's fewer moving parts and it manages TLS for you.

Stay on the VM route when the machine itself is part of the design: you need systemd services, a custom domain with your own certificates, a non-Node runtime, or the app sharing a network with other resources. That's the trade — more responsibility, more control.
