---
title: "How to Deploy a Full-Stack Next.js App with PostgreSQL, Prisma, Redis and Background Workers on RumptyCloud"
description: "Learn how to deploy a full-stack Next.js application on RumptyCloud with PostgreSQL, Prisma, Redis, Docker, background workers and private object storage."
publishedDate: 2026-10-22
author: "Oluwaseun"
authorType: "Person"
cover: "/images/treviqo-production-lessons.png"
coverWidth: 1731
coverHeight: 909
coverAlt: "Treviqo production deployment and reliability on RumptyCloud"
tags:
  - "Deployment"
  - "Next.js"
  - "PostgreSQL"
  - "Docker"
draft: false
---

# How to Deploy a Full-Stack Next.js App with PostgreSQL, Prisma, Redis and Background Workers on RumptyCloud

Deploying a Next.js application is relatively straightforward when it only needs to serve pages. But what happens when your application also requires a database, background jobs, private document storage and other external services?

That's where deployment becomes more interesting.

In this tutorial, I'll walk through how I deployed [Treviqo](https://treviqo.rumptycloud.app), a full-stack application built for the Devcenter Hacktober 2026 hackathon, using RumptyCloud.

Treviqo helps workers organize employment records, preserve documents, review job-exit information and manage outstanding employment-related tasks.

For this deployment, the application uses:

- Next.js 16 and React 19 for the frontend and API.
- PostgreSQL for persistent data.
- Prisma 6 for database access and migrations.
- Redis for rate limiting, background job coordination and worker heartbeats.
- A separate Node.js background worker.
- Private S3-compatible storage for uploaded documents.
- Rumpty AI for document intelligence.
- Docker for reproducible application builds.

By the end, you'll understand how these components fit together, how to configure their deployment, and how to diagnose common production issues.

The implementation details come from Treviqo's actual codebase. Some commands and worker behavior are specific to this project and should be adapted to your own application.

## Prerequisites

Before starting, make sure you have:

