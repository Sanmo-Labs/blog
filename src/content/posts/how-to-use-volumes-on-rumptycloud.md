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
2. **Volume size** — drag the slider. Options run from 20 GB to 500 GB (defaults to 20 GB).
3. **Region (Zone)** — choose the same zone as the VM you plan to attach the volume to.
4. **Description** *(optional)* — a note about what the volume is for.
5. **Format volume on creation** — leave this checked (default). A blank volume is automatically formatted with **ext4** the first time it's attached.

A live **estimated monthly storage cost** updates as you change the size. Select **Create Volume**.

![The Create Volume form, with the volume name, 20 GB size slider, zone dropdown, and format option](/images/how-to-use-volume-create-volume-form.png)

The volume appears in the Volumes list as `available`. Open it and you'll see its **Capacity**, **Filesystem**, **Zone**, **Formatted** status, and creation time.

## 2. Attach the volume to a VM

From the volume detail page, select **Attach to VM** and pick the VM you created. (You can also do this earlier, during VM creation, under **Select or Create Volumes**.) Then start the VM if it isn't already running.

![The Attach volume dialog, selecting the existing VM](/images/how-to-use-volume-attach-volume-to-vm.png)

Nothing else to do — attached volumes are mounted automatically:

- The disk appears as a SCSI device — in this guide it's `/dev/sda`, but the exact letter depends on your VM, so run `lsblk` to confirm.
- Since the disk is blank and **Format volume on creation** was checked, it's formatted with ext4 on first attach.
- It's mounted at **`/mnt/rumpty/<volume-id>`** and an `/etc/fstab` entry is added, so the mount persists across reboots.

The exact device name and mount path are shown on the volume detail page under **Attachment** — the `<volume-id>` in the mount path is the volume's real ID, so always copy it from there instead of typing it by hand.

## 3. Put some data on it

SSH into the VM (the [browser console](https://blog.rumptycloud.com/blog/how-to-spin-up-a-virtual-machine-on-rumptycloud/) is fastest) and verify the volume:

```bash
lsblk           # spot /dev/sda, the volume disk
df -h /mnt/rumpty/<volume-id>   # the mount point and free space
mount | grep rumpty   # confirm the mount / this format
```

Write a file so we can prove persistence later:

```bash
echo "hello from rumptycloud" > /mnt/rumpty/<volume-id>/hello.txt
cat /mnt/rumpty/<volume-id>/hello.txt
```

Replace `<volume-id>` with the real ID from the volume detail page — e.g. if the mount path is `/mnt/rumpty/01a001d56d4a`, the command becomes:

```bash
echo "hello from rumptycloud" > /mnt/rumpty/01a001d56d4a/hello.txt
cat /mnt/rumpty/01a001d56d4a/hello.txt
```

![Writing hello.txt on the first VM and reading it back](/images/how-to-use-volume-vm-terminal-on-first-vm.png)

Anything you place under the mount point lives on the volume — stop packages, databases, media, whatever your app uses.

> Take a mental snapshot of this file — I'm going to move the whole disk to a different VM, and that file is the proof the data followed.

## 4. Detach and reattach to another VM

The real power of volumes is moving them between VMs. Create a second VM (same zone), then:

1. Make sure no process on the first VM is writing to the volume, then **unmount** it:

```bash
umount /mnt/rumpty/<volume-id>
```

![Unmounting the volume on the first VM](/images/how-to-use-volume-write-file-output-on-first-vm.png)

2. Back on the volume detail page, select **Detach**. The volume returns to `available`.

![The volume detail page — select Detach to release the volume from the VM](/images/how-to-use-volume-detach-volume-page.png)

3. Select **Attach to VM**, and pick the **new** VM.

![The Attach volume dialog, this time selecting the new VM](/images/how-to-use-volume-attach-volume-to-new-vm.png)

Start the second VM and open its browser console:

![The new VM's detail page, with the browser console ready to launch](/images/how-to-use-volume-launch-browser-vm-terminal-page.png)

Then check:

```bash
lsblk
cat /mnt/rumpty/<volume-id>/hello.txt   # still there?
```

Because the volume already has a filesystem, it's attached as-is — **not reformatted** — and your `hello.txt` is still exactly where you left it. Your data just walked from one VM to the next.

![Reading hello.txt back on the second VM — the data followed the volume](/images/how-to-use-volume-write-file-output-in-new-vm-browser-terminal.png)

## 5. Volumes survive the VM itself

Destroy a VM and the volume stays. When you open **Settings → Destroy VM** and confirm the deletion, attached volumes are **detached but not deleted** — they remain in **Storage → Volumes** and can be reattached to another VM. The VM's root disk is gone; your volume and its data live on.

> The zone rule: a zone mismatch is the one real gotcha. A volume is only reattachable to VMs in the zone it was created in (e.g. you can't move it across regions). The platform blocks mismatched attaches, so the fix is to create volumes in the right zone the first time.

## 6. Managing volumes

- **Resize** occurs via the slider at creation time; the console shows the running monthly cost as you change the size.
- Volume pricing runs roughly **NGN 67.50/GB/month** (20 GB ~NGN 1,350/mo, 50 GB ~NGN 3,375/mo, 500 GB ~NGN 33,750/mo).
- Delete is also on the volume detail page — a volume can't be deleted while attached, so detach it first.

> Volumes aren't snapshots or backups: a destroyed VM's root disk is gone forever. Keep your own regular backups of data you can't afford to lose, and snapshot volumes before risky operations.

## Conclusion

Volumes on RumptyCloud give you what root disks never can: storage that moves with your data, not with a single machine. Create once, attach many, detach, reattach, survive VM destruction — the `hello.txt` you wrote in this guide is still sitting there like it never left. That's the whole point of this post — your data is the durable thing, the VMs are the disposable shells.
</content>
