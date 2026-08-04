---
title: "How to Deploy a Node.js App on RumptyCloud"
description: "Deploy a Node.js app from GitHub with RumptyCloud's Auto build option, environment variables, health checks, logs, and automatic deployments."
publishedDate: 2026-08-04
updatedDate: 2026-08-04
author: "Olalekan Odukoya"
cover: "/images/how-to-deploy-nodejs-app-rumptycloud-banner.png"
coverAlt: "How to Deploy a Node.js App on RumptyCloud, with the RumptyCloud and Node.js logos"
tags:
  - "Deployment"
  - "Node.js"
  - "GitHub"
draft: false
---

RumptyCloud lets you deploy a Node.js application directly from a GitHub repository. In this guide, we will prepare a small Node.js service, connect its repository, and take it live using the options shown in the RumptyCloud console.

## What you will need

Before you begin, make sure you have:

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- A GitHub repository containing your Node.js application

## 1. Prepare your Node.js app

Your app needs a command that starts its web server. For example, an Express app could use this `server.js` file:

```javascript
const express = require("express");

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({ message: "Hello from RumptyCloud!" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
```

Add a start script to `package.json`:

```json
{
  "name": "rumpty-node-example",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}
```

Run the app locally with `npm start` and check both `http://localhost:8080` and `http://localhost:8080/health`. When it works, commit your changes and push the repository to GitHub.

## 2. Create a deployment

[Sign in to the RumptyCloud console](https://console.rumptycloud.com/signin), select your workspace, open **Deployments**, and select **New deployment**.

The **Source** section connects the deployment to GitHub:

1. Select **Install GitHub App** if GitHub is not connected yet.
2. Choose the GitHub account or organization and grant access to the repository you want to deploy.
3. After returning to RumptyCloud, search for and select your repository.
4. Give the deployment a recognizable **Name**.
5. Confirm the **Branch** you want to deploy.

If the repository is a monorepo, set **Root directory** to the folder that contains the Node.js app. Otherwise, leave it empty.

For a Node.js API or server, select **Web Service/Backend** under **Application type**. RumptyCloud inspects the selected repository and may fill in some of these details for you.

> If a repository is missing from the list, select **Manage repo access on GitHub**, grant access to it, and return to the deployment form.

## 3. Review the app settings

For a typical Node.js service, use the following settings:

| Console field | Recommended value |
| --- | --- |
| Application type | **Web Service/Backend** |
| Build with | **Auto** |
| Build command | Leave empty initially |
| Start command | Leave empty when your `start` script can be detected |
| Readiness/health check path | `/health` for the example above, or `/` |
| Port | `8080` |

**Auto** is the standard choice for a Node.js app. If RumptyCloud discovers a Dockerfile, the form also lets you choose **Dockerfile**. Use that option only when you intend to deploy with the Dockerfile in your repository.

The **Build command** and **Start command** fields are optional overrides. Start with them empty. If your project needs a specific command, enter it there—for example, `npm run build` or `npm start`.

The configured port must match the port used by your app. Reading `process.env.PORT` and falling back to `8080`, as in the example, keeps the two aligned.

## 4. Add environment variables

If your application needs configuration such as a database URL, API key, or session secret, find **Environment variables** and select **Add**. Enter each variable as a **Key** and **Value** pair.

For example:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

Do not add production credentials to your Git repository or commit a production `.env` file.

## 5. Choose a runtime size and deploy

In **Runtime size**, choose a plan with enough CPU and memory for your app. A smaller option is usually a sensible starting point for a lightweight API, and you can adjust it later as usage grows.

Before continuing, review the two checkboxes below the app settings:

- Keep **Start a build after creating this deployment** selected if you want to deploy immediately.
- Keep **Automatically deploy when this branch receives new pushes** selected if future pushes to the branch should start a new deployment.

Select **Create deployment**. If RumptyCloud asks you to review the acceptable use policy, accept it to continue.

You will be taken to the deployment page while the first run is in progress. Select **View logs** to follow it, or open **Runs** and choose the current run. When the status changes from **Building** to **Live**, select **Open app** to visit its public URL.

For the example in this guide, the response will be:

```json
{
  "message": "Hello from RumptyCloud!"
}
```

Your Node.js app is now live.

## Updating your app

If automatic deployment is enabled, push a new commit to the selected branch and RumptyCloud will start another run.

If you prefer to deploy manually, open the deployment and select **Redeploy latest**. The **Runs** tab contains previous runs and their build logs, while **Runtime Logs** shows output from the running app.

## Troubleshooting a failed deployment

If a run fails, open it from **Runs** and review its logs. These checks solve many common Node.js deployment issues:

- Confirm that `package.json` has a working `start` script.
- Make sure the app reads `process.env.PORT` and that its fallback matches the **Port** field.
- Make sure the app listens on `0.0.0.0`, not only `localhost`.
- Confirm that the **Readiness/health check path** returns a successful response.
- Check that all required environment variables have been added.
- Verify the selected **Branch** and **Root directory**.
- Run your install, build, and start commands locally to catch dependency or script errors.

You can update the branch, commands, health-check path, port, and automatic deployment preference from the **Settings** tab. Saved changes apply to the next deployment.

## Add a custom domain

Every successful public deployment receives a RumptyCloud URL. To use your own domain, open **Settings**, find **Custom domains**, add the domain, and follow the DNS instructions shown in the console.

## Conclusion

Once your repository and deployment are connected, your normal workflow is simple:

> Write code → push to GitHub → review the deployment.

RumptyCloud keeps the essential controls—build settings, environment variables, logs, metrics, redeployments, and custom domains—together on the deployment page, so you can focus on shipping your Node.js app.
