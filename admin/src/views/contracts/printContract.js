// Print / save as PDF (browser print dialog) and download as Word (.doc).
const page = (html, title) => `<!doctype html><html><head><meta charset="utf-8"><title>${String(title || "Contract").replace(/</g, "&lt;")}</title>
<style>
  html,body{margin:0;background:#fff}
  body{padding:0}
  @page{size:A4;margin:16mm 16mm 18mm}
  @media screen{body{padding:32px}}
</style></head><body>${html}</body></html>`;

/** Opens the print dialog for the contract (choose "Save as PDF" to download). */
export const printContract = (html, title) => {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(page(html, title));
  doc.close();
  const go = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } finally {
      setTimeout(() => frame.remove(), 1500);
    }
  };
  // wait for images (logo, signature) before printing
  const imgs = [...doc.images];
  if (!imgs.length) setTimeout(go, 120);
  else Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => setTimeout(go, 120));
};

/** Word opens HTML documents saved with a .doc extension. */
export const downloadWord = (html, fileName) => {
  const content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Contract</title></head><body>${html}</body></html>`;
  const blob = new Blob(["﻿", content], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(fileName || "contract").replace(/[\\/:*?"<>|]+/g, "-")}.doc`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
};
