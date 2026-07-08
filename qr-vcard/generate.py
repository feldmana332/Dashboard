#!/usr/bin/env python3
"""Generate a vCard, two QR codes, a Pages web page, and the Scriptable widget
config from a single contact.json.

Outputs (all under ../docs/, which is what GitHub Pages publishes):
  contact.vcf   - your contact card, served at <base_url>/contact.vcf
  qr-url.png    - QR that points at <base_url>/contact.vcf   (recommended: editable later, supports a photo)
  qr-direct.png - QR with the whole vCard embedded            (works fully offline, no photo)
  index.html    - a shareable page showing the QR + an "Add to Contacts" button

Plus:
  widget/QRContact.js is left as-is (it reads the QR from <base_url> at runtime);
  this script only prints the exact URL to paste into the widget.

Usage:
    python3 generate.py            # uses ./contact.json
    python3 generate.py --offline  # also print the embedded-vCard payload size
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import segno
except ImportError:
    sys.exit("Missing dependency. Run:  pip3 install segno")

HERE = Path(__file__).resolve().parent
CONFIG_PATH = HERE / "contact.json"
DOCS = HERE.parent / "docs"


def esc(value: str) -> str:
    """Escape a value for a vCard text field (RFC 6350 / vCard 3.0)."""
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def build_vcard(cfg: dict, *, include_photo: bool) -> str:
    """Return a vCard 3.0 string. iOS is happiest with 3.0."""
    first = cfg.get("first_name", "").strip()
    last = cfg.get("last_name", "").strip()
    full = " ".join(p for p in (first, last) if p).strip()

    lines = ["BEGIN:VCARD", "VERSION:3.0"]
    # N = structured name: Last;First;Middle;Prefix;Suffix
    lines.append(f"N:{esc(last)};{esc(first)};;;")
    lines.append(f"FN:{esc(full)}")

    if cfg.get("org"):
        lines.append(f"ORG:{esc(cfg['org'])}")
    if cfg.get("title"):
        lines.append(f"TITLE:{esc(cfg['title'])}")

    tel_type = {"cell": "CELL", "work": "WORK,VOICE", "home": "HOME,VOICE"}
    for phone in cfg.get("phones", []):
        num = phone.get("number", "").strip()
        if not num:
            continue
        typ = tel_type.get(phone.get("type", "cell"), "CELL")
        lines.append(f"TEL;TYPE={typ}:{esc(num)}")

    email_type = {"home": "HOME", "work": "WORK"}
    for email in cfg.get("emails", []):
        addr = email.get("address", "").strip()
        if not addr:
            continue
        typ = email_type.get(email.get("type", "home"), "HOME")
        lines.append(f"EMAIL;TYPE={typ},INTERNET:{esc(addr)}")

    if cfg.get("url"):
        lines.append(f"URL:{esc(cfg['url'])}")

    adr = cfg.get("address", {}) or {}
    if any(adr.get(k) for k in ("street", "city", "region", "postal_code", "country")):
        # ADR: PObox;ext;street;city;region;postal;country
        lines.append(
            "ADR;TYPE=HOME:;;"
            f"{esc(adr.get('street', ''))};"
            f"{esc(adr.get('city', ''))};"
            f"{esc(adr.get('region', ''))};"
            f"{esc(adr.get('postal_code', ''))};"
            f"{esc(adr.get('country', ''))}"
        )

    if include_photo and cfg.get("photo_url"):
        # Reference the photo by URL so the QR/card stay small.
        lines.append(f"PHOTO;VALUE=URI:{cfg['photo_url']}")

    if cfg.get("note"):
        lines.append(f"NOTE:{esc(cfg['note'])}")

    lines.append("END:VCARD")
    return "\r\n".join(lines) + "\r\n"


def build_index_html(cfg: dict, vcf_url: str) -> str:
    full = " ".join(
        p for p in (cfg.get("first_name", ""), cfg.get("last_name", "")) if p
    ).strip() or "My contact card"
    subtitle = cfg.get("title") or cfg.get("org") or ""
    sub_html = f'<p class="sub">{subtitle}</p>' if subtitle else ""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full}</title>
<style>
  :root {{ color-scheme: light dark; }}
  body {{ font-family: -apple-system, system-ui, sans-serif; margin: 0;
         min-height: 100vh; display: grid; place-items: center;
         background: #f5f5f7; color: #1d1d1f; }}
  @media (prefers-color-scheme: dark) {{ body {{ background:#000; color:#f5f5f7; }} }}
  .card {{ text-align: center; padding: 2rem; }}
  h1 {{ margin: 0 0 .25rem; font-size: 1.6rem; }}
  .sub {{ margin: 0 0 1.5rem; opacity: .6; }}
  img {{ width: min(70vw, 320px); height: auto; background:#fff;
        padding: 16px; border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,.12); }}
  a.btn {{ display:inline-block; margin-top:1.5rem; padding:.8rem 1.6rem;
          background:#0071e3; color:#fff; text-decoration:none;
          border-radius:980px; font-weight:600; }}
  .hint {{ margin-top:1rem; font-size:.85rem; opacity:.55; }}
</style>
</head>
<body>
  <div class="card">
    <h1>{full}</h1>
    {sub_html}
    <img src="qr-url.png" alt="Scan to add {full} to contacts">
    <div><a class="btn" href="contact.vcf">Add to Contacts</a></div>
    <p class="hint">Point your camera at the code, or tap the button.</p>
  </div>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--offline", action="store_true",
                        help="Also report the embedded-vCard QR payload size.")
    args = parser.parse_args()

    cfg = json.loads(CONFIG_PATH.read_text())
    base_url = cfg.get("base_url", "").rstrip("/")
    if not base_url:
        sys.exit("Set base_url in contact.json first.")
    vcf_url = f"{base_url}/contact.vcf"

    DOCS.mkdir(exist_ok=True)

    # Hosted card (may include a photo URL).
    hosted_vcard = build_vcard(cfg, include_photo=True)
    (DOCS / "contact.vcf").write_text(hosted_vcard)

    # QR #1: points at the hosted .vcf (recommended).
    segno.make(vcf_url, error="m").save(
        DOCS / "qr-url.png", scale=12, border=3, dark="#000", light="#fff"
    )

    # QR #2: the entire vCard embedded, no photo (fully offline fallback).
    offline_vcard = build_vcard(cfg, include_photo=False)
    segno.make(offline_vcard, error="m").save(
        DOCS / "qr-direct.png", scale=10, border=3, dark="#000", light="#fff"
    )

    # Shareable web page.
    (DOCS / "index.html").write_text(build_index_html(cfg, vcf_url))

    print("Generated in docs/:")
    print("  contact.vcf   ->", vcf_url)
    print("  qr-url.png    -> QR pointing at that URL   (recommended)")
    print("  qr-direct.png -> QR with vCard embedded    (offline, no photo)")
    print("  index.html    ->", f"{base_url}/")
    print()
    print("Scriptable widget: set QR_IMAGE_URL in widget/QRContact.js to")
    print("  ", f"{base_url}/qr-url.png")
    if args.offline:
        print()
        print(f"Embedded-QR payload: {len(offline_vcard)} bytes "
              f"(keep under ~700 for an easy screen scan).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
