---
title: "How to Point a Custom Domain at Your RumptyCloud App"
description: "Give your RumptyCloud deployment or VM its own domain: add a subdomain, create the CNAME and TXT records, verify, and go live over HTTPS."
publishedDate: 2026-11-15
updatedDate: 2026-11-15
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/custom-domains-social.jpg"
coverWidth: 1200
coverHeight: 630
coverAlt: "A cream domain bar and two DNS record rows joining at a lime check before an orange app, on a blue Journal background"
card: "/journal/img/custom-domains-card.webp"
hero: "/journal/img/custom-domains-hero.webp"
tags:
  - "Deployment"
  - "Domains"
  - "Networking"
draft: false
---

Every RumptyCloud deployment already serves a `*.rumptycloud.app` address, and that is often enough while you build. When it is time to share the app with real users, you want your own name in the address bar. In this guide, we will point a subdomain like `app.yourdomain.com` at a RumptyCloud deployment, add the DNS records, and go live over HTTPS. The same console flow covers virtual machines.

## What you will need

- A RumptyCloud deployment or VM that is running (see [Deploy an app](https://blog.rumptycloud.com/blog/how-to-deploy-nodejs-app-on-rumptycloud/) if you need one)
- A domain you control, with access to its DNS settings at your registrar or DNS provider

## 1. Open the deployment's Settings


In the console, open the deployment, then select the **Settings** tab and find **Custom domains**.

![Custom domains panel on a deployment's Settings tab](/images/how-to-point-a-custom-domain-at-your-rumptycloud-app-custom-domains.png)

## 2. Add your domain

Enter a **subdomain**, for example `app.yourdomain.com`, and save it.

> Use a subdomain, not the bare root. Root domains (`yourdomain.com`) are not supported yet, so `app.yourdomain.com` or `www.yourdomain.com` are the shapes that work today.


## 3. Create the DNS records

RumptyCloud shows the exact records to create: a **CNAME** record and a **TXT** record. Open your DNS provider (Cloudflare, Namecheap, Whogohost, wherever the domain lives) and add both, copying the names and values exactly as shown.


Two things that trip people up here:

- If your DNS provider proxies traffic (the orange cloud on Cloudflare), you can leave it proxied or set it to DNS only; the TXT record is what carries verification, so it must be added either way.
- If the domain previously pointed somewhere else, the old record has to be removed or replaced. Two records claiming the same name confuse verification.

## 4. Verify

Back in the console, click **Verify**. Verification issues a TLS certificate for the domain, which can take a minute. DNS changes themselves can take a few minutes to an hour to propagate, depending on your provider.


When the domain shows **Verified** or **Active**, your app is served over HTTPS at your own address, and the old `*.rumptycloud.app` URL keeps working too. Both addresses hit the same deployment, so nothing about your app changes.

## If verification will not go green

Work down this list:

1. **Check the records for typos.** The CNAME value and the TXT value must match the console exactly; a trailing space or a pasted name with the domain twice will fail quietly.
2. **Give it time.** A record added minutes ago may not be visible to the verifier yet. Wait five to ten minutes and click **Verify** again.
3. **Check for a conflicting record.** If the same subdomain already has an A record or an old CNAME, remove the old one.
4. **Confirm the domain at a lookup tool.** A tool like `dig app.yourdomain.com CNAME` should return the value the console showed before you retry.

## Same flow on a virtual machine

A VM points at your domain the same way: open the VM's **Settings** tab, enter the subdomain under **Custom Domains**, click **Add domain**, copy the DNS records shown, and click **Verify** once the records have propagated. The VM's web app then serves over HTTPS at your domain.

## Wrapping up

A custom domain takes about ten minutes of waiting and two DNS records, and it makes the difference between a project and a product people trust with their logins. Once it is live, keep the `*.rumptycloud.app` URL in your back pocket for debugging: if something breaks after a deploy, the stock URL tells you in one visit whether the problem is your app or your DNS.
