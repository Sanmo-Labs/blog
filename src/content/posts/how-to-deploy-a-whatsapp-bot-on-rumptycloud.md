---
title: "How to Deploy a WhatsApp Bot on RumptyCloud"
description: "Build a WhatsApp bot with the Meta Cloud API in Node.js, deploy it to RumptyCloud from GitHub, and keep it answering messages around the clock."
publishedDate: 2026-11-26
updatedDate: 2026-11-26
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/whatsapp-bot-social.jpg"
coverWidth: 1200
coverHeight: 630
card: "/journal/img/whatsapp-bot-card.webp"
hero: "/journal/img/whatsapp-bot-hero.webp"
coverAlt: "A cream chat bubble carrying a green message to a small orange bot, with a reply line looping back, on a blue Journal background"
tags:
  - "WhatsApp"
  - "Bots"
  - "Node.js"
  - "Deployment"
draft: false
---

In Nigeria, and honestly across most of Africa, the app your users already have open is WhatsApp. A bot that answers there reaches people no new download ever will. In this guide, we will build a small WhatsApp bot in Node.js using the Meta Cloud API, deploy it to RumptyCloud, and wire Meta to it. The Telegram shape covers the deploy; the new part is Meta's webhook handshake, so we will take that slowly.

## What you will need

- A RumptyCloud account and workspace
- A GitHub repository (we will create the bot locally and push it)
- A Meta developer account with a WhatsApp app (the paperwork takes longer than the code, so start there first)

## 1. Build the bot

A WhatsApp bot is a web server that Meta calls whenever a message arrives, plus one extra handshake: before Meta will send you anything, it calls your URL once with a `hub.challenge` you must echo back to prove the URL is yours. Here is a complete `server.js` using Express:

```js
const express = require("express");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const PORT = process.env.PORT || 8080;

// One-time handshake: Meta checks this URL is really yours
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// Every incoming message lands here
app.post("/webhook", (req, res) => {
  for (const entry of req.body.entry || []) {
    for (const change of entry.changes || []) {
      for (const msg of change.value?.messages || []) {
        if (msg.type === "text") {
          reply(msg.from, `Hello! I am live on RumptyCloud. You said: ${msg.text.body}`);
        }
      }
    }
  }
  res.sendStatus(200); // always ack fast; Meta retries anything that is not a 200
});

async function reply(to, text) {
  await fetch(`https://graph.facebook.com/v27.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bot listening on port ${PORT}`);
});
```

Three details in this file matter for a clean deployment:

- The server reads `process.env.PORT` and binds `0.0.0.0`, so RumptyCloud's routing works without extra configuration.
- The `/health` endpoint gives the platform a path to health-check.
- The webhook handler answers `200` immediately, before the reply is sent. Meta marks a webhook delivery failed if it times out or gets anything other than a 200, then retries it. If you wait for the WhatsApp API call to finish before responding, a slow reply can double your messages.

Add a `package.json` with `"start": "node server.js"` and Express as a dependency, then push the repo to GitHub.

## 2. Get your WhatsApp credentials

In the [Meta developer dashboard](https://developers.facebook.com), open your WhatsApp app and go to **WhatsApp → API Setup**. Note three values:

- **Phone number ID** (`PHONE_NUMBER_ID`), shown next to the test number Meta gives every app.
- **Access token** (`WHATSAPP_TOKEN`). The token on that page is temporary and expires in about 24 hours, which is fine for this guide. For a production bot, create a permanent token under a System User in Business Settings.
- A **verify token** (`VERIFY_TOKEN`). This one is yours to invent: any random string you will paste into Meta's webhook settings later.

The test number can only message up to five recipient numbers you add on that same page, so add your own phone there for testing.

## 3. Deploy it

In the console, open **Deployments** and select **New deployment**. Connect the repository, pick the branch, and use these settings:

| Console field | Recommended value |
| --- | --- |
| Application type | Web Service/Backend |
| Build with | Auto |
| Readiness/health check path | `/health` |
| Port | 8080 |

Do not put any token in the code. Add environment variables before or right after the first deploy: open the deployment's **Env** tab and add `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, and `VERIFY_TOKEN`. Saved values apply on the next deploy, so trigger a redeploy after adding them.

Once the deployment is active, the console shows its public URL, something like `https://your-bot.rumptycloud.app`. Open `https://your-bot.rumptycloud.app/health` in a browser; if you see the healthy response, the bot is live.

## 4. Point WhatsApp at the bot

Back in the Meta dashboard, go to **WhatsApp → Configuration → Webhook**:

1. Set the **Callback URL** to `https://your-bot.rumptycloud.app/webhook`.
2. Set **Verify token** to the same string you saved as `VERIFY_TOKEN` and select **Verify and save**. This fires the `hub.challenge` handshake from step 1; if it fails, check the Env tab first, a redeploy that has not picked up the variables yet is the usual culprit.
3. Under **Webhook fields**, subscribe to **messages**. Without this, Meta verifies your URL and then never sends it anything.

Now send a message from your test phone to the test number. The reply proves the whole chain: Meta, the webhook, your deployment, and the Graph API call back.

## 5. Keep it healthy

Three habits keep a WhatsApp bot stable in production:

- **Watch the logs.** The deployment's **Logs** tab shows every webhook delivery and every stack trace. If messages stop arriving, the first place to look is whether Meta's POSTs are reaching you at all.
- **Treat tokens as secrets.** If the WhatsApp token ever leaks, rotate it in Business Settings, update `WHATSAPP_TOKEN` in the Env tab, and redeploy. Tokens are credentials to your users' chats; they belong in the Env tab, never in the repo.
- **Know your numbers.** The test number only talks to the five recipients you added, and replies to a user are free within 24 hours of their last message. Business-initiated conversations outside that window use template messages and are billed, so check Meta's pricing page before you build a daily blast.

- **Verify it is really Meta.** Every webhook delivery is signed with your app secret in the `X-Hub-Signature-256` header (an HMAC-SHA256 of the raw body). Once real users are talking to the bot, check that signature before trusting a message; it is the one guard against someone POSTing fake messages at your public URL.

One platform-level note: on plans with scale-to-zero, the deployment sleeps after a few idle minutes and a cold start adds a few seconds to the first request. Meta retries failed deliveries, so occasional sleeps mostly heal themselves, but for a bot that must never miss a message, pick a runtime size that stays awake. Our guide on choosing a runtime size covers the trade-off.

## Wrapping up

The same shape deploys any webhook bot: Telegram, Slack, or anything else that calls you over HTTP. Keep the server stateless (store state in a database, not in memory), keep secrets in environment variables, and always acknowledge Meta before you do the slow work. The bot survives every redeploy without losing a message.
