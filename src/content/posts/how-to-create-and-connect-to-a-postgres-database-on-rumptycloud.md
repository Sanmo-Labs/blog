---
title: "How to Create and Connect to a Postgres Database on RumptyCloud"
description: "Create, connect to, and manage a Postgres database on RumptyCloud, from deployment to retrieving credentials to connecting with psql and GUI tools" 
publishedDate: 2026-08-16
author: "Richard Coker"
cover: "/images/how-to-create-and-connect-to-a-postgres-database-on-rumptycloud.png"
coverAlt: "How to Create and Connect to a Postgres Database on RumptyCloud, with the RumptyCloud and Postgres logos"
tags:
  - "Database"
  - "Postgres"
  - "Getting Started"
draft: false
---

RumptyCloud offers managed Postgres databases. In this guide we will create your database, obtain connection credentials, and connect using both the command line and a GUI tool.

## What you will need

Before you begin, make sure you have:

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- PostgreSQL CLI (`psql`) installed — [download here](https://www.postgresql.org/download/)
- Or a database GUI tool like [pgAdmin](https://www.pgadmin.org/) or [DBeaver](https://dbeaver.io/) installed

## 1. Create a database 

[Sign in to the RumptyCloud console](https://console.rumptycloud.com/signin), select your workspace, open **Databases**, and select **Create database**.

1. **Select Postgres** as the database engine.
2. **Choose the database version** (e.g., PostgreSQL 16).
3. **Select a size** based on your needs:

   | Size | Price | vCPU | Memory | Storage |
   | --- | --- | --- | --- | --- |
   | **Playground** | Free | 1 vCPU | 256 MB | 2 GB |
   | **Seed** | NGN 2,092.50/mo | 1 vCPU | 512 MB | 5 GB |
   | **Sprout** | NGN 4,158.00/mo | 1 vCPU | 1 GB | 15 GB |
   | **Bloom** | NGN 8,302.50/mo | 2 vCPU | 2 GB | 30 GB |

4. **Choose a Zone** (default region is olas-closet).
5. **Name your database** (e.g., `rumpty-db`).
6. **Enable the Public connection endpoint** : this allows you to connect from your local machine.

## 2. Obtaining Your Credentials
Once the database is created you will be redirected to the database page.
![ Database Overview Page](/images/how-to-create-and-connect-to-a-postgres-database-on-rumptycloud-overview.png)

1. In the database overview page, locate the **Connection** section.
2. Copy either:
   - The **Full Connection String** (includes everything you need)
   - The **Password** (to use with a different connection string )
> **Note:** Passwords are set when the database is provisioned and cannot currently be rotated from the console. Store your credentials securely.


## 3. Connecting to Your Database
**Prerequisite:** PostgreSQL client tools installed on your machine.

# Option A: Connect Using psql(CLI)
Using the full connection string copied earlier
```bash
psql "postgresql://username:password@host:5432/database"
```
Or connect interactively
```bash
psql -h your-host -U your-username -d your-database -p 5432
```
You'll be prompted for the password. Paste it when prompted

# Option B: Connect Using a GUI tool

**Using pgAdmin**
1. Open pgAdmin and click Add New Server.
2. In the General tab:
    - Name: RumptyCloud DB (or any name you prefer)
3. In the Connection tab:
    - Host name/address: Your database host 
    - Port: 5432 
    - Maintenance database: Your database name 
    - Username: Your database username 
    - Password: Click Save Password and enter your password 
4. Click Save to connect.

**Using DBeaver**
1. Open DBeaver and click New Database Connection.
2. Select PostgreSQL and click Next.
3. Fill in:
    - Host: Your database host
    - Port: 5432
    - Database: Your database name
    - Username: Your database username
    - Password: Your database password
    - Click Test Connection to verify.
4. Click Finish to connect.

## 4. Monitor Your Database

In the database overview page, scroll down to the **Metrics** section. Here you can track key performance indicators for your database, including:

- **CPU Usage** — Monitor processing load on your database instance
- **Memory Usage** — Track RAM consumption to identify potential bottlenecks
- **Disk Usage** — Keep an eye on storage consumption to avoid running out of space
- **Bandwidth** — Monitor network traffic in and out of your database

You can view metrics across different time ranges:

| Time Range | Best For |
| --- | --- |
| **15M** | Real-time debugging and immediate issue detection |
| **1H** | Short-term performance analysis |
| **6H** | Half-day trends and usage patterns |
| **24H** | Daily performance overview |
| **7D** | Weekly trends and capacity planning |

![The Metrics tab, with live charts for the Database](/images/how-to-create-and-connect-to-a-postgres-database-on-rumptycloud-metrics.png)

## Troubleshooting
| Problem | Fix |
| --- | --- |
| `SSL connection is required. Please specify SSL options.` | Enable SSL in your connection settings. Set **SSL mode** to `require` or `verify-full` in pgAdmin/DBeaver, or add `?sslmode=require` to your connection string. |
| `could not connect to server: Connection timed out` | Ensure **Public connection endpoint** is enabled in your database settings. |
| `FATAL: password authentication failed for user "username"` | Double-check your username and password. Click **Reveal** in the console to copy the exact password. |
| `FATAL: database "database" does not exist` | The database name is incorrect. Check the exact database name in your connection string. |
| `SSL error: certificate verify failed` | Set **SSL mode** to `require` instead of `verify-full` to bypass certificate validation. |
| `FATAL: too many connections for role "username"` | Close idle connections or restart your application. Upgrade to a larger instance if needed. |


## Conclusion
You've successfully created a managed Postgres database on RumptyCloud and connected to it using both the CLI and a GUI tool. You now have a database with:

- A fully managed Postgres instance
- Secure SSL-encrypted connections
- Public endpoint access from anywhere
- Connection credentials ready for your applications