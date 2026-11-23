---
title: "How to Deploy One-Click Apps on RumptyCloud"
description: "WordPress, Ghost, n8n, Uptime Kuma and more: launch a production-ready app on RumptyCloud with one short form."
publishedDate: 2026-11-15
updatedDate: 2026-11-15
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/one-click-apps-social.jpg"
coverWidth: 1200
coverHeight: 630
coverAlt: "A cream app catalogue with one orange tile picked, a lime click, and a stack of running cream servers on a blue Journal background"
card: "/journal/img/one-click-apps-card.webp"
hero: "/journal/img/one-click-apps-hero.webp"
tags:
  - "One-Click Apps"
  - "Deployment"
draft: false
---

Half the internet runs on self-hosted software, and for good reason: your data stays yours, you pay the infrastructure bill instead of a subscription, and no vendor decides your roadmap. The catch has always been the setup. Installing WordPress used to mean an SSH session, a database, a web server config, and a certificate. On RumptyCloud, it means a form.

## What one-click apps are

Open the console and pick **One-Click Apps** in the sidebar. You get a catalog of production-ready open-source apps, each deployable in one click, each running in its own isolated environment with durable storage. The catalog today:

- **CMS and publishing:** WordPress 7.1, Ghost 6.53
- **Automation and developer tools:** n8n 2.31, RabbitMQ 4.2, Forgejo 15.0
- **Identity and security:** Authentik, Keycloak, Authelia, Vaultwarden
- **Analytics:** Plausible, Umami
- **Business and teamwork:** Odoo 19, Outline, Kaneo
- **Monitoring and media:** Uptime Kuma, Jellyfin

Sixteen apps, and the version on each card is pinned, so you know exactly what you are launching before you launch it.

## Deploying your first app

Let's walk through the cheapest one, Uptime Kuma: a self-hosted status dashboard that checks your sites every few seconds and alerts you to Slack, Telegram, email, and 90+ other channels when something goes down.

![Deploy form for Uptime Kuma on RumptyCloud](/images/how-to-deploy-one-click-apps-on-rumptycloud-deploy-form.png)

1. Open **One-Click Apps** and select **Deploy Uptime Kuma**.
2. Enter an **app name**. It becomes your app's address on a `rumptycloud.com` subdomain, served over HTTPS with no certificate wrangling. You can attach a custom domain later.
3. Pick a **compute plan**. Each app recommends one; Uptime Kuma suggests Tiny, which runs about NGN 2,700 a month.
4. Check the **estimated cost**. Apps bill by the hour, only while running; the figure on the form is the full-month estimate for the plan you picked.
5. Hit **Deploy**. In a few minutes you have a live Uptime Kuma at your own HTTPS address.

That is the whole flow. The same five steps deploy WordPress (it comes with its own private database and durable storage), n8n for automation, Ghost for a newsletter, or Vaultwarden for a password manager only you control.

## What you actually get

- **Your own app** on a `rumptycloud.com` address with HTTPS included
- **Durable storage** that survives every restart and update, so your posts, workflows, and settings persist
- **Isolation:** the app runs in its own sandbox, and deleting it removes everything, any time

That last one cuts both ways, in the best way. There is no twelve-tab billing portal to hunt through when you no longer need an app; you delete it and it is gone.

## One-click app or a plain deployment?

A one-click app is the right tool when the software already exists and you would rather not assemble it. If you are writing your own code, a [deployment from GitHub](/blog/how-to-deploy-nodejs-app-on-rumptycloud/) is the tool: it builds whatever you push. The two live side by side in the same workspace, so your n8n automations can sit right next to the API you wrote.

## Wrapping up

Self-hosting stopped being a weekend project. Pick an app, name it, pick a plan, deploy. Start with something small like Uptime Kuma or Umami, get a feel for the flow, then put the pieces of your own stack together: WordPress for the site, Outline for the team wiki, n8n glue between them.
