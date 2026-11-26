---
title: "How to Deploy a FastAPI App on RumptyCloud"
description: "Build a FastAPI service in Python, deploy it to RumptyCloud from GitHub with an automatic build, and keep it healthy in production."
publishedDate: 2026-11-26
updatedDate: 2026-11-26
author: "John Chinedu Enechukwu"
authorType: "Person"
cover: "/journal/img/fastapi-app-social.jpg"
coverWidth: 1200
coverHeight: 630
card: "/journal/img/fastapi-app-card.webp"
hero: "/journal/img/fastapi-app-hero.webp"
coverAlt: "A cream terminal window showing a Python snippet flowing into a cloud, with an orange check mark, on a blue Journal background"
tags:
  - "FastAPI"
  - "Python"
  - "Deployment"
draft: false
---

FastAPI has become the default way Python developers ship APIs: type-hinted endpoints, automatic docs, and async speed, all with less ceremony than Django. And the deployment can be just as light. Where our Django guide walked a virtual machine, Gunicorn, and Nginx from the ground up, a FastAPI app needs none of that on RumptyCloud: you push a repository, the platform builds it, and it is live. In this guide, we will build a small FastAPI service, deploy it from GitHub, and cover the details that keep it healthy.

## What you will need

- A RumptyCloud account and workspace
- A GitHub repository (we will create the app locally and push it)
- Python 3.10 or newer locally

## 1. Build the app

A FastAPI service is a single Python file that exposes HTTP endpoints and binds the port the platform gives it. Here is a complete `main.py`:

```python
import os

import uvicorn
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/hello/{name}")
def hello(name: str):
    return {"message": f"Hello, {name}! I am live on RumptyCloud."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
```

Add a `requirements.txt`:

```text
fastapi
uvicorn
```

Three details in these files matter for a clean deployment:

- The app binds `0.0.0.0` and reads `PORT`, the environment variable the platform injects from the deployment's **Port** setting. RumptyCloud's docs call a port mismatch the most common reason a deployment builds successfully but never becomes active, so this is the detail to get right first.
- The `/health` endpoint returns a plain successful response with no authentication, which is exactly what the platform's readiness check polls before marking the deployment active.
- The `if __name__ == "__main__"` block runs uvicorn programmatically, so the start command is simply `python main.py`. One command, nothing else to configure.

Push the repo to GitHub before moving on.

## 2. Deploy it

First connect GitHub once per account: go to **Settings → GitHub**, select **Connect GitHub App**, and authorize it. The docs recommend **Only select repositories** so only the repos you choose are visible to workspace members.

Then, in the console, open **Compute → Deployments → New deployment**. Choose your repository and branch; the platform inspects the repo and pre-selects an application type and build method for you. Confirm these settings:

| Console field | Recommended value |
| --- | --- |
| Application type | Web Service/Backend |
| Build with | Auto |
| Readiness/health check path | `/health` |
| Port | 8080 |

Auto detects a Python stack and runs the build for you, so there is no server to configure. If your code lives in a subfolder of a monorepo, set **Root directory** (for example `apps/api`) and everything else applies the same.

Any secrets go in environment variables, never in code: add them before the first deploy or later from the deployment's **Env** tab. Values are stored encrypted and are available during the build and at runtime; saved values apply on the next deploy, so trigger a redeploy after adding them.

One trap to know: never set `PORT` yourself, not as an environment variable and especially not in a start command like `PORT=3000 python main.py`. The port your app receives always comes from the **Port** setting, and a start command that overrides it makes the app bind one port while traffic and health checks go to another. The deployment will build fine and never wake up. To change ports, change the **Port** setting.

Once the deployment is active, the console shows its public URL, something like `https://your-api.rumptycloud.app`. Open `https://your-api.rumptycloud.app/hello/Ada` in a browser and you should see the JSON greeting. FastAPI's automatic docs live at `/docs` on the same URL, which makes a handy second smoke test.

## 3. Mind the filesystem

Deployment filesystems are wiped on every deploy. If the app writes anything that must survive, such as a SQLite database or an uploaded file, you have two options:

- Tick **Add persistent storage** when creating the deployment and pick a mount path (for example `/data`) and size. Everything written under that path survives deploys and restarts. Volumes come with trade-offs: deploys briefly stop the app, and a volume serves a single instance.
- Or keep state in a managed database instead. Our guide on creating and connecting to a Postgres database covers the whole flow, and for anything multi-user it is the sturdier home.

## 4. Keep it healthy

- **Watch the builds.** The deployment's **Runs** tab records every run and what triggered it, and build logs stream live while a build is in progress. With auto-deploy on, every push to the branch ships a new build, and RumptyCloud cancels older queued runs automatically when a newer one starts.
- **Read the security scan.** Every successful build is scanned automatically; the **Security** tab shows the latest report grouped by severity. For a Python app this catches vulnerable pinned dependencies before they ship.
- **Watch the runtime logs.** The **Logs** tab shows every request and every stack trace while the app runs. A 500 that only happens on real traffic shows up here first.
- **Pick the plan deliberately.** The Free size gives you 512 MB of RAM and sleeps when idle, with a few seconds of cold start on the first request after a sleep. That is fine for a demo API, but an endpoint that must always answer needs a paid size with the app kept always on. Our guide on choosing a runtime size walks the trade-offs.

## Wrapping up

The same shape deploys any Python web service: Flask, Starlette, or a Django app served by an ASGI server. Keep the app stateless, keep secrets in the Env tab, let the platform own the server, and every push to your branch ships a new build without you touching a terminal.
