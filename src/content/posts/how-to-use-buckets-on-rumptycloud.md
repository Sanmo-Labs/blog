---
title: "How to Use Buckets on RumptyCloud"
description: "Create an S3-compatible RumptyCloud bucket, upload files from the console or CLI, serve them on a CDN URL, and connect SDKs with access keys."
publishedDate: 2026-08-23
author: "Odukoya Abdullahi"
cover: "/images/how-to-use-buckets-on-rumptycloud-banner.png"
coverAlt: "How to Use Buckets on RumptyCloud, with the RumptyCloud logo and an object storage bucket icon"
tags:
  - "Buckets"
  - "Object Storage"
  - "S3"
  - "Getting Started"
draft: false
---

RumptyCloud buckets are S3-compatible object storage for images, documents, HTML, and video. You upload once, then serve files from a permanent CDN URL (public buckets) or from a time-limited signed URL (private buckets). In this guide we will create a bucket, upload files from the console, sync a local folder with the Rumpty CLI, and connect an SDK with access keys.

Official product docs: [Buckets](https://docs.rumptycloud.com/buckets/introduction), [Create a Bucket](https://docs.rumptycloud.com/buckets/create-a-bucket), and [Uploading & Access Keys](https://docs.rumptycloud.com/buckets/uploading).

## What you will need

Before you begin, make sure you have:

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- A few sample files to upload (an image is enough to follow along)
- Optional: the [Rumpty CLI](https://docs.rumptycloud.com/cli/introduction) if you want to sync a folder from your terminal
- Optional: the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) or an S3 SDK if you want programmatic uploads

## 1. Create a bucket

[Sign in to the RumptyCloud console](https://console.rumptycloud.com/signin), select your workspace, then go to **Storage → Buckets → Create bucket**.

You only need two decisions: a name and whether files should be publicly readable.

![The Create Bucket form, with tutorial-bucket as the name and Public images selected](/images/how-to-use-buckets-on-rumptycloud-create-form.png)

1. **Bucket name** — unique within the workspace, for example `tutorial-bucket`. Use 2 to 63 characters, starting with a letter or number.
2. **Visibility** — how browsers and apps read files:

   | Option | Best for |
   | --- | --- |
   | **Public images** | App images, website media, avatars, logos, and other assets you want to serve directly. Files get permanent public read URLs. Uploads use a public-read ACL. Good default for static content. |
   | **Private images** | Restricted content. Your app should request a signed read URL before showing or downloading a file. Objects are not uploaded public-read. |

Select **Create bucket**. RumptyCloud then prepares browser uploads and S3-compatible SDK access.

Wait until the status badge is **READY**. Uploads and SDK access stay locked until then.

## 2. Tour the bucket detail page

Once the bucket is ready, you land on its detail page. That is the home for uploads, assets, and credentials.

![The tutorial-bucket detail page, with READY and PUBLIC badges, public URL, drag-and-drop upload, and an empty Assets table](/images/how-to-use-buckets-on-rumptycloud-detail.png)

You should see:

- A **status** badge (`READY`) and a **visibility** badge (`PUBLIC` or `PRIVATE`)
- The **S3 bucket name** under the title (for example `assets-ademola-019f56b4-f2d995`) — this is the identifier you pass to SDKs and the AWS CLI
- A **public URL**, in the form `https://assets.rumptycloud.app/projects/<project-id>/<bucket-name>`
- **Upload files** and **Delete bucket** in the header
- A **drag and drop** area for images, documents, HTML, and video
- A ready-made `rumpty sync` command for this bucket
- An **Assets** tab listing uploaded files
- An **Access keys** tab for S3-compatible credentials

Copy the public URL from the page rather than assembling it by hand — the console shows the exact project and bucket segments for your workspace.

## 3. Upload files from the dashboard

From the bucket detail page, drag files into the upload area, or select **Upload files** and pick them from your computer.

![Choosing a local file after clicking Upload files](/images/how-to-use-buckets-on-rumptycloud-upload.png)

Supported types:

- **Images** — PNG, JPEG, WebP, GIF, SVG
- **Documents** — PDF, TXT, HTML, Markdown, CSV, DOCX
- **Video** — MP4, WebM, MOV, MKV, AVI, plus HLS playlists and segments

Uploaded files appear in the **Assets** tab with name, type, size, status, and creation date. When a file is **READY**, select **VIEW** to open its details.

![The Assets tab with an uploaded PNG and the VIEW action](/images/how-to-use-buckets-on-rumptycloud-assets.png)

The **Asset metadata** panel shows a preview, type, size, created date, and the object key. From here you can **Copy URL**, **Open** the file in a new tab, or **Delete** it.

![The Asset metadata panel, with preview, Copy URL, Open, and Delete](/images/how-to-use-buckets-on-rumptycloud-file-inspector.png)

### Public buckets: permanent URLs

Public buckets serve each file at a permanent CDN URL:

```text
https://assets.rumptycloud.app/projects/<project-id>/<bucket-name>/<file-key>
```

The fastest path is **VIEW → Copy URL** (or **Open**). Paste that URL in `<img>` tags, CSS, or any app that needs a stable address.

![A public file opened at its assets.rumptycloud.app URL](/images/how-to-use-buckets-on-rumptycloud-public-url.png)

### Private buckets: signed URLs

Private objects are never directly public-read. The dashboard generates a signed read URL when you open a file for preview, and the inspector shows when that URL expires. For production, generate signed URLs on your server with an S3 SDK (see [Access keys](#5-create-access-keys-and-upload-with-an-sdk) below) and only then send the URL to the client.

## 4. Sync a local folder with the Rumpty CLI

The detail page already prints a sync command for the bucket you are looking at, for example:

```bash
rumpty sync ~/sales-reports tutorial-bucket --watch
```

`rumpty sync` is one-way (local to cloud) and incremental: only new and changed files upload on later runs.

Install and sign in if you have not already:

```bash
curl -fsSL https://get.rumptycloud.com | sh
rumpty --version
rumpty login
```

On the first run the CLI signs you in if needed, creates the bucket if it does not exist (private by default), mints and caches an access key, and uploads your files. If you omit the bucket name, the CLI uses the folder name:

```bash
cd ~/sales-reports
rumpty sync .
```

Useful flags:

| Flag | What it does |
| --- | --- |
| `--public` | Create the bucket with publicly readable files (default is private) |
| `--watch` | Keep running and upload changes as they happen |
| `--daemon` | Same as `--watch`, but detached in the background |
| `--restore` | Copy files from the bucket back to the local folder |
| `--delete` | Delete remote files that no longer exist locally |
| `--dry-run` | Show what would transfer without doing it |
| `--include` | Only sync matching globs |
| `--exclude` | Skip matching globs |

Preview a destructive sync before you run it:

```bash
rumpty sync ~/photos my-backups --delete --dry-run
```

Restore onto another machine:

```bash
rumpty sync ~/restored-photos my-backups --restore
```

> Keys created by `sync` are cached in the CLI config directory. If you revoke a key in the console, the CLI mints a new one and retries. Revoke keys from the bucket's **Access keys** tab.

Full reference: [Sync a Local Folder](https://docs.rumptycloud.com/cli/sync).

## 5. Create access keys and upload with an SDK

For apps and CI, use S3-compatible credentials.

1. Open the bucket detail page → **Access keys**.
2. Enter a name (for example `tutorial-bucket-keys`) and select **Create**.
3. Copy the **secret access key** immediately — it is shown only once under **SECRET SHOWN ONCE**.

![The Access keys tab after creating a key, with connection details and SDK snippets](/images/how-to-use-buckets-on-rumptycloud-access-keys.png)

The same tab shows **Connection details** for this bucket:

| Field | Example |
| --- | --- |
| **Endpoint** | `https://s3.rumptycloud.com` |
| **Region** | `elas-closet` |
| **Bucket name** | `assets-ademola-019f56b4-f2d995` (the S3 name, not only the display name) |
| **Access key ID** | shown after you create a key |

It also includes copy-paste upload snippets for JavaScript, TypeScript, PHP, Go, Java, Ruby, and Rust. Prefer those snippets when they are present — they are generated for this bucket.

Use any S3 SDK or the AWS CLI against `https://s3.rumptycloud.com`. Enable **path-style addressing** (`forcePathStyle: true`).

### AWS CLI

```bash
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>

aws s3 cp ./photo.jpg s3://<s3-bucket-name>/photo.jpg \
  --endpoint-url https://s3.rumptycloud.com
```

### JavaScript (AWS SDK v3)

```javascript
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";

const s3 = new S3Client({
  region: process.env.RUMPTY_REGION, // e.g. elas-closet
  endpoint: "https://s3.rumptycloud.com",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.RUMPTY_ACCESS_KEY_ID,
    secretAccessKey: process.env.RUMPTY_SECRET_ACCESS_KEY,
  },
});

await s3.send(
  new PutObjectCommand({
    Bucket: process.env.RUMPTY_BUCKET,
    Key: "photo.jpg",
    Body: await readFile("./photo.jpg"),
    ContentType: "image/jpeg",
  }),
);
```

Store the secret in environment variables or a secrets manager. Revoke a key from the same tab at any time; apps using a revoked key lose access to the bucket.

## 6. Cleaning up

To remove a single file, open **VIEW** on the **Assets** tab and select **Delete**.

To remove the whole bucket:

1. Open the bucket detail page.
2. Select **Delete bucket** in the header.
3. Confirm the bucket name if prompted.

This removes the bucket, every object in it, and every access key. There is no undelete.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Upload area is disabled / SDK calls fail | Wait until the bucket status is **READY**. Creating buckets cannot accept uploads yet. |
| Public URL 404s | Confirm visibility is **PUBLIC**, the object status is **READY**, and you copied the URL from **Asset metadata** rather than guessing the path. |
| Private file opens in the browser without a signed URL | That should not happen for a private bucket. Check the visibility badge. If it says **PUBLIC**, create a new private bucket for restricted files. |
| Signed URL expired | Generate a new signed URL from the file inspector or from your server SDK. |
| AWS CLI or SDK `NoSuchBucket` / auth errors | Use the **S3 bucket name** from the detail page (the `assets-...` identifier), endpoint `https://s3.rumptycloud.com`, path-style addressing, and a key that has not been revoked. |
| `rumpty sync` fails after you revoked a key | Run the command again. The CLI should mint a new cached key. If it does not, create a key in **Access keys** and check you are logged in (`rumpty login`). |
| Bucket creation stuck on **Creating** | Use **Refresh** on the detail page. If status stays **Failed**, try a different name and [check platform status](https://docs.rumptycloud.com/). |

## Conclusion

You now have an S3-compatible RumptyCloud bucket you can fill from the console, the Rumpty CLI, or any S3 SDK. Public files live on a CDN URL under `https://assets.rumptycloud.app`; private files stay behind signed URLs. From here you can keep product images in a public bucket, park backups in a private one, and wire the same credentials into a [deployment](https://docs.rumptycloud.com/getting-started/introduction) or CI job.
