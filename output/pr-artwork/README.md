# Journal artwork for open PRs

Generated using the built-in image generation tool (imagegen skill).
Style references: `public/journal/img/note-01-1260.webp` and
`public/journal/img/note-03-1260.webp`.

Each topic folder preserves `original.png` and contains:
- `*-card.webp`: 1260 × 760
- `*-hero.webp`: 1280 × 520
- `*-social.jpg`: 1200 × 630

The three derivatives are installed at `public/journal/img/` in their respective
PR branches. The cover/social image is JPEG; cards and heroes are WebP.

| PR | Topic | Article |
| --- | --- | --- |
| [11](https://github.com/cloverworks-hq/blog/pull/11) | volumes | how-to-use-volumes-on-rumptycloud.md |
| [12](https://github.com/cloverworks-hq/blog/pull/12) | resend | sending-emails-using-resend-smtp.mdx |
| [13](https://github.com/cloverworks-hq/blog/pull/13) | buckets | how-to-use-buckets-on-rumptycloud.md |
| [14](https://github.com/cloverworks-hq/blog/pull/14) | firewall | how-to-create-a-firewall-policy-on-rumptycloud.md |

## Prompt set

Common prompt, followed by the topic-specific subject below:

> Use case: stylized-concept. Asset type: RumptyCloud Journal editorial banner. Input images are STYLE REFERENCES only, not edit targets. Create a NEW companion illustration that closely matches their cobalt-to-sky blue grainy paper gradient, flat warm cream geometric forms, small vivid lime #c8f542 and orange #ff6b2c accents, hairline cream connecting rules and sparse calibration crosses. Subtle printed texture, confident minimal geometric design, almost no dimensional depth, same crisp visual family. Wide landscape, ideally 2560x1536. IMPORTANT keep all essential subject shapes in the central 55% of image height so a panoramic hero crop remains coherent. No rounded corners, fill the entire canvas. No words, lettering, numbers, logos, watermarks, UI, screenshot, or photoreal objects. Do not reproduce the subjects of the reference images.

### Volumes

> Subject: persistent block storage. Three slightly offset flat cream disk platters stacked into an abstract cylindrical storage volume, a small orange square representing a virtual machine to the left, and a lime attachment dot connecting the volume to the machine with a fine horizontal line. Bold, spare geometry centered within the safe area.

### Buckets

> Subject: object storage. A large geometric warm cream open container made from a broad U shape, holding three small lime, orange, and yellow squares representing stored objects; a few hairline paths enter the container from a small cream dot. Simple broad forms, not a literal household bucket.

### Firewall

> Subject: filtering inbound network traffic. A strong vertical warm cream barrier composed of three rectangular segments with one precise narrow gap. Three fine horizontal inbound paths approach from the left; one lime path passes through the gap to a lime dot at right; two end at orange dots before the barrier. Clear minimal visual metaphor for allow-listed traffic.

### Resend

> Subject: transactional email delivery. A large cream geometric envelope defined by a rectangular plane and clean triangular folded flap, an orange square at its center, with three delicate outbound curved paths connecting to lime dots on the right. Elegant sparse geometry, not an email app interface.

## Published updates and validation

- PR 11: `0eaa315` — pushed to `ADEMOLA200/blog:post/volumes-on-rumpty`.
- PR 12: `15db142` — pushed to `cloverworks-hq/blog:resend-email`.
- PR 13: `74c1e75` — pushed to `ADEMOLA200/blog:post/how-to-use-buckets`.
- PR 14: `d6783ae` — pushed to `ADEMOLA200/blog:post/how-to-create-firewall-policy`.

All artwork paths and dimensions were checked. PRs 11, 13, and 14 were merged.
PR 11 remains a draft article. The Resend guide now passes the full build after
fixing CodeTabs types, keyboard navigation, and progressive enhancement, updating
the MDX dependency lockfile, and correcting its package-install example.

The combined release passes social image, canonical URL, sitemap, and structured
data checks across all seven published articles. Named authors use Person schema.
