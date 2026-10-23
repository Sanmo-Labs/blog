---
title: "How to Deploy a Next.js App on RumptyCloud"
description: "Deploy a Next.js app from GitHub on RumptyCloud: build and start commands, env vars, health checks, and fixes for common build failures."
publishedDate: 2026-10-14
updatedDate: 2026-10-14
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/community-deploy-nextjs-social.jpg"
coverWidth: 1260
coverHeight: 760
coverAlt: "Journal illustration for How to Deploy a Next.js App on RumptyCloud"
card: "/journal/img/community-deploy-nextjs-1260.webp"
hero: "/journal/img/community-deploy-nextjs-2560.webp"
tags:
  - "Deployment"
  - "Next.js"
  - "React"
  - "GitHub"
draft: false
---

RumptyCloud builds and serves a Next.js application directly from a GitHub repository. In this guide, we will prepare a small Next.js app, connect its repository, and take it live, including the two things that trip up most first Next.js deployments: build-time environment variables and build memory.

## What you will need

Before you begin, make sure you have:

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- A GitHub repository containing your Next.js application

## 1. Prepare your Next.js app

A Next.js app needs three things from this guide's point of view: a production start script, a port it reads from the environment, and a health check path.

Create a fresh app if you need one:

```bash
npx create-next-app@latest my-app
cd my-app
```

Next.js apps already ship with the right scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

`next start` reads `process.env.PORT` and falls back to `3000`, which aligns with the **Port** field in the RumptyCloud console.

Add a health route that the readiness check can call without authentication. With the App Router, create `app/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "healthy" });
}
```

Run the app locally with `npm run build && npm start`, then check `http://localhost:3000` and `http://localhost:3000/health`. When both work, commit your changes and push the repository to GitHub.

Optionally, set `output: "standalone"` in `next.config.js` for a smaller production footprint. With standalone output, the **Start command** becomes `node .next/standalone/server.js` instead of `npm start`. Everything else in this guide stays the same.

## 2. Create a deployment

[Sign in to the RumptyCloud console](https://console.rumptycloud.com/signin), select your workspace, open **Deployments**, and select **New deployment**.

The **Source** section connects the deployment to GitHub:

1. Select **Install GitHub App** if GitHub is not connected yet.
2. Choose the GitHub account or organization and grant access to the repository you want to deploy.
3. After returning to RumptyCloud, search for and select your repository.
4. Give the deployment a recognizable **Name**.
5. Confirm the **Branch** you want to deploy.

![Source Section](/images/how-to-deploy-nextjs-app-on-rumptycloud-source.png)

If the repository is a monorepo, set **Root directory** to the folder that contains the Next.js app. Otherwise, leave it empty.

For a Next.js app, select **Web Service/Backend** under **Application type**. RumptyCloud inspects the selected repository and may fill in some of these details for you.

> If a repository is missing from the list, select **Manage repo access on GitHub**, grant access to it, and return to the deployment form.

## 3. Review the app settings

For a typical Next.js app, use the following settings:

| Console field | Recommended value |
| --- | --- |
| Application type | **Web Service/Backend** |
| Build with | **Auto** |
| Build command | Leave empty initially; `npm run build` if not detected |
| Start command | Leave empty when your `start` script can be detected; otherwise `npm start` |
| Readiness/health check path | `/health` for the example above, or `/` |
| Port | `3000`, or whatever your app falls back to |

![Deployment Settings](/images/how-to-deploy-nextjs-app-on-rumptycloud-settings.png)

**Auto** is the standard choice. If RumptyCloud discovers a Dockerfile in the repository, the form also lets you choose **Dockerfile**; use that only when you intend to deploy with the Dockerfile in your repository.

The configured port must match the port your app listens on. `next start` reading `process.env.PORT` with a `3000` fallback, as in the example, keeps the two aligned.

## 4. Add environment variables

If your application needs configuration such as a database URL, API key, or auth secret, find **Environment variables** and select **Add**. Enter each variable as a **Key** and **Value** pair:

```text
DATABASE_URL=postgresql://...
AUTH_SECRET=...
```

![Environment Variables Section](/images/how-to-deploy-nextjs-app-on-rumptycloud-env-vars.png)

Server-side values like these are read at runtime, so adding or changing them only requires a redeploy.

The Next.js-specific gotcha is the `NEXT_PUBLIC_` prefix. Any variable with that prefix is inlined into the client bundle at build time, which means two things:

- If you add or change a `NEXT_PUBLIC_` variable, the app must be rebuilt for the change to appear.
- Never put a secret behind the `NEXT_PUBLIC_` prefix; it ships to every visitor's browser.

Do not add production credentials to your Git repository or commit a production `.env` file.

## 5. Choose a runtime size and deploy

In **Runtime size**, choose a plan with enough CPU and memory for your app. A smaller option is usually a sensible starting point for a marketing site or a light dashboard, and you can adjust it later as usage grows.

Before continuing, review the two checkboxes below the app settings:

- Keep **Start a build after creating this deployment** selected if you want to deploy immediately.
- Keep **Automatically deploy when this branch receives new pushes** selected if future pushes to the branch should start a new deployment.

![Autoscaling and runtime options](/images/how-to-deploy-nextjs-app-on-rumptycloud-runtime.png)

Select **Create deployment**. If RumptyCloud asks you to review the acceptable use policy, accept it to continue.

You will be taken to the deployment page while the first run is in progress. Select **View logs** to follow it, or open **Runs** and choose the current run. When the status changes from **Building** to **Live**, select **Open app** to visit its public URL.

![The Runs tab of a deployment](/images/how-to-deploy-nextjs-app-on-rumptycloud-runs.png)

## Troubleshooting a failed deployment

If a run fails, open it from **Runs** and review its logs. These checks solve the most common Next.js deployment issues:

- **The build is killed or runs out of memory.** Next.js builds are memory-hungry. Raise the heap in the build command, for example `NODE_OPTIONS=--max-old-space-size=1024 npm run build`, or select a larger runtime size.
- **The app crashes on boot.** It must listen on `0.0.0.0`, not only `localhost`. `next start` does this by default; a custom server must handle it itself.
- **The health check fails.** Confirm the **Readiness/health check path** returns a successful response without authentication.
- **An environment variable is missing at runtime.** Add it in the console's **Environment variables** section rather than committing it.
- **A `NEXT_PUBLIC_` change is not showing.** Remember it is baked in at build time; the deployment needs a rebuild.
- **Dev-only behaviour.** `next dev` and development-mode code paths never belong in production; make sure the start command runs the built app.

You can update the branch, commands, health-check path, port, and automatic deployment preference from the **Settings** tab. Saved changes apply to the next deployment.

## Add a custom domain

Every successful public deployment receives a RumptyCloud URL. To use your own domain, open **Settings**, find **Custom domains**, add the domain, and follow the DNS instructions shown in the console.

## Conclusion

Once your repository and deployment are connected, your normal workflow is simple:

> Write code → push to GitHub → review the deployment.

RumptyCloud keeps the essential controls—build settings, environment variables, logs, metrics, redeployments, and custom domains—together on the deployment page, so you can focus on shipping your Next.js app.

## About the author

John Chinedu Enechukwu is a Nigerian Web3 educator and builder. He founded NextChain, a community that has onboarded 200+ young Africans into emerging tech, and he builds and writes at the intersection of Web3 and AI. He shares build-in-public notes and guides on X as [@The_Real_EJC](https://x.com/The_Real_EJC).