- A [RumptyCloud](https://rumptycloud.com) account with access to application deployments, databases and storage.
- A Next.js application hosted in a GitHub repository.
- Node.js and npm installed locally.
- Git installed and your changes committed.
- Docker installed if you want to test the production images locally.
- Basic knowledge of environment variables and PostgreSQL.

For the Treviqo implementation, Node.js 22 LTS is used.

You can explore the application repository here:

[GitHub — Ajayfrizzy/treviqo](https://github.com/Ajayfrizzy/treviqo)

## Step 1: Understand the deployment architecture

Before creating any cloud resources, it's important to understand which components your application requires.

For Treviqo, I didn't deploy the frontend and API as separate services. Next.js serves both through a single web application.

The background worker runs separately because it needs to execute scheduled tasks independently of incoming HTTP requests.

![Full-stack application architecture showing Next.js, PostgreSQL, Redis, background workers, private storage and Rumpty AI](/images/rumptycloud-fullstack-architecture.png)

The architecture contains four main runtime responsibilities.

**Web application:** Handles browser requests, authentication, API routes, document uploads and user interactions.

**PostgreSQL:** Stores application data, including user accounts, employment information, document metadata, sessions and durable background job records.

**Redis:** Supports rate limiting, scheduled job coordination and worker heartbeat information.

**Background worker:** Processes scheduled reminders and cleanup tasks independently of the web application.

The system also connects to private S3-compatible storage and Rumpty AI.

Both the web application and background worker access the same intended PostgreSQL database and Redis environment. They don't require separate production databases.

Database migrations are executed as a separate release operation rather than automatically during web application startup.

This separation makes it easier to manage deployments and troubleshoot failures without combining unrelated responsibilities into one process.

## Step 2: Prepare your Next.js application

Before deploying, ensure your application can build successfully.

From your project directory, install the dependencies:

```bash
npm ci
```

For Treviqo, the following commands validate the implementation:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run worker:build
```

These are project-specific scripts. If you're following this tutorial with another application, use the equivalent validation commands from its `package.json`.

### Configure standalone output

For Docker-based Next.js deployments, standalone output can reduce the runtime image to the files needed to run the application.

In your Next.js configuration, the relevant setting is:

```js
const nextConfig = {
  output: "standalone",
};

export default nextConfig;
```

This is an illustrative configuration excerpt; preserve any additional settings your application needs.

With standalone output, Next.js generates a server entry point that can be run inside a production container.

For Treviqo, the final web runtime starts with:

```bash
node server.js
```

### Prepare Prisma

Treviqo uses Prisma with PostgreSQL.

A basic Prisma datasource configuration looks like this:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

The important part is that Prisma receives its database connection through `DATABASE_URL`.

Do not hardcode production credentials in your Prisma schema or application source.

Once your application builds correctly and its database migrations are committed, you can begin configuring the cloud resources.

## Step 3: Create your RumptyCloud project resources

Sign in to RumptyCloud and open the project or workspace where you want to deploy your application.

From the dashboard, you'll find the areas used to manage deployments, databases, storage and other services.

![RumptyCloud dashboard showing the workspace resource and deployment overview](/images/rumptycloud-resource-overview.png)

For this deployment, we need:

1. A PostgreSQL database.
2. A Redis instance.
3. A web application deployment.
4. A separate worker deployment.
5. A private storage bucket, if the application handles uploaded files.

Treviqo also uses Rumpty AI, which is optional for a general full-stack application.

Create only the resources your application actually needs.

## Step 4: Provision PostgreSQL

PostgreSQL provides persistent storage for the application.

In RumptyCloud, navigate to the **Databases** section and provision a PostgreSQL database using the configuration available for your project.

Treviqo's database runs PostgreSQL 17.

![PostgreSQL database configuration on RumptyCloud showing its engine, version and settings](/images/rumptycloud-postgresql-settings.png)

Once the database is available, identify its connection configuration in the dashboard.

Your application will need a PostgreSQL connection URL with the appropriate database, credentials, network access and TLS settings.

A PostgreSQL connection URL generally follows this structure:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

This is an example of the URL format, not a working credential.

### Configure Prisma's database connection

In the application's runtime environment, define:

```text
DATABASE_URL=<your-postgresql-connection-url>
```

Use the actual connection details provided for your database.

RumptyCloud may provide different public and internal connection options. Choose an endpoint that is reachable from the environment running your application, and follow the provider's connection and TLS guidance.

Do not assume that an internal hostname works from your laptop or that Prisma automatically switches between public and private endpoints.

### Check database metrics

After provisioning, RumptyCloud provides resource information and usage metrics.

![RumptyCloud PostgreSQL resource metrics showing CPU, memory, disk usage and bandwidth](/images/rumptycloud-postgresql-metrics.png)

Monitoring resource utilization is useful when diagnosing slow queries, connection-capacity problems or unexpected workload increases.

A database showing as ready in the dashboard does not by itself prove that your deployed application has the correct credentials or can reach it.

You'll verify application connectivity later.

## Step 5: Provision Redis

Redis supports several of Treviqo's application operations.

It is used for:

- Authentication rate limiting.
- Background job scheduling.
- Worker heartbeat tracking.
- Recoverable job coordination.

Open RumptyCloud's **Databases** section and create or identify a Redis resource.

Treviqo's deployed Redis instance uses Redis 8.1.

![RumptyCloud Redis configuration showing the provisioned Redis database and version](/images/rumptycloud-redis-settings.png)

After provisioning, obtain the appropriate Redis connection URL.

Your application should receive it through an environment variable:

```text
REDIS_URL=<your-redis-connection-url>
```

For applications requiring encrypted Redis connections, use the transport specified by the provider.

Do not expose Redis credentials in application logs, screenshots or source control.

### Why Redis is separate from PostgreSQL

For Treviqo, Redis helps the worker determine when jobs are due and provides heartbeat information.

PostgreSQL remains responsible for durable job records and application data.

This separation is important because Redis should not be treated as the permanent source of truth for employment records or completed job history.

Your own application may use Redis differently, depending on its architecture.

## Step 6: Configure environment variables

One of the most important parts of deployment is making sure each running service receives the correct environment variables.

In RumptyCloud, open your application's deployment configuration and navigate to the **ENV** section.

![RumptyCloud Next.js web application environment variables with sensitive values concealed](/images/rumptycloud-web-environment.png)

For Treviqo, the main web application uses variables including:

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Production runtime mode |
| `APP_URL` | Canonical application URL |
| `NEXTAUTH_URL` | Authentication callback origin |
| `SESSION_SECRET` | Authentication secret |
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `S3_ENDPOINT` | S3-compatible storage endpoint |
| `S3_REGION` | Storage region |
| `S3_BUCKET` | API bucket identifier |
| `S3_ACCESS_KEY_ID` | Storage access-key identifier |
| `S3_SECRET_ACCESS_KEY` | Storage secret |
| `RUMPTY_AI_BASE_URL` | Optional AI API base URL |
| `RUMPTY_AI_API_KEY` | Optional AI credential |
| `RUMPTY_AI_MODEL` | Optional model identifier |
| `WORKER_REQUIRED` | Treviqo-specific readiness configuration |

Not every Next.js application needs all these variables.

For example, if your application doesn't upload documents, it may not need S3 configuration.

Similarly, you don't need AI credentials unless your application integrates an AI service.

### Configure web and worker environments separately

The background worker also needs access to the services it uses.

![RumptyCloud background worker environment variable configuration with values concealed](/images/rumptycloud-worker-environment.png)

In Treviqo, the worker requires PostgreSQL and Redis, along with storage credentials for scheduled document-bearing account cleanup.

The worker does not require the web application's authentication session secret or Rumpty AI credentials.

A key lesson here is that sharing the same GitHub repository does not mean two separate deployments automatically share their environment variables.

**Configure every runtime independently.**

RumptyCloud's deployment interface indicates that saved environment-variable changes apply on the next deployment.

Therefore, after modifying an environment variable, verify that the intended service has received the updated configuration.

Never reveal production values in screenshots or place secrets in `NEXT_PUBLIC_*` variables.

## Step 7: Prepare Docker images for the application and worker

Treviqo uses a multi-stage Dockerfile containing separate targets for different workloads.

The main targets are:

| Target | Responsibility |
|---|---|
| `runtime` | Next.js web application |
| `worker` | Background job process |
| `migrate` | Prisma database migrations |

The images can be built locally using:

```bash
docker build --target runtime -t treviqo-web:candidate .
```

```bash
docker build --target worker -t treviqo-worker:candidate .
```

```bash
docker build --target migrate -t treviqo-migrate:candidate .
```

These commands build Docker images locally. They do not automatically publish them to RumptyCloud.

For readers using a different repository, replace the project-specific target names and tags with those defined in your Dockerfile.

### Why use separate Docker targets?

The web application and background worker perform different jobs.

The web container runs the Next.js standalone server, while the worker container starts a compiled Node.js process.

Keeping these responsibilities separate means the worker can continue processing scheduled work without depending on someone visiting the website.

It also allows the two services to have different runtime configurations and health checks.

Treviqo uses a deployment branch named `deploy/worker` as a compatibility approach for selecting the worker image as the default Docker target.

This is specific to our deployment arrangement.

If your hosting configuration supports choosing Docker build targets directly, use that capability instead of creating additional branches unnecessarily.

## Step 8: Run Prisma migrations safely

Before activating application processes that depend on the database schema, ensure the intended database has received the reviewed Prisma migrations.

For Treviqo, the relevant command is:

```bash
npm run db:deploy
```

This uses Prisma's production migration deployment workflow.

You can inspect migration status using:

```bash
npx prisma migrate status
```

### Important production considerations

Do not execute migrations against an unidentified database.

For an existing production database, first establish an appropriate backup and recovery plan.

The correct sequence is:

1. Confirm the target database.
2. Review the committed migrations.
3. Verify the existing migration state.
4. Back up important existing data.
5. Run approved migrations.
6. Check migration status afterward.

Do not use `prisma migrate reset` or casually replace production migrations with `prisma db push`.

### Where should migrations run?

Treviqo provides a separate `migrate` Docker target.

However, the codebase does not establish a universal RumptyCloud dashboard workflow for running one-off migration containers.

Use a provider-supported migration or operator workload that can reach the intended database.

If your hosting environment doesn't provide that execution method, confirm the supported process with RumptyCloud before running production migrations.

Avoid configuring every web application restart to apply database migrations automatically.

## Step 9: Deploy the Next.js web application

With the application prepared and its required dependencies configured, connect the GitHub repository to a RumptyCloud deployment.

For Treviqo, the web application uses the repository's `main` branch and the Docker-based build.

![RumptyCloud Next.js web deployment showing the GitHub branch, Docker configuration and live deployment](/images/rumptycloud-web-deployment.png)

Configure the application using the settings available in the deployment interface.

The Treviqo web container listens on port 3000 by default, although your runtime port and ingress configuration must agree with the actual deployment environment.

The container starts the Next.js standalone server:

```bash
node server.js
```

After deployment, inspect the build and runtime logs.

A successful image build is useful evidence, but it isn't enough to establish that the application can authenticate users or connect to PostgreSQL and Redis.

We will test those separately.

### Verify the web process

Treviqo exposes a liveness endpoint:

```text
GET /api/health
```

A healthy process responds with:

```json
{
  "status": "ok",
  "service": "treviqo"
}
```

This confirms that the web process is responding.

It does **not** establish the availability of every external dependency.

For that, Treviqo also exposes:

```text
GET /api/ready
```

Its successful response contains:

```json
{
  "status": "ready"
}
```

The readiness endpoint checks application dependencies including PostgreSQL, Redis, storage configuration and worker availability.

These endpoints are implemented in Treviqo; they are not automatically created by Next.js or RumptyCloud.

For another project, implement checks appropriate to your application's architecture.

## Step 10: Deploy the background worker

The next component is the worker responsible for scheduled operations.

In Treviqo, the worker processes four categories of jobs:

- Reminders.
- Session cleanup.
- Scheduled account cleanup.
- Extraction-attempt cleanup.

The worker is compiled into JavaScript and started independently of the web server.

Its runtime entry point is:

```bash
node --conditions=react-server dist-worker/worker/main.js
```

On RumptyCloud, the worker is deployed as a separate Docker-based backend application.

![RumptyCloud background worker deployment showing the GitHub worker branch and deployment information](/images/rumptycloud-worker-deployment.png)

In our deployment, the web and worker use separate deployments connected to the intended shared PostgreSQL database and Redis instance.

We also keep the worker configured for continuous operation rather than scaling it to zero.

This matters because scheduled work should not depend on incoming browser traffic to restart the worker.

### Verify worker health

Treviqo exposes:

```text
GET /health
```

A healthy worker responds with:

```json
{
  "status": "ok"
}
```

However, there's an important distinction.

**A healthy worker process does not automatically mean every scheduled job has completed successfully.**

The process can be available while a scheduled job is waiting for a retry.

For production systems, maintain separate diagnostics for worker availability and background job completion.

## Step 11: Configure private S3-compatible object storage

If your application handles documents or user-uploaded files, you may need object storage.

Treviqo stores original employment documents in a private S3-compatible bucket on RumptyCloud.

Navigate to the **Buckets** section to create or manage the storage resource.

![Private S3-compatible object storage bucket on RumptyCloud showing privacy status and file management](/images/rumptycloud-private-storage.png)

The bucket should remain private.

Treviqo uploads documents through the application and provides authorized users with short-lived signed links for retrieving their own files.

The application connects using an explicit S3-compatible endpoint and access-key credentials.

### Configure storage permissions

Depending on your application's needs, storage operations may include:

- Uploading objects.
- Reading objects.
- Checking object metadata.
- Listing relevant objects.
- Deleting objects.

Don't assume that an access key capable of uploading a file can also delete it.

This was one of the most important lessons from deploying Treviqo.

Initially, uploads and downloads succeeded, but deletion returned:

```text
403 AccessDenied
```

Testing the operations independently helped establish that the problem involved deletion authorization rather than a general storage outage.

After updating the storage access configuration, I successfully tested direct document deletion on two documents.

The broader lesson is to grant the permissions your application actually needs and verify those operations explicitly.

If deletion returns `403`, do not treat that as proof that an object is missing.

For applications handling sensitive files, application metadata should only be finalized as deleted after the storage deletion and required absence checks succeed.

Bucket versioning and retention rules may require additional consideration.

## Step 12: Connect optional Rumpty AI services

Treviqo also integrates Rumpty AI for document intelligence.

This allows the application to propose structured information from supported employment documents while leaving the final review and confirmation to the user.

The integration uses a configured API base URL, API key and model identifier.

The main variables are:

```text
RUMPTY_AI_BASE_URL
RUMPTY_AI_API_KEY
RUMPTY_AI_MODEL
```

The implementation sends prepared document text to a chat-completions-compatible endpoint.

For this application, document extraction is initiated by user requests, not performed as a scheduled background worker job.

AI integration is optional for the deployment architecture described in this tutorial.

If your own application requires an inference service, confirm the supported API protocol, model availability, request limits and privacy requirements before enabling it in production.

## Step 13: Test the deployed application

Once the web application, database, Redis, worker and any optional services are configured, test the actual user journey.

For Treviqo, I verified that the deployed application could respond to its health and readiness endpoints and that the background worker reported healthy.

I also tested direct document deletion and observed reminders respond when employment information changed.

![Treviqo running on RumptyCloud showing its home dashboard, document review tasks and reminders](/images/treviqo-live-application.png)

The live application is available at:

[treviqo.rumptycloud.app](https://treviqo.rumptycloud.app)

Your own post-deployment verification should cover the features that matter most to users.

For an application using this architecture, useful checks include authentication, database reads and writes, document access, worker health and scheduled job progress.

Do not treat a green deployment status as the final acceptance test.

## Common deployment problems and what I learned

Working through Treviqo's deployment revealed several issues worth understanding before launching a production application.

### Problem 1: Prisma reports a database initialization failure

During one deployment, the application responded to process health checks, but its readiness endpoint failed and users could not sign in.

The logs included:

```text
runtime_failed operation=readiness_database category=database_initialization
```

We investigated several potential causes, including network configuration and Prisma connection initialization.

The actual problem turned out to be a missing environment variable.

I had removed an earlier database connection configuration but hadn't added the intended `DATABASE_URL` back into the deployed web environment.

After correcting the configuration, application readiness returned to normal.

**Lesson:** Before investigating complicated database or TLS problems, verify that the correct configuration is actually present in the running deployment.

An initialization error identifies a failure category; it does not automatically identify the root cause.

### Problem 2: Background jobs exceed database transaction timeouts

Treviqo's reminders worker also experienced repeated transaction failures.

The worker was processing a growing backlog, and some transactions exceeded Prisma's configured timeout.

Rather than simply raising the timeout globally, the implementation was changed to process reminder work in smaller, resumable batches.

This reduces the amount of work attempted in each transaction and allows processing to continue across worker iterations.

**Lesson:** Long-running background workloads should be bounded, resumable and safe to retry.

Where possible, avoid performing unrelated external API calls inside database transactions.

### Problem 3: Worker health checks report failures during scheduled retries

A background job can fail and enter a retry period while the worker process itself remains alive.

In Treviqo, strict job-retry diagnostics initially contributed to unhealthy deployment behavior.

We separated process availability checks from stricter job execution diagnostics.

That allows the hosting platform to evaluate whether the worker is operational without pretending that every job has succeeded.

**Lesson:** Health checks should answer clearly defined questions.

Process liveness, dependency readiness and scheduled-job success are three different concerns.

### Problem 4: Storage uploads work, but deletion fails

Successful storage uploads do not establish that every storage permission is available.

For Treviqo, the initial deletion failure was:

```text
403 AccessDenied
```

The fix required reviewing storage authorization and configuring suitable credentials.

**Lesson:** Test upload, retrieval and deletion independently. Keep buckets private and never interpret an authorization failure as successful cleanup.

## Production deployment checklist

Before considering your application ready for users, verify the following:

- [ ] The correct GitHub revision is deployed.
- [ ] Required environment variables are configured for each service.
- [ ] PostgreSQL is reachable from the application.
- [ ] Reviewed Prisma migrations have been applied to the intended database.
- [ ] Redis is reachable and configured appropriately.
- [ ] The web application's liveness and readiness checks pass.
- [ ] The worker reports healthy and scheduled jobs have appropriate monitoring.
- [ ] Object storage permissions match the application's required operations.
- [ ] Sensitive values are not exposed in logs or public screenshots.
- [ ] The primary user workflows work on the deployed application.
- [ ] Backup and recovery arrangements have been reviewed.

This checklist is a starting point. Your application's security, availability and operational requirements may call for additional checks.

## Conclusion

Deploying a full-stack application involves more than getting a successful build.

Your web application, database, background worker, storage system and supporting services must work together correctly.

Building and deploying Treviqo on RumptyCloud helped me understand how to structure those responsibilities and investigate production issues systematically.

The most useful lessons were straightforward: configure each service independently, verify environment variables, separate worker health from job completion, keep database transactions bounded, and test storage permissions operation by operation.

The result is an application architecture that is easier to deploy, troubleshoot and maintain.

If you're building a Next.js application with PostgreSQL, Redis and background processing, I hope this walkthrough helps you avoid some of the challenges I encountered.

You can explore the project here:

- **Live application:** [Treviqo](https://treviqo.rumptycloud.app)
- **Source code:** [Ajayfrizzy/treviqo](https://github.com/Ajayfrizzy/treviqo)
- **Hosting platform:** [RumptyCloud](https://rumptycloud.com)

Special thanks to Ola from the RumptyCloud team for the technical support and assistance during the deployment process.
