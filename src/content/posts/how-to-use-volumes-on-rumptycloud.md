---
title: "Persistent Storage on RumptyCloud: A Practical Guide to Volumes"
description: "Create, attach, detach, and reattach persistent block storage volumes on RumptyCloud — and keep your data when you rebuild a VM."
publishedDate: 2026-08-07
author: "Odukoya Abdullahi"
cover: "/images/how-to-use-volumes-on-rumptycloud.png"
coverAlt: "A guide to persistent block storage volumes on RumptyCloud, with the RumptyCloud logo and stacked disk icons"
tags:
  - "Volumes"
  - "Storage"
  - "Linux"
  - "Getting Started"
draft: true
---

Every VM you create on RumptyCloud gets a root disk that lives and dies with the machine. That's fine for quick experiments — but the moment you build something real, you'll hit the classic cloud problem: what happens to your data when the VM is destroyed? Rebuilt? Replaced after a failed snapshot?

That's exactly what **Volumes** are for. Volumes are persistent **block storage** you attach to a VM, format, and mount — and they **survive** VM deletion. Detach one from a machine that's about to die, attach it to a fresh VM, and all your data comes right back with it. In this guide, we'll create a volume, attach it to a running VM, put some data on it, then move that data to a brand-new VM to prove it follows you.

## What is a Volume?

A volume is a **block storage** device that exists independently of any VM. Think of it as a hard drive that isn't built into a computer — plug it into one machine, use it, unplug it, plug it into another, and the files are still there. Some key properties:

- **Independent** — volumes live on their own in **Storage → Volumes**, separate from any VM's root disk.
- **Persistent** — they keep their data across detach/attach cycles and across VM destruction.
- **Flexible** — attach, detach, and reattach to any VM in the same zone any time.
- **Format once** — a volume that already has a filesystem is never reformatted, so the data inside stays exactly as you left it.

> In the console you'll see "Volumes" as the product name. Under the hood this is classic block storage, the same technology behind cloud "disks" on every major provider.

### Volumes vs. the root disk

| | Root disk | Volume |
| --- | --- | --- |
| Lives | With the VM | Independently (Storage → Volumes) |
| Survives VM destroy | No | **Yes** (detached, not deleted) |
| Attach to another VM | No | **Yes** |
| Use case | OS and installed packages | Persistent application data |

## Before you start

- A [RumptyCloud account](https://console.rumptycloud.com) and workspace
- A running Linux VM (any plan). The volume must be created in the same **zone** as the VM you want to attach it to — the VM detail page shows its zone.

> If you haven't created a VM yet, follow our [VM spin-up guide](https://blog.rumptycloud.com/blog/how-to-spin-up-a-virtual-machine-on-rumptycloud/) first, then come back.

## 1. Create a volume

Open **Storage → Volumes** in the sidebar, then select **Add Volume**.

1. **Volume name** — a label like `data-volume`. Letters, numbers, hyphens, and underscores only.
2. **Volume size** — drag the slider. Options run from 1 GB to 500 GB (defaults to 20 GB).
3. **Region (Zone)** — choose the same zone as the VM you plan to attach the volume to.
4. **Description** *(optional)* — a note about what the volume is for.
5. **Format volume on creation** — leave this checked (default). A blank volume is automatically formatted with **ext4** the first time it's attached.

A live **estimated monthly storage cost** updates as you change the size. Select **Create Volume**.

The volume appears in the Volumes list as `available`. Open it and you'll see its **Capacity**, **Filesystem**, **Zone**, **Formatted** status, and creation time.

<!-- SCREENSHOT: Add Volume form (name, size slider, zone, format checkbox) here -->

## 2. Attach the volume to a VM

From the volume detail page, select **Attach to VM** and pick the VM you created. (You can also do this earlier, during VM creation, under **Select or Create Volumes**.) Then start the VM if it isn't already running.

Nothing else to do — attached volumes are mounted automatically:

- The disk appears as a SCSI device, e.g. `/dev/sdb`.
- Since the disk is blank and **Format volume on creation** was checked, it's formatted with ext4 on first attach.
- It's mounted at **`/mnt/rumpty/<volume-id>`** and an `/etc/fstab` entry is added, so the mount persists across reboots.

The exact device name and mount path are shown on the volume detail page under **Attachment**.

<!-- SCREENSHOT: Volume detail page showing Attachment (VM name, /dev/sdb, /mnt/rumpty/<id>) here -->

## 3. Put some data on it

SSH into the VM (the [browser console](https://blog.rumptycloud.com/blog/how-to-spin-up-a-virtual-machine-on-rumptycloud/) is fastest) and verify the volume:

```bash
lsblk           # spot /dev/sdb, the volume disk
df -h /mnt/rumpty/<volume-id>   # the mount point and free space
mount | grep rumpty   # confirm the mount / this format
```

Write a file so we can prove persistence later:

```bash
echo "hello from volume" > /mnt/rumpty/<volume-id>/hello.txt
cat /mnt/rumpty/<volume-id>/hello.txt
```

Anything you place under the mount point lives on the volume — stop packages, databases, media, whatever your app uses.

> Take a mental snapshot of this file — I'm going to move the whole disk to a different VM, and that file is the proof the data followed.

<!-- SCREENSHOT: lsblk output showing /dev/sdb + the hello.txt write on the first VM here -->

## 4. Detach and reattach to another VM

The real power of volumes is moving them between VMs. Create a second VM (same zone), then:

1. Make sure no process on the first VM is writing to the volume, then **unmount** it:

```bash
umount /mnt/rumpty/<volume-id>
```

2. Back on the volume detail page, select **Detach**. The volume returns to `available`.
3. Select **Attach to VM**, and pick the **new** VM.

Start the second VM and check:

```bash
lsblk
cat /mnt/rumpty/<volume-id>/hello.txt   # still there?
```

Because the volume already has a filesystem, it's attached as-is — **not reformatted** — and your `hello.txt` is still exactly where you left it. Your data just walked from one VM to the next.

<!-- SCREENSHOT: cat /mnt/rumpty/<id>/hello.txt output on the SECOND VM here — the money shot -->

## 5. Volumes survive the VM itself

Destroy a VM and the volume stays. When you open **Settings → Destroy VM** and confirm the deletion, attached volumes are **detached but not deleted** — they remain in **Storage → Volumes** and can be reattached to another VM. The VM's root disk is gone; your volume and its data live on.

> The zone rule: a zone mismatch is the one real gotcha. A volume is only reattachable to VMs in the zone it was created in (e.g. you can't move it across regions). The platform blocks mismatched attaches, so the fix is to create volumes in the right zone the first time.

## 6. Managing volumes

- **Resize** occurs via the slider at creation time; the console shows the running monthly cost as you change the size.
- Volume pricing is **$0.05/GB/month** (10 GB runs ~$0.50/mo, 50 GB ~$2.50/mo, 500 GB ~$25/mo).
- Delete is also on the volume detail page — a volume can't be deleted while attached, so detach it first.

> Volumes aren't snapshots or backups: a destroyed VM's root disk is gone forever. Keep your own regular backups of data you can't afford to lose, and snapshot volumes before risky operations.

## Conclusion

Volumes on RumptyCloud give you what root disks never can: storage that moves with your data, not with a single machine. Create once, attach many, detach, reattach, survive VM destruction — the `hello.txt` you wrote in this guide is still sitting there like it never left. That's the whole point of this post — your data is the durable thing, the VMs are the disposable shells.
</content>
