// QRContact.js — a small (2x2) Scriptable widget that shows your contact QR.
//
// Setup (one time):
//   1. Install "Scriptable" (free) from the App Store.
//   2. Open Scriptable, tap +, paste this whole file, name it "QRContact".
//   3. Set QR_IMAGE_URL below to your published QR (printed by generate.py),
//      e.g. https://feldmana332.github.io/Dashboard/qr-url.png
//   4. Long-press the Home Screen -> + -> Scriptable -> pick the SMALL size
//      (that's the 2x2 slot) -> add it -> long-press the widget -> Edit Widget
//      -> Script: QRContact.
//
// It fetches the QR once, then caches it locally so it still shows offline and
// updates automatically whenever you regenerate/republish the image.

const QR_IMAGE_URL = "https://feldmana332.github.io/Dashboard/qr-url.png";

const fm = FileManager.local();
const cachePath = fm.joinPath(fm.cacheDirectory(), "qrcontact.png");

async function loadImage() {
  try {
    const req = new Request(QR_IMAGE_URL);
    const img = await req.loadImage();
    fm.writeImage(cachePath, img); // refresh cache
    return img;
  } catch (e) {
    if (fm.fileExists(cachePath)) return fm.readImage(cachePath); // offline fallback
    return null;
  }
}

const widget = new ListWidget();
widget.backgroundColor = new Color("#ffffff"); // white quiet zone helps scanners
widget.setPadding(8, 8, 8, 8);

const img = await loadImage();
if (img) {
  const stack = widget.addStack();
  stack.addSpacer();
  const wImg = stack.addImage(img);
  wImg.imageSize = new Size(140, 140);
  wImg.applyFittingContentMode();
  stack.addSpacer();
} else {
  const t = widget.addText("Set QR_IMAGE_URL\n& publish the QR");
  t.textColor = Color.black();
  t.font = Font.systemFont(11);
  t.centerAlignText();
}

// Refresh a few times a day is plenty for a static QR.
widget.refreshAfterDate = new Date(Date.now() + 6 * 60 * 60 * 1000);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall(); // preview when run inside the app
}
Script.complete();
