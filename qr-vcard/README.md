# Home Screen contact QR

A 2×2 widget on your iPhone Home Screen that shows a QR code. Anyone who points
their camera at it gets your contact card ("Add to Contacts"). You control
exactly what's shared, and you can update it later without touching your phone.

## How it works

- `contact.json` — the one file you edit: your name, phones, emails, etc.
- `generate.py` — turns that into everything in `../docs/`:
  - `contact.vcf` — your card, published at `<base_url>/contact.vcf`
  - `qr-url.png` — **recommended** QR; points at the hosted `.vcf` so you can
    edit your info anytime and even include a photo. The QR never changes.
  - `qr-direct.png` — a fallback QR with the whole card embedded; works with no
    internet, but can't carry a photo and changes whenever your info changes.
  - `index.html` — a shareable web page showing the QR + an "Add to Contacts" button.
- `widget/QRContact.js` — a [Scriptable](https://scriptable.app) widget that
  displays the QR at the small (2×2) size.

The QR points to a `.vcf` hosted on **GitHub Pages** (free). Editing your info
later = edit `contact.json`, rerun `generate.py`, push. The QR image and widget
never need to change.

## Setup

### 1. Fill in your details
Edit `contact.json`. Blank fields are omitted. Then:

```bash
pip3 install segno       # one-time, pure-Python QR library
cd qr-vcard
python3 generate.py --offline
```

### 2. Turn on GitHub Pages
In the repo: **Settings → Pages → Build from a branch →** pick your repo's
default/published branch, folder `/docs` → Save. After a minute your card is live at
`https://feldmana332.github.io/Dashboard/` and the `.vcf` at
`.../contact.vcf`. (If your Pages URL differs, set `base_url` in
`contact.json` and rerun.)

### 3. Put the widget on your Home Screen
1. Install **Scriptable** (free, App Store).
2. Open it, tap **+**, paste `widget/QRContact.js`, name it `QRContact`, and
   confirm `QR_IMAGE_URL` matches the `qr-url.png` URL that `generate.py` printed.
3. Long-press the Home Screen → **+** → **Scriptable** → choose the **Small**
   size (the 2×2 slot) → Add Widget.
4. Long-press the new widget → **Edit Widget** → Script → **QRContact**.

Prefer zero code? Skip Scriptable: use **Widgetsmith** (or any single-photo
widget), add a Small widget, and set its photo to `qr-url.png`.

## Testing it
Open the Camera app and point it at the widget on the screen (or at
`index.html` on another device). iOS should offer to create a contact from your
card. Keep `contact.json` lean so the QR stays easy to scan from a screen.
