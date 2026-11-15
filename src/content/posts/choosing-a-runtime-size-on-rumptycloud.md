---
title: "Choosing a Runtime Size on RumptyCloud"
description: "Free, Tiny, and Starter: what each RumptyCloud runtime size gives you, what it costs in Naira, and how to pick the right one for your app."
publishedDate: 2026-11-15
updatedDate: 2026-11-15
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/runtime-sizes-social.jpg"
coverWidth: 1260
coverHeight: 760
coverAlt: "Journal illustration for Choosing a Runtime Size on RumptyCloud"
card: "/journal/img/runtime-sizes-1260.webp"
hero: "/journal/img/runtime-sizes-2560.webp"
tags:
  - "Deployment"
  - "Billing"
draft: false
---

When you create a deployment on RumptyCloud, the form asks you to pick a **runtime size** before the first build runs. That choice decides how much CPU and memory your app gets, whether it sleeps when idle, and what it costs. This guide walks through the three sizes and how to choose.

## What you will need

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- A repository to deploy (see [Deploy an app](https://blog.rumptycloud.com/blog/how-to-deploy-nodejs-app-on-rumptycloud/) for the full walkthrough)

![Runtime size panel on the New deployment form](/images/choosing-a-runtime-size-on-rumptycloud-runtime-size.png)


## The three sizes

| Size | Slug | vCPU | RAM | Transfer | Price |
| --- | --- | --- | --- | --- | --- |
| **Free** | `deploy-free` | Up to 1 | 512 MB | 50 GB | Free |
| **Tiny** | `deploy-tiny` | Up to 1 | 512 MB | 50 GB | NGN 3.70/hr, up to NGN 2,699.28/mo |
| **Starter** | `deploy-starter` | Up to 1.5 | 1 GB | 75 GB | NGN 7.40/hr, up to NGN 5,399.55/mo |

Free and Tiny have the same compute underneath: up to 1 vCPU and 512 MB of RAM. The difference is what happens when nobody is using your app, and what you get for it.

## Free: five apps, sleeps when idle

The **Free** size runs up to 5 apps per account at no cost. Free apps use **automatic scale-to-zero**: when traffic stops, the app sleeps, and the next request wakes it again. That wake-up takes a few seconds, which is why a free app can feel slow on the first visit after a quiet spell and instant afterwards.

Free is the right size for portfolios, internal tools, side projects, and anything in early development. This blog's example apps, a small API, a landing page, a docs site, all live happily on Free.

## Tiny and Starter: always-on compute

Paid sizes **bill hourly for the compute that runs**. A Tiny deployment costs NGN 3.70 per hour, which lands at about NGN 2,700 per month if the app stays up around the clock. Starter doubles the RAM (1 GB) and adds half a vCPU for NGN 7.40 per hour, about NGN 5,400 per month.

On paid sizes, scale-to-zero is **optional**. You choose whether the app sleeps when idle (and pays nothing while asleep) or stays warm around the clock (and pays the hourly rate for the uptime). A webhook bot that must answer instantly, a cron-driven worker, or a small production API for real users are the cases that justify staying warm.

## How to choose

Ask three questions about the app:

1. **Is it for real users right now?** If not, Free. Ship first, upgrade when someone besides you is hitting it.
2. **Does it need more than 512 MB of memory?** Node and Python web apps rarely do at low traffic. If your app is a data-cruncher or a fat monolith, Starter's 1 GB is the floor.
3. **Does it need to answer instantly around the clock?** A Telegram bot receiving webhooks or an API with SLA-ish users wants to stay warm: Tiny at minimum.

One practical note: the 5 free apps are per account, not per workspace. If you have hit the cap and genuinely need another free app, the cheapest path is usually archiving something that no longer earns its slot, rather than paying for a duplicate.

## Wrapping up

Start on Free, watch the app in the console, and move up only when a real constraint pushes you: memory pressure, cold starts annoying users, or traffic that outgrows 50 GB of transfer. The size is a dropdown on the deployment form, not an architecture decision, so the cost of choosing small first and upgrading later is just a click.
