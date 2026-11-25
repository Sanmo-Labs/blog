---
title: "How to Use Rumpty MCP"
description: "Connect your AI assistant to RumptyCloud, find your workspaces, and check a failed deployment from your editor."
publishedDate: 2026-11-25
author: "Odukoya Abdullahi"
authorType: "Person"
cover: "/journal/img/rumpty-mcp-social.jpg"
coverWidth: 1200
coverHeight: 630
card: "/journal/img/rumpty-mcp-card.webp"
hero: "/journal/img/rumpty-mcp-hero.webp"
coverAlt: "A cream terminal connected to a cloud with log lines on a blue Journal background"
tags:
  - "MCP"
  - "Deployment"
draft: false
---

You push a change, the deploy fails, and a minute later you're hunting for the right run in the dashboard. If you're already in Codex, Cursor, or Claude Code, you can pull up that build log right there. Rumpty MCP connects your assistant to your RumptyCloud account so it can look up deployments, fetch logs, and make changes when you ask.

For your first run, all you need is a RumptyCloud account and an MCP client. An existing deployment helps if you want to follow the log example.

## Connect your assistant

In your client's MCP settings, add a remote server named `rumpty` with this URL. If it asks for a transport, choose **Streamable HTTP**.

```text
https://mcp.rumptycloud.com/mcp
```

### In Codex

Open **Settings → MCP servers → Add server**. Name it `rumpty`, choose **Streamable HTTP**, and paste the URL. Leave the bearer token and headers blank for browser sign-in. Save, select **Restart**, then go back to **MCP servers** and select **Authenticate** next to `rumpty`. [Codex MCP setup](https://learn.chatgpt.com/docs/extend/mcp?surface=app#configure-in-the-chatgpt-desktop-app)

RumptyCloud opens a **Connect an app** page in your browser. Check the app name and return address, then select the permissions you need before approving. For the log walkthrough below, start with **View workspace**. [Rumpty MCP sign-in docs](https://docs.rumptycloud.com/mcp/#sign-in-with-your-browser)

![RumptyCloud's Connect an app screen for Codex, showing the requested permissions and Approve button](/images/how-to-use-rumpty-mcp-codex-approval.webp)

If the desktop app gets stuck on **Starting** or gives a connection error before the browser opens, start sign-in from a terminal with the Codex CLI. Use the same server name you saved in Settings. Once you approve in the browser, return to Codex and type `/mcp` to check the connection. [Codex MCP login](https://learn.chatgpt.com/docs/extend/mcp?surface=cli#other-cli-commands)

```bash
codex mcp login rumpty
```

### In Cursor

In Cursor, you can put this in `~/.cursor/mcp.json` for all projects. If the file already has an `mcpServers` section, add `rumpty` alongside your other entries.

```json
{
  "mcpServers": {
    "rumpty": {
      "url": "https://mcp.rumptycloud.com/mcp"
    }
  }
}
```

Reload Cursor or toggle the server in the MCP settings if it hasn't picked up the change. When your browser opens RumptyCloud, sign in, review the permissions, and approve the connection. [Rumpty MCP sign-in docs](https://docs.rumptycloud.com/mcp/#sign-in-with-your-browser)

To disconnect either client later, go to **Manage Profile → My profile → Personal API keys** and revoke its connected app entry.

## Use an API key if your client needs one

Create a key under **Manage Profile → My profile → Personal API keys**. Copy it when it appears and use your client's secret input or environment-variable support to send it as an `Authorization: Bearer <key>` header. The header takes precedence over browser sign-in. What the assistant can do depends on both the key's permissions and your role in the workspace. [RumptyCloud API key permissions](https://docs.rumptycloud.com/settings/api-keys/#permissions)

If you already have the Rumpty CLI, version 0.2.0 and later can print setup steps for your client. Version 0.3.0 and later can also write the config. For example, to use an API key with Claude Code, run this from your project folder and launch Claude Code with `RUMPTY_API_KEY` set in its environment.

```bash
rumpty mcp claude-code
rumpty mcp install claude-code
claude mcp list
```

The install command adds `rumpty` to `.mcp.json` and references the environment variable. The same CLI has setup instructions for Cursor, VS Code, Codex, Gemini, Zed, and Claude Desktop. [Rumpty CLI setup reference](https://docs.rumptycloud.com/cli/mcp/)

## Find a workspace and check a build

Start with a question that has an easy answer to check.

> Use Rumpty MCP to list my workspaces and show their slugs.

The assistant should call `list_workspaces`. Use the slug it returns in your next message, especially if staging and production have deployments with the same name.

> In the `staging` workspace, find the latest failed build for `api`. Show me the first error that stopped the build and tell me which commit it came from, if the run has that information.

Swap `staging` and `api` for your own names. When we tried this on a portfolio deployment, Codex checked both build logs and found zero failed builds. Its next step was to check whether the expected commit had landed on `master`, the branch set to auto-deploy.

![Codex uses Rumpty MCP to check a portfolio deployment and reports that both builds passed](/images/how-to-use-rumpty-mcp-codex-build-check.webp)

To cross-check the answer, open **Deployments → your deployment → Runs** in the RumptyCloud console. The same two runs appear there, one marked **Live** and the other **Succeeded**.

![The RumptyCloud Runs tab showing the portfolio deployment's Live and Succeeded runs](/images/how-to-use-rumpty-mcp-runs.webp)

If a build passed and the app keeps restarting, ask for the runtime logs. For a connection you only use to inspect deployments, you can put that limit on the server URL itself. [Rumpty MCP tool and URL options](https://docs.rumptycloud.com/mcp/#limit-what-the-agent-sees)

```text
https://mcp.rumptycloud.com/mcp?workspace=staging&read_only=true&features=deployments
```

When you do want to ship something, give the assistant the workspace, repo, and branch. Ask it to show you the settings before starting the deploy, then wait for the build and give you the live URL or the error that stopped it. Creating resources can incur charges, so check the plan before you approve. [Rumpty MCP deployment tools](https://docs.rumptycloud.com/mcp/#tools)

## If the tools don't show up

- **No Rumpty tools.** Restart the client and check that the server URL includes `/mcp`.
- **`401 Unauthorized`.** Reconnect if you signed in through the browser. If you used a key, check that it is still active and that the client can read `RUMPTY_API_KEY`. A desktop app opened from the dock may not inherit a variable you set in your terminal.
- **Logs work but deploys don't.** Check the workspace role, the key's permissions, and whether the server URL has `read_only=true`.

[Rumpty MCP troubleshooting](https://docs.rumptycloud.com/mcp/#troubleshooting)
