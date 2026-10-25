---
title: "How to Manage Environment Variables on RumptyCloud"
description: "Add, update, and rotate environment variables on RumptyCloud: the Env tab, bulk .env editing, how values reach your app, and the habits that keep credentials safe."
publishedDate: 2026-10-19
updatedDate: 2026-10-19
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/env-vars-secrets-1260.webp"
coverWidth: 1260
coverHeight: 760
coverAlt: "Journal illustration for How to Manage Environment Variables on RumptyCloud"
card: "/journal/img/env-vars-secrets-1260.webp"
hero: "/journal/img/env-vars-secrets-2560.webp"
tags:
  - "Deployment"
  - "Security"
  - "Configuration"
  - "Environment variables"
draft: false
---

Every application carries a few values that must never live in the codebase: a database connection string, an API key, an auth secret. Committing them to Git means every clone has your credentials and every leaked repository becomes an incident. RumptyCloud keeps this configuration out of your repository entirely: you store each value as an environment variable, the platform stores it encrypted, and your app reads it at runtime like any variable set on the machine.

In this guide, we will add environment variables to a deployment through the console, import a whole `.env` file at once, and cover the habits that keep those values safe. We will use a small Node service that needs an API key as the running example.

## What you will need

- A RumptyCloud account and workspace.
- A deployment created from a GitHub repository. If you do not have one yet, start with [How to Deploy a Next.js App on RumptyCloud](/posts/how-to-deploy-nextjs-app-on-rumptycloud) — the same steps apply to any framework.
- The values you want to configure, such as a `DATABASE_URL` or a third-party API key.

## Where environment variables live

There are two places to manage variables:

1. **The new deployment form.** When you create a deployment, the **Environment variables** section lets you add key/value pairs before the first build, so the app never starts without its configuration.
2. **The deployment's Env tab.** After creation, open the deployment and select the **Env** tab. This is where you add, inspect, and remove variables for the rest of the app's life.

This guide focuses on the Env tab, since that is where you will spend your time after launch day.

## Add a variable

Open your deployment and select the **Env** tab. You will see a form with two fields, **Key** and **Value**, and the list of variables already stored for this deployment.

![The Env tab on a RumptyCloud deployment, with a key and value form and one saved secret](/images/how-to-manage-environment-variables-on-rumptycloud-env.png)

Enter the name your code expects, such as `API_KEY`, then enter its value and select **Save variable**. The value field is masked while you type, so anyone looking over your shoulder in a shared workspace sees dots, not your credentials.

Each saved variable appears in the list below the form with a **Secret** badge and its value hidden behind dots. Next to it you get three controls:

- **Reveal value**, when you need to check what is stored.
- **Copy value**, to paste it into a terminal or another tool without typing it out.
- **Remove**, to delete the variable from the deployment.

## Import a whole .env file

Re-entering ten variables by hand after a rename is tedious. Select **Bulk edit (.env)** and the form switches to a single text area that accepts a full `.env` file.

![The bulk edit view, with a text area that accepts KEY=VALUE lines](/images/how-to-manage-environment-variables-on-rumptycloud-bulk-edit.png)

Paste one `KEY=VALUE` pair per line:

```bash
DATABASE_URL=postgres://user:password@host:5432/app
REDIS_URL=redis://default:host:6379
API_KEY=your-key-here
# comments and blank lines are ignored
```

The panel accepts comments and blank lines, the same syntax your local `.env` file uses. Two things to know before you paste:

- **Existing keys are overwritten.** Pasting a file replaces the value of any key you already stored, so the bulk editor is also how you rotate several credentials in one action.
- **Everything is stored encrypted.** The panel states it plainly: values are kept encrypted and available to the build and the running app.

When you are done, select **Save variables**.

## How values are stored and delivered

The Env tab states the contract in two lines worth quoting, because they answer the questions people ask most:

> Available during the build and at runtime. Saved values apply on the next deploy.

The first line means your code can read the variables anywhere: in framework configuration, in a script that runs during the build, and in the running application. The second line matters when something is not taking effect.

**Changing a variable requires a redeploy.** If you update a value and your app still shows the old behaviour, that is why. Select **Redeploy latest** in the deployment header and the new value reaches the running app. A good habit is to treat every env change as a deploy: save the variable, then redeploy, then confirm in the **Runtime Logs** tab that the app picked it up.

On storage, the platform treats these values as secrets: they are stored encrypted, and the API never echoes them back. The masked field, the dots in the list, and the explicit **Reveal value** button all follow from that design.

## Using the variables in your code

Your application reads environment variables the same way it would anywhere else. In Node:

```js
const apiKey = process.env.API_KEY;
```

One habit matters more than any framework detail: **keep secrets out of anything that ships to the browser.** In Next.js, only variables prefixed with `NEXT_PUBLIC_` reach client-side JavaScript, and a `NEXT_PUBLIC_` variable is readable by every visitor of your site. The same rule applies to Vite's `import.meta.env` values. A database password or a paid API key exposed that way is not stored safely anywhere; it is published.

So split your configuration:

- Values the browser may see (a public site URL, a publishable key) can use the public prefix.
- Everything else stays server-side: read it in server code, API routes, or backend services, and never pass it into a component that renders on the client.

If your deployment builds with a **Dockerfile**, be careful with Docker's own `ENV` instruction. Writing a secret directly into the Dockerfile bakes it into the image permanently. Keep secrets in the Env tab and let your code read them at runtime.

## Rotating and removing variables

Credentials get leaked, teams rotate API keys, and test values graduate to production. The Env tab handles all three:

- **Update a value.** Type the key with its new value and select **Save variable**, or paste an updated `.env` file through **Bulk edit (.env)**, which overwrites existing keys. Redeploy afterwards so the change takes effect.
- **Remove a variable.** Select **Remove** on its row, then redeploy. The running app keeps working with the old value until the redeploy, which is usually what you want for a clean cutover: add the replacement first, redeploy, then remove the old one.

## Common mistakes to avoid

- **Committing a `.env` file.** Add `.env` to your `.gitignore` before your first commit. The Env tab exists precisely so the repository never needs the real values.
- **Changing a variable and forgetting to redeploy.** Saved values apply on the next deploy, not instantly.
- **Publishing a secret with a public prefix.** `NEXT_PUBLIC_` and friends put the value in the browser bundle. Check your prefix before you deploy, not after.
- **A missing variable at runtime.** If the app crashes or misbehaves right after a deploy, open the **Runtime Logs** tab. A missing-variable error points straight at a name you have not saved yet or a typo in the key.

## Conclusion

Environment variables are the quiet part of a deployment, and the part that bites hardest when done carelessly. RumptyCloud gives them a proper home: encrypted storage, masked values, a bulk editor for whole `.env` files, and a redeploy flow that makes changes predictable. Set them once, rotate them without fear, and keep your repository free of credentials.

## About the author

John Chinedu Enechukwu is a Nigerian Web3 educator and builder. He founded NextChain, a community that has onboarded 200+ young Africans into emerging tech, and he builds and writes at the intersection of Web3 and AI. He shares build-in-public notes and guides on X as [@The_Real_EJC](https://x.com/The_Real_EJC).
