// Turns a contract document + context into self-contained HTML (with its own
// <style>). The same HTML is shown in the admin preview, stored when the
// contract is sent, served to the customer and printed to PDF.
import { SCHEDULE_COLUMNS, buildContext, customerFieldMap, fieldLabel, fmtMoney } from "./contractFields";

export const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const FONTS = {
  serif: `"Times New Roman", Times, Georgia, serif`,
  sans: `"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  book: `Georgia, Cambria, "Times New Roman", serif`,
};

const TOKEN = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * mode: "final"   → missing values become a blank line to fill by hand
 *       "preview" → missing values are highlighted with the field name
 */
const filler = (ctx, mode, document) => (text, { escape = false } = {}) => {
  const src = escape ? escapeHtml(text) : String(text ?? "");
  const byCustomer = customerFieldMap(document);
  return src.replace(TOKEN, (_, key) => {
    // Filled by the customer when signing: a blank line the backend fills after signing
    const cf = key.startsWith("custom.") ? byCustomer[key.slice(7)] : null;
    if (cf) {
      return mode === "final"
        ? `<span class="wlc-cf" data-cf="${cf.key}"><span class="wlc-blank">&nbsp;</span></span>`
        : `<span class="wlc-cust" title="Filled by the customer when signing">${escapeHtml(cf.label || cf.key)}</span>`;
    }
    const v = ctx[key];
    if (v === undefined || v === null || String(v).trim() === "") {
      return mode === "final"
        ? `<span class="wlc-blank">&nbsp;</span>`
        : `<span class="wlc-missing" title="Empty field">${escapeHtml(fieldLabel(key, document))}</span>`;
    }
    const safe = escapeHtml(v);
    return mode === "preview" ? `<span class="wlc-var">${safe}</span>` : safe;
  });
};

const isEmptyHtml = (html) => !html || !String(html).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();

export const contractCss = (settings = {}) => {
  const accent = settings.accent || "#09234c";
  const font = FONTS[settings.font] || FONTS.serif;
  const size = Number(settings.fontSize) || 11;
  return `
.wlc{--wlc-accent:${accent};font-family:${font};font-size:${size}pt;line-height:1.55;color:#111827;text-align:left;word-wrap:break-word}
.wlc *{box-sizing:border-box}
.wlc p{margin:0 0 .55em}
.wlc p:last-child{margin-bottom:0}
.wlc ul,.wlc ol{margin:.2em 0 .6em;padding-left:1.4em}
.wlc a{color:var(--wlc-accent)}
.wlc-header{text-align:center;padding-bottom:14px;margin-bottom:18px;border-bottom:3px double var(--wlc-accent)}
.wlc-logo{max-height:64px;max-width:220px;margin:0 auto 10px;display:block}
.wlc-company{font-size:1.45em;font-weight:700;letter-spacing:.04em;color:var(--wlc-accent);text-transform:uppercase}
.wlc-title{font-size:1.25em;font-weight:700;letter-spacing:.08em;margin-top:6px;text-transform:uppercase}
.wlc-subtitle{font-size:1.05em;font-weight:600;margin-top:4px;color:#374151}
.wlc-details{width:100%;border-collapse:collapse;margin:0 0 20px}
.wlc-details td{border:1px solid #9ca3af;padding:6px 10px;vertical-align:top}
.wlc-details td:first-child{width:34%;font-weight:700;background:#f3f4f6}
.wlc-article{margin:0 0 16px}
.wlc-h{font-size:1.06em;font-weight:700;text-transform:uppercase;color:var(--wlc-accent);margin:20px 0 8px;padding-bottom:3px;border-bottom:1px solid #d1d5db;page-break-after:avoid;break-after:avoid}
.wlc-h .n{margin-right:.35em}
.wlc-clauses{list-style:none;margin:0;padding:0}
.wlc-clause{display:flex;gap:.6em;margin:0 0 .45em;page-break-inside:avoid;break-inside:avoid}
.wlc-clause .n{flex:none;min-width:2.4em;font-weight:600}
.wlc-clause .b{flex:1;min-width:0}
.wlc-text{margin:0 0 14px}
.wlc-sched{margin:6px 0 20px}
.wlc-sched-title{font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 8px;color:var(--wlc-accent)}
.wlc-table{width:100%;border-collapse:collapse;font-size:.88em}
.wlc-table th,.wlc-table td{border:1px solid #6b7280;padding:5px 7px;vertical-align:top}
.wlc-table th{background:#e5e7eb;font-weight:700;text-align:left}
.wlc-table tr{page-break-inside:avoid;break-inside:avoid}
.wlc-table .r{text-align:right;white-space:nowrap}
.wlc-table .c{text-align:center}
.wlc-table tfoot td{font-weight:700;background:#f9fafb}
.wlc-table tfoot tr.net td{background:#eef2f7}
.wlc-table tfoot tr.wlc-vatnote td{background:#fff7ed;color:#9a3412;font-weight:600;text-align:center;letter-spacing:.01em}
.wlc-sigs{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:14px;page-break-inside:avoid;break-inside:avoid}
.wlc-sig{border:1px solid #d1d5db;border-radius:4px;padding:12px 14px}
.wlc-sig-label{font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--wlc-accent)}
.wlc-sig-org{font-weight:700;margin:2px 0 10px}
.wlc-sig-row{margin:6px 0}
.wlc-sig-slot{min-height:64px;border-bottom:1px solid #111827;margin:10px 0 4px;display:flex;align-items:flex-end;gap:10px}
.wlc-sig-img{max-height:70px;max-width:100%;display:block}
.wlc-stamp{max-height:80px;opacity:.9}
.wlc-sig-meta{font-size:.8em;color:#4b5563;margin-top:2px}
.wlc-blank{display:inline-block;min-width:9em;border-bottom:1px solid #111827;height:1em;vertical-align:baseline}
.wlc-missing{background:#fff4d6;color:#92400e;border:1px dashed #f59e0b;border-radius:4px;padding:0 4px;font-family:-apple-system,"Segoe UI",sans-serif;font-size:.85em}
.wlc-cust{background:#eaf6ff;color:#075985;border:1px dashed #38bdf8;border-radius:4px;padding:0 4px;font-family:-apple-system,"Segoe UI",sans-serif;font-size:.85em}
.wlc-cust:after{content:" · customer fills";opacity:.7}
.wlc-var{background:rgba(29,79,145,.08);border-radius:3px;box-shadow:0 0 0 1px rgba(29,79,145,.18)}
.wlc-pagebreak{page-break-after:always;break-after:page;height:0;border-top:1px dashed #cbd5e1;margin:24px 0}
.wlc-ql-align-center,.wlc .ql-align-center{text-align:center}
.wlc .ql-align-right{text-align:right}
.wlc .ql-align-justify{text-align:justify}
.wlc .ql-indent-1{padding-left:2em}
.wlc .ql-indent-2{padding-left:4em}
@media (max-width:640px){.wlc-sigs{grid-template-columns:1fr}.wlc-table{font-size:.78em}}
@media print{.wlc-pagebreak{border:0;margin:0}.wlc-var{background:none;box-shadow:none}}
`;
};

/** Render the whole document. Returns an HTML string with a <style> tag. */
export const renderContract = ({ document, request, values, contract, mode = "final" }) => {
  const { ctx, rows, totals, settings } = buildContext({ document, request, values, contract });
  const fill = filler(ctx, mode, document);
  const blocks = document?.blocks || [];
  let articleNo = 0;
  const out = [];
  const currency = escapeHtml(settings.currency || "ETB");

  blocks.forEach((b) => {
    switch (b.type) {
      case "header": {
        const logo = b.showLogo !== false && settings.company?.logoUrl
          ? `<img class="wlc-logo" src="${escapeHtml(settings.company.logoUrl)}" alt="" />`
          : "";
        out.push(
          `<header class="wlc-header">${logo}` +
            (b.company ? `<div class="wlc-company">${fill(b.company, { escape: true })}</div>` : "") +
            (b.title ? `<div class="wlc-title">${fill(b.title, { escape: true })}</div>` : "") +
            (b.subtitle ? `<div class="wlc-subtitle">${fill(b.subtitle, { escape: true })}</div>` : "") +
            `</header>`,
        );
        break;
      }
      case "details": {
        const trs = (b.rows || [])
          .map((r) => `<tr><td>${fill(r.label, { escape: true })}</td><td>${fill(r.value, { escape: true })}</td></tr>`)
          .join("");
        if (trs) out.push(`<table class="wlc-details">${trs}</table>`);
        break;
      }
      case "article": {
        const numbered = b.numbered !== false;
        if (numbered) articleNo += 1;
        const n = articleNo;
        const clauses = (b.clauses || []).filter((c) => !isEmptyHtml(c.html) || mode !== "final");
        const lis = clauses
          .map(
            (c, i) =>
              `<li class="wlc-clause">${numbered ? `<span class="n">${n}.${i + 1}</span>` : `<span class="n">•</span>`}<div class="b">${fill(c.html)}</div></li>`,
          )
          .join("");
        out.push(
          `<section class="wlc-article">` +
            `<h2 class="wlc-h">${numbered ? `<span class="n">${n}.</span>` : ""}${fill(b.title, { escape: true })}</h2>` +
            (isEmptyHtml(b.intro) ? "" : `<div class="wlc-text">${fill(b.intro)}</div>`) +
            (lis ? `<ol class="wlc-clauses">${lis}</ol>` : "") +
            (isEmptyHtml(b.outro) ? "" : `<div class="wlc-text">${fill(b.outro)}</div>`) +
            `</section>`,
        );
        break;
      }
      case "text": {
        if (!isEmptyHtml(b.html)) out.push(`<div class="wlc-text">${fill(b.html)}</div>`);
        break;
      }
      case "schedule": {
        const cols = (b.columns || []).filter((c) => SCHEDULE_COLUMNS[c]);
        const head = cols
          .map((c) => {
            const meta = SCHEDULE_COLUMNS[c];
            const label =
              c === "rate" || c === "amount"
                ? `${meta.label} (${currency}${totals.vatIncluded ? "" : ", excl. VAT"})`
                : meta.label;
            return `<th class="${meta.align === "right" ? "r" : meta.align === "center" ? "c" : ""}">${escapeHtml(label)}</th>`;
          })
          .join("");
        const body = rows
          .map((r, i) => {
            const cells = cols.map((c) => {
              const meta = SCHEDULE_COLUMNS[c];
              const cls = meta.align === "right" ? "r" : meta.align === "center" ? "c" : "";
              let v;
              if (c === "no") v = String(i + 1);
              else if (c === "rate") v = fmtMoney(r.rate);
              else if (c === "amount") v = fmtMoney((Number(r.days) || 0) * (Number(r.rate) || 0));
              else v = r[c] ?? "";
              const empty = v === "" || v === null;
              return `<td class="${cls}">${empty ? (mode === "final" ? "&nbsp;" : `<span class="wlc-missing">${escapeHtml(meta.label)}</span>`) : escapeHtml(v)}</td>`;
            });
            return `<tr>${cells.join("")}</tr>`;
          })
          .join("");
        let foot = "";
        if (b.showTotals !== false && cols.length >= 2 && rows.length) {
          const span = cols.length - 1;
          const line = (label, val, cls = "") =>
            `<tr class="${cls}"><td colspan="${span}" class="r">${escapeHtml(label)}</td><td class="r">${fmtMoney(val)}</td></tr>`;
          /* Old footer (VAT exclusive added VAT on top)
          const inc = settings.pricesIncludeVat !== false;
          foot =
            line(inc ? "Amount incl. VAT" : "Amount excl. VAT", inc ? totals.gross : totals.beforeVat) +
            (totals.vatRate ? line(`VAT ${totals.vatRate}%`, totals.vat) : "") +
            (!inc ? line("Total incl. VAT", totals.gross) : "") +
            (totals.whRate ? line(`Withholding ${totals.whRate}%`, totals.withholding) : "") +
            (totals.whRate ? line("Net payable", totals.net, "net") : "");
          */
          const tail =
            (totals.whRate ? line(`Withholding ${totals.whRate}%`, totals.withholding) : "") +
            (totals.whRate ? line("Net payable", totals.net, "net") : "");
          foot = totals.vatIncluded
            ? (totals.vatRate ? line("Amount before VAT", totals.beforeVat) + line(`VAT ${totals.vatRate}%`, totals.vat) : "") +
              line("Total incl. VAT", totals.gross, totals.whRate ? "" : "net") +
              tail
            : line("Total (VAT exclusive)", totals.gross, totals.whRate ? "" : "net") +
              tail +
              `<tr class="wlc-vatnote"><td colspan="${cols.length}"><b>VAT EXCLUSIVE:</b> all prices in this table do not include VAT.</td></tr>`;
        }
        out.push(
          `<section class="wlc-sched">` +
            (isEmptyHtml(b.intro) ? "" : `<div class="wlc-text">${fill(b.intro)}</div>`) +
            (b.title ? `<div class="wlc-sched-title">${fill(b.title, { escape: true })}</div>` : "") +
            `<table class="wlc-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot ? `<tfoot>${foot}</tfoot>` : ""}</table>` +
            `</section>`,
        );
        break;
      }
      case "signatures": {
        const numbered = b.numbered !== false && !!b.title;
        if (numbered) articleNo += 1;
        const company = settings.company || {};
        const party = (p, side) => {
          const slot =
            side === "lessee"
              ? `<!--SIG:customer-->`
              : [
                  company.signatureUrl ? `<img class="wlc-sig-img" src="${escapeHtml(company.signatureUrl)}" alt="" />` : "",
                  company.stampUrl ? `<img class="wlc-stamp" src="${escapeHtml(company.stampUrl)}" alt="" />` : "",
                ].join("");
          return (
            `<div class="wlc-sig">` +
            `<div class="wlc-sig-label">${fill(p?.label || "", { escape: true })}</div>` +
            `<div class="wlc-sig-org">${fill(p?.org || "", { escape: true })}</div>` +
            `<div class="wlc-sig-row">Name: ${fill(p?.name || "", { escape: true }) || '<span class="wlc-blank">&nbsp;</span>'}</div>` +
            `<div class="wlc-sig-row">Position: ${fill(p?.position || "", { escape: true }) || '<span class="wlc-blank">&nbsp;</span>'}</div>` +
            `<div class="wlc-sig-row">Signature:</div><div class="wlc-sig-slot">${slot}</div>` +
            `<div class="wlc-sig-row">Date: ${
              side === "lessee" && mode === "final"
                ? `<span class="wlc-cf" data-cf="__signed_date"><span class="wlc-blank">&nbsp;</span></span>`
                : `<span class="wlc-blank">&nbsp;</span>`
            }</div>` +
            `</div>`
          );
        };
        out.push(
          `<section class="wlc-article">` +
            (b.title ? `<h2 class="wlc-h">${numbered ? `<span class="n">${articleNo}.</span>` : ""}${fill(b.title, { escape: true })}</h2>` : "") +
            (isEmptyHtml(b.intro) ? "" : `<div class="wlc-text">${fill(b.intro)}</div>`) +
            `<div class="wlc-sigs">${party(b.lessor, "lessor")}${party(b.lessee, "lessee")}</div>` +
            `</section>`,
        );
        break;
      }
      case "pageBreak":
        out.push(`<div class="wlc-pagebreak"></div>`);
        break;
      default:
        break;
    }
  });

  return `<style>${contractCss(settings)}</style><div class="wlc">${out.join("")}</div>`;
};

/** Same replacement the backend does when a contract is signed. */
export const withSignature = (html, c) => {
  if (!html) return "";
  if (c?.status !== "SIGNED" || !c.signatureImage) return html;
  const when = c.signedAt ? new Date(c.signedAt).toLocaleString("en-GB") : "";
  return html
    .split("<!--SIG:customer-->")
    .join(
      `<img class="wlc-sig-img" src="${escapeHtml(c.signatureImage)}" alt="Signature" /><div class="wlc-sig-meta">Signed electronically by ${escapeHtml(c.signerName || "")}${when ? ` · ${escapeHtml(when)}` : ""}</div>`,
    );
};
