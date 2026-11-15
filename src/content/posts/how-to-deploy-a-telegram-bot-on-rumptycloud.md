---
title: "How to Deploy a Telegram Bot on RumptyCloud"
description: "Build a Telegram bot with a webhook in Node.js, deploy it to RumptyCloud from GitHub, secure it with a secret token, and keep it healthy."
publishedDate: 2026-11-15
updatedDate: 2026-11-15
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/telegram-bot-social.jpg"
coverWidth: 1260
coverHeight: 760
coverAlt: "Journal illustration for How to Deploy a Telegram Bot on RumptyCloud"
card: "/journal/img/telegram-bot-1260.webp"
hero: "/journal/img/telegram-bot-2560.webp"
tags:
  - "Telegram"
  - "Bots"
  - "Node.js"
  - "Deployment"
draft: false
---

A Telegram bot is one of the most useful things a developer can ship: it answers customers, sends reminders, and runs small workflows, all inside an app people already open every day. In this guide, we will build a small webhook bot in Node.js, deploy it to RumptyCloud, and wire Telegram to it.

## What you will need

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- A GitHub repository (we will create the bot locally and push it)
- A Telegram bot token from [@BotFather](https://t.me/BotFather) (send `/newbot` and follow the prompts)

## 1. Build the bot

A webhook bot is just a web server that Telegram calls whenever a message arrives. Here is a complete `server.js` using Express:

```javascript
const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET = process.env.WEBHOOK_SECRET;
const PORT = process.env.PORT || 8080;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.post(`/webhook/${SECRET}`, (req, res) => {
  const msg = req.body.message;
  if (msg && msg.text === "/start") {
    reply(msg.chat.id, "Hello! I am live on RumptyCloud.");
  }
  res.sendStatus(200);
});

async function reply(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bot listening on port ${PORT}`);
});
```

Three details in this file matter for a clean deployment:

- The server reads `process.env.PORT` and binds `0.0.0.0`, so RumptyCloud's routing works without extra configuration.
- The `/health` endpoint gives the platform a path to health-check.
- The webhook path contains a secret (`WEBHOOK_SECRET`), so random internet traffic cannot trigger your bot.

Add a `package.json` with `"start": "node server.js"` and Express as a dependency, then push the repo to GitHub.

## 2. Deploy it

In the console, open **Deployments** and select **New deployment**. Connect the repository, pick the branch, and use these settings:

| Console field | Recommended value |
| --- | --- |
| Application type | **Web Service/Backend** |
| Build with | **Auto** |
| Readiness/health check path | `/health` |
| Port | `8080` |

Do not put the bot token in the code. Instead, add environment variables before or right after the first deploy: open the deployment's **Env** tab and add `BOT_TOKEN` and `WEBHOOK_SECRET`. Saved values apply on the next deploy, so trigger a redeploy after adding them.


Once the deployment is active, the console shows its public URL, something like `https://your-bot.rumptycloud.app`. Open `https://your-bot.rumptycloud.app/health` in a browser; if you see the healthy response, the bot is live.

## 3. Point Telegram at the bot

Tell Telegram where to deliver messages. Run this locally (or from any terminal), filling in your token and the deployment URL:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-bot.rumptycloud.app/webhook/<YOUR_WEBHOOK_SECRET>"
```

Telegram answers with `{"ok":true}`. Open your bot in Telegram and send `/start`. If it replies, the whole chain works: Telegram, the webhook, your deployment, and the reply API call.

## 4. Keep it healthy

Two habits keep a bot stable in production:

- **Watch the logs.** The deployment's **Logs** tab shows every request and every stack trace. A bot that crashes on a malformed update will show it here immediately.
- **Treat the token as a secret.** If a token ever leaks, revoke it with BotFather (`/revoke`) and update `BOT_TOKEN` in the Env tab, then redeploy.

## Wrapping up

The same shape deploys any webhook bot: WhatsApp, Slack, or anything else that calls you over HTTP. Keep the server stateless (store state in a database, not in memory), keep secrets in environment variables, and the bot survives every redeploy without losing a message.
