// contract-public.page.ts
// The page a customer opens to review and e-sign a contract
// (GET /contracts/view/:token). Works in any browser and inside the mobile
// app WebView (?app=1 → posts {type:"signed"|"declined"} to React Native).

const esc = (s: any) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const fmt = (d?: string | Date | null) => {
  if (!d) return '';
  const x = new Date(d);
  const m = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][x.getMonth()];
  return `${x.getDate()} ${m} ${x.getFullYear()}, ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  SENT: { label: 'Waiting for your signature', tone: 'amber' },
  VIEWED: { label: 'Waiting for your signature', tone: 'amber' },
  SIGNED: { label: 'Signed', tone: 'green' },
  DECLINED: { label: 'Declined', tone: 'red' },
  VOID: { label: 'Cancelled', tone: 'gray' },
};

const BASE_CSS = `
*{box-sizing:border-box}
html,body{margin:0}
body{background:#eef1f5;color:#0f172a;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.top{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.94);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid #e2e6ec}
.top-in{max-width:900px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:12px}
.brand{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.mark{width:34px;height:34px;border-radius:10px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:800;font-size:15px;flex:none}
.brand b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand span{display:block;font-size:12px;color:#64748b}
.pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid transparent;white-space:nowrap}
.pill i{width:7px;height:7px;border-radius:99px;background:currentColor}
.pill.amber{background:#fef6e4;color:#b45309;border-color:#fde7b0}
.pill.green{background:#e7f8f1;color:#047857;border-color:#b7ebd5}
.pill.red{background:#fdecec;color:#b42318;border-color:#f8caca}
.pill.gray{background:#f1f5f9;color:#475569;border-color:#e2e6ec}
.btn{appearance:none;border:1px solid #d5dbe3;background:#fff;color:#0f172a;border-radius:10px;height:40px;padding:0 14px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;justify-content:center;text-decoration:none}
.btn:hover{background:#f8fafc}
.btn.primary{background:#c2410c;border-color:#c2410c;color:#fff}
.btn.primary:hover{background:#9a3412}
.btn.primary[disabled]{opacity:.55;cursor:not-allowed}
.btn.link{border:0;background:none;color:#64748b;height:auto;padding:6px 4px;text-decoration:underline}
main{max-width:900px;margin:0 auto;padding:18px 12px 60px}
.banner{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:14px;margin-bottom:16px;border:1px solid}
.banner b{display:block}
.banner.amber{background:#fffaf0;border-color:#fde7b0}
.banner.green{background:#effbf6;border-color:#b7ebd5}
.banner.red{background:#fff5f5;border-color:#f8caca}
.banner.gray{background:#f8fafc;border-color:#e2e6ec}
.paper{background:#fff;border-radius:6px;box-shadow:0 1px 2px rgba(15,23,42,.06),0 12px 40px -12px rgba(15,23,42,.18);padding:56px 60px;overflow-x:auto}
.card{background:#fff;border:1px solid #e2e6ec;border-radius:18px;padding:22px;margin-top:20px;box-shadow:0 10px 30px -18px rgba(15,23,42,.25)}
.card h2{margin:0 0 4px;font-size:19px;letter-spacing:-.2px}
.muted{color:#64748b;font-size:13.5px}
label.f{display:block;font-size:13px;font-weight:600;margin:16px 0 6px;color:#334155}
select{width:100%;border:1px solid #d5dbe3;border-radius:10px;padding:11px 12px;font:inherit;font-size:15px;background:#fff;color:#0f172a}
input[type=text],textarea{width:100%;border:1px solid #d5dbe3;border-radius:10px;padding:11px 12px;font:inherit;font-size:15px;background:#fff;color:#0f172a}
input[type=text]:focus,textarea:focus{outline:none;border-color:#fc6b38;box-shadow:0 0 0 3px rgba(252,107,56,.18)}
.pad-wrap{position:relative;border:1.5px dashed #c3cbd7;border-radius:12px;background:#fbfcfe;touch-action:none}
.pad-wrap.has{border-style:solid;border-color:#94a3b8}
canvas{display:block;width:100%;height:190px;cursor:crosshair;border-radius:12px}
.pad-hint{position:absolute;inset:0;display:grid;place-items:center;color:#94a3b8;font-size:14px;pointer-events:none}
.pad-line{position:absolute;left:24px;right:24px;bottom:42px;border-bottom:1px solid #d5dbe3;pointer-events:none}
.pad-tools{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
.check{display:flex;gap:10px;align-items:flex-start;margin:18px 0 6px;font-size:14px;cursor:pointer}
.check input{width:18px;height:18px;margin-top:2px;accent-color:#c2410c;flex:none}
.actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px;flex-wrap:wrap}
.err{color:#b42318;font-size:13.5px;margin-top:10px;min-height:1px}
.decline{display:none;margin-top:14px}
.decline.open{display:block}
.signed-sig{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.signed-sig img{max-height:70px;background:#fff;border:1px solid #e2e6ec;border-radius:10px;padding:6px 10px}
.foot{text-align:center;color:#94a3b8;font-size:12px;margin-top:26px}
@media (max-width:640px){
  .paper{padding:26px 18px;border-radius:0;margin:0 -12px}
  .top .hide-sm{display:none}
  .card{padding:18px}
}
@media print{
  body{background:#fff}
  .top,.banner,.card,.foot,.no-print{display:none!important}
  main{padding:0;max-width:none}
  .paper{box-shadow:none;padding:0;border-radius:0}
  @page{size:A4;margin:16mm 16mm 18mm}
}
`;

const SCRIPT = `
(function(){
  var token = document.body.getAttribute('data-token');
  var inApp = document.body.getAttribute('data-app') === '1';
  var printBtn = document.getElementById('print');
  if (printBtn) printBtn.addEventListener('click', function(){ window.print(); });
  function tell(type){ try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type:type})); }catch(e){} }
  var form = document.getElementById('sign-form');
  if (!form) return;

  // ---- signature pad ----
  var canvas = document.getElementById('pad'), wrap = document.getElementById('pad-wrap');
  var ctx = canvas.getContext('2d'), drawing = false, has = false, last = null;
  function size(){
    var r = canvas.getBoundingClientRect(), dpr = Math.max(window.devicePixelRatio || 1, 1);
    var data = has ? canvas.toDataURL() : null;
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b1f44'; ctx.lineWidth = 2.4;
    if (data){ var img = new Image(); img.onload = function(){ ctx.drawImage(img,0,0,r.width,r.height); }; img.src = data; }
  }
  size(); window.addEventListener('resize', size);
  function pos(e){ var r = canvas.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; }
  canvas.addEventListener('pointerdown', function(e){ e.preventDefault(); drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId);
    ctx.beginPath(); ctx.arc(last.x,last.y,1.1,0,Math.PI*2); ctx.fillStyle='#0b1f44'; ctx.fill(); mark(); });
  canvas.addEventListener('pointermove', function(e){ if(!drawing) return; e.preventDefault(); var p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last = p; });
  ['pointerup','pointercancel','pointerleave'].forEach(function(t){ canvas.addEventListener(t, function(){ drawing = false; }); });
  function mark(){ if(!has){ has = true; wrap.classList.add('has'); document.getElementById('pad-hint').style.display='none'; } check(); }
  document.getElementById('clear').addEventListener('click', function(){ ctx.clearRect(0,0,canvas.width,canvas.height); has=false; wrap.classList.remove('has'); document.getElementById('pad-hint').style.display=''; check(); });

  var nameEl = document.getElementById('name'), agreeEl = document.getElementById('agree'), btn = document.getElementById('sign-btn'), err = document.getElementById('err');
  var cfEls = Array.prototype.slice.call(document.querySelectorAll('[data-cf]'));
  function cfOk(){ return cfEls.every(function(el){ return el.getAttribute('data-req') !== '1' || el.value.trim(); }); }
  function check(){ btn.disabled = !(has && agreeEl.checked && nameEl.value.trim().length >= 3 && cfOk()); }
  nameEl.addEventListener('input', check); agreeEl.addEventListener('change', check);
  cfEls.forEach(function(el){ el.addEventListener('input', check); el.addEventListener('change', check); }); check();

  function post(path, body){
    return fetch(location.pathname.replace(/\\/$/,'') + path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      .then(function(r){ return r.json().then(function(j){ if(!r.ok || (j && j.success === false)) throw new Error((j && (Array.isArray(j.message) ? j.message.join(', ') : j.message)) || 'Something went wrong'); return j; }); });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault(); err.textContent='';
    // trim the signature to a white-background PNG
    var out = document.createElement('canvas'); out.width = canvas.width; out.height = canvas.height;
    var o = out.getContext('2d'); o.fillStyle='#fff'; o.fillRect(0,0,out.width,out.height); o.drawImage(canvas,0,0);
    btn.disabled = true; btn.textContent = 'Signing…';
    var fields = {}; cfEls.forEach(function(el){ if (el.value.trim()) fields[el.getAttribute('data-cf')] = el.value.trim(); });
    post('/sign', { name: nameEl.value.trim(), signature: out.toDataURL('image/png'), agree: agreeEl.checked, fields: fields })
      .then(function(){ tell('signed'); location.reload(); })
      .catch(function(x){ err.textContent = x.message; btn.textContent = 'Sign contract'; check(); });
  });

  var dBtn = document.getElementById('decline-open'), dBox = document.getElementById('decline');
  dBtn.addEventListener('click', function(){ dBox.classList.toggle('open'); });
  document.getElementById('decline-send').addEventListener('click', function(){
    var b = this; b.disabled = true;
    post('/decline', { reason: document.getElementById('reason').value.trim() || undefined })
      .then(function(){ tell('declined'); location.reload(); })
      .catch(function(x){ err.textContent = x.message; b.disabled = false; });
  });
})();
`;

export function contractPublicPage(
  view: any,
  opts: { token: string; nonce: string; inApp: boolean },
) {
  const st = STATUS[view.status] || STATUS.SENT;
  const canSign = view.status === 'SENT' || view.status === 'VIEWED';
  const initial = esc((view.companyName || 'W').trim().charAt(0).toUpperCase());

  const banner = canSign
    ? `<div class="banner amber"><div><b>Please review and sign</b><span class="muted">Read the contract below. When you are ready, sign at the bottom of the page.</span></div></div>`
    : view.status === 'SIGNED'
      ? `<div class="banner green"><div><b>Signed by ${esc(view.signerName)}</b><span class="muted">${esc(fmt(view.signedAt))} · You can print or save this page as PDF.</span></div></div>`
      : view.status === 'DECLINED'
        ? `<div class="banner red"><div><b>You declined this contract</b><span class="muted">Our team will contact you to agree the changes.</span></div></div>`
        : `<div class="banner gray"><div><b>This contract was cancelled</b><span class="muted">Please contact us if you have questions.</span></div></div>`;

  const price = view.totalPrice
    ? `${esc(Number(view.totalPrice).toLocaleString('en-US', { maximumFractionDigits: 2 }))} ${esc(view.currency || 'ETB')}`
    : '';
  const cfs: any[] = view.customerFields || [];
  const signer = cfs.find((f) => f.source === 'signer');
  const extra = cfs.filter((f) => f.source !== 'signer');
  const signCard = canSign
    ? `
<form class="card" id="sign-form" autocomplete="off">
  <h2>Sign the contract</h2>
  <div class="muted">Contract ${esc(view.contractNo)} · ${esc(view.trackingCode)}${price ? ` · <b>${price}</b>` : ''}</div>
  <label class="f" for="name">${esc(signer?.label || 'Full name')} *</label>
  <input type="text" id="name" maxlength="120" value="${esc(signer?.default || view.customerName)}" />
  ${extra
    .map(
      (
        f: any,
      ) => `<label class="f" for="cf-${esc(f.key)}">${esc(f.label)}${f.required ? ' *' : ' <span class="muted">(optional)</span>'}</label>
  ${
    f.type === 'select' && f.options?.length
      ? `<select id="cf-${esc(f.key)}" data-cf="${esc(f.key)}" data-req="${f.required ? 1 : 0}"><option value=""></option>${f.options.map((o: string) => `<option>${esc(o)}</option>`).join('')}</select>`
      : `<input type="text" id="cf-${esc(f.key)}" data-cf="${esc(f.key)}" data-req="${f.required ? 1 : 0}" maxlength="300" placeholder="${esc(f.help || '')}" value="${esc(f.default || '')}" />`
  }`,
    )
    .join('')}
  <label class="f">Signature</label>
  <div class="pad-wrap" id="pad-wrap"><canvas id="pad" aria-label="Draw your signature"></canvas><div class="pad-line"></div><div class="pad-hint" id="pad-hint">Draw your signature here</div></div>
  <div class="pad-tools"><span class="muted">Use your finger or mouse</span><button type="button" class="btn link" id="clear">Clear</button></div>
  <label class="check"><input type="checkbox" id="agree" /> <span>I have read this contract and I agree to its terms${price ? ` and the price of <b>${price}</b>` : ''}. My electronic signature is legally binding, like a handwritten one.</span></label>
  <div class="err" id="err" role="alert"></div>
  <div class="actions">
    <button type="button" class="btn link" id="decline-open">I don't agree</button>
    <button type="submit" class="btn primary" id="sign-btn" disabled>Sign contract</button>
  </div>
  <div class="decline" id="decline">
    <label class="f" for="reason">What should we change? (optional)</label>
    <textarea id="reason" rows="3" maxlength="1000" placeholder="e.g. the dates or the number of cars"></textarea>
    <div class="actions"><span></span><button type="button" class="btn" id="decline-send">Decline contract</button></div>
  </div>
</form>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow" />
<title>${esc(view.title)} · ${esc(view.contractNo)}</title>
<style>:root{--accent:${esc(view.accent || '#09234c')}}${BASE_CSS}</style>
</head>
<body data-token="${esc(opts.token)}" data-app="${opts.inApp ? '1' : '0'}">
<header class="top"><div class="top-in">
  <div class="brand"><span class="mark">${initial}</span><div style="min-width:0"><b>${esc(view.title)}</b><span>${esc(view.contractNo)} · ${esc(view.companyName)}</span></div></div>
  <span class="pill ${st.tone}"><i></i>${st.label}</span>
  <button class="btn hide-sm" id="print" type="button">Print / PDF</button>
</div></header>
<main>
  ${banner}
  <article class="paper">${view.html || '<p>This contract is empty.</p>'}</article>
  ${signCard}
  <div class="foot">${esc(view.companyName)} · Secure contract link — do not share it.</div>
</main>
<script nonce="${opts.nonce}">${SCRIPT}</script>
</body>
</html>`;
}

export function contractErrorPage(message: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Contract</title>
<style>${BASE_CSS}</style></head><body><main style="max-width:520px;padding-top:80px">
<div class="card" style="text-align:center"><h2>We couldn't open this contract</h2><p class="muted">${esc(message)}</p><p class="muted">Please contact our team for a new link.</p></div>
</main></body></html>`;
}
