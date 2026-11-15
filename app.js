/* InvoiceKit: a document you edit on the page. MIT. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  var SYM = { USD: '$', EUR: '€', CNY: '¥', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$', SGD: 'S$', HKD: 'HK$' };
  var ZERO = { JPY: true };
  var ACCENTS = { '#1f3fd0': '#f1f3ff', '#15161a': '#f4f4f5', '#1f6b4a': '#eef7f2', '#a8452a': '#fdf2ee' };

  var L = {
    en: { kind: ['INVOICE', 'QUOTE'], bill: 'BILL TO', due: 'AMOUNT DUE', desc: 'DESCRIPTION', qty: 'QTY', rate: 'RATE', amt: 'AMOUNT',
      sub: 'Subtotal', disc: 'Discount', tax: 'Tax', total: 'Total', pay: 'PAYMENT DETAILS', notes: 'NOTES', thanks: 'Thank you for your business.',
      issued: 'Issued', dueOn: 'Due' },
    zh: { kind: ['发票', '报价单'], bill: '客户', due: '应付金额', desc: '描述', qty: '数量', rate: '单价', amt: '金额',
      sub: '小计', disc: '折扣', tax: '税', total: '合计', pay: '收款信息', notes: '备注', thanks: '感谢您的惠顾。',
      issued: '开票日期', dueOn: '到期日' }
  };
  function lab(key) {
    var d = D.lang;
    if (d === 'en') return L.en[key];
    if (d === 'zh') return L.zh[key];
    var a = L.en[key], b = L.zh[key];
    if (Array.isArray(a)) return a[0] + ' / ' + b[0];
    return a + ' / ' + b;
  }

  function today(offset) {
    var d = new Date();
    if (offset) d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  var D = {
    type: 'invoice', number: 'INV-2026-0001',
    issue: today(0), due: today(20),
    currency: 'USD', lang: 'both', accent: '#1f3fd0',
    biz: { name: 'Northline Studio', addr: 'Room 1204, Block B, Nanshan Tech Park\nShenzhen, Guangdong 518057\nChina', email: 'hello@northline.studio' },
    cli: { name: 'Halcyon Labs Inc.', addr: '2200 Westlake Avenue, Suite 400\nSeattle, WA 98121\nUnited States', email: 'accounts@halcyonlabs.com' },
    items: [
      { desc: 'Brand identity system, logo and type scale', qty: 1, rate: 2400 },
      { desc: 'Landing page design and build', qty: 3, rate: 420 },
      { desc: 'Monthly retainer, November', qty: 1, rate: 600 }
    ],
    tax: 0, discount: 0, discMode: 'amount',
    pay: 'Wire transfer to Northline Studio\nBank of China, Shenzhen Branch\nAccount 6217 8520 1100 4471\nSWIFT BOCNCNBJ',
    notes: 'Payment is due within 20 days. Late payments accrue 1.5% monthly.',
    logo: ''
  };

  function num(n) {
    n = Number(n) || 0;
    var dec = ZERO[D.currency] ? 0 : 2;
    var s = Math.abs(n).toFixed(dec);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '-' : '') + SYM[D.currency] + parts.join('.');
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function fmtNum(n, dec) {
    var s = (Number(n) || 0).toFixed(dec == null ? 2 : dec);
    var p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return p.join('.');
  }

  function totals() {
    var sub = D.items.reduce(function (a, it) { return a + (Number(it.qty) || 0) * (Number(it.rate) || 0); }, 0);
    var disc = D.discMode === 'percent' ? sub * (Number(D.discount) || 0) / 100 : (Number(D.discount) || 0);
    disc = Math.min(disc, sub);
    var tax = (sub - disc) * (Number(D.tax) || 0) / 100;
    return { sub: round2(sub), disc: round2(disc), tax: round2(tax), total: round2(sub - disc + tax) };
  }

  function setPath(obj, path, val) {
    var parts = path.split('.'), o = obj;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  /* ---------- render ---------- */
  function renderLabels() {
    var kind = D.type === 'invoice' ? lab('kind')[0] : (D.lang === 'zh' ? '报价单' : (D.lang === 'both' ? 'QUOTE / 报价单' : 'QUOTE'));
    if (D.lang === 'both' && D.type === 'quote') kind = 'QUOTE / 报价单';
    if (D.lang === 'en' && D.type === 'quote') kind = 'QUOTE';
    if (D.lang === 'zh' && D.type === 'invoice') kind = '发票';
    if (D.lang === 'both' && D.type === 'invoice') kind = 'INVOICE / 发票';
    $('kindLabel').textContent = kind;
    $('billLabel').textContent = lab('bill');
    $('dueLabel').textContent = lab('due');
    $('thDesc').textContent = lab('desc');
    $('thQty').textContent = lab('qty');
    $('thRate').textContent = lab('rate');
    $('thAmt').textContent = lab('amt');
    $('tSubLabel').textContent = lab('sub');
    $('tDiscLabel').textContent = lab('disc');
    $('tTaxLabel').textContent = lab('tax');
    $('tTotLabel').textContent = lab('total');
    $('payLabel').textContent = lab('pay');
    $('noteLabel').textContent = lab('notes');
    $('thanksLabel').textContent = lab('thanks');
    renderDates();
  }

  function renderDates() {
    var f = function (iso) {
      if (!iso) return '';
      var p = String(iso).split('-');
      if (p.length !== 3) return iso;
      return p[0] + '-' + p[1] + '-' + p[2];
    };
    $('dateLine').textContent = lab('issued') + ' ' + f(D.issue) + '\n' + lab('dueOn') + ' ' + f(D.due);
  }

  function renderParties() {
    var b = [D.biz.addr, D.biz.email].filter(Boolean).join('\n');
    var c = [D.cli.addr, D.cli.email].filter(Boolean).join('\n');
    $('bizMeta').textContent = b;
    $('cliMeta').textContent = c;
    var name = document.querySelector('[data-f="biz.name"]');
    if (name && document.activeElement !== name) name.textContent = D.biz.name;
    var cli = document.querySelector('[data-f="cli.name"]');
    if (cli && document.activeElement !== cli) cli.textContent = D.cli.name;
    var no = document.querySelector('[data-f="number"]');
    if (no && document.activeElement !== no) no.textContent = D.number;
    var pay = document.querySelector('[data-f="pay"]');
    if (pay && document.activeElement !== pay) pay.textContent = D.pay;
    var notes = document.querySelector('[data-f="notes"]');
    if (notes && document.activeElement !== notes) notes.textContent = D.notes;
  }

  function renderRows() {
    var body = $('rows');
    body.innerHTML = '';
    D.items.forEach(function (it, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="c-desc"><div class="desc-cell" contenteditable="true" spellcheck="false" data-f="items.' + i + '.desc"></div></td>' +
        '<td class="c-qty"><div contenteditable="true" spellcheck="false" data-f="items.' + i + '.qty"></div></td>' +
        '<td class="c-rate"><div contenteditable="true" spellcheck="false" data-f="items.' + i + '.rate"></div></td>' +
        '<td class="c-amt" data-amt="' + i + '"></td>' +
        '<td class="c-op"><button class="row-del" type="button" data-del="' + i + '" aria-label="Delete line">×</button></td>';
      body.appendChild(tr);
      tr.querySelector('[data-f$=".desc"]').textContent = it.desc;
      tr.querySelector('[data-f$=".qty"]').textContent = String(it.qty);
      tr.querySelector('[data-f$=".rate"]').textContent = fmtNum(it.rate, 2);
    });
    recompute();
  }

  function recompute() {
    var t = totals();
    D.items.forEach(function (it, i) {
      var cell = document.querySelector('[data-amt="' + i + '"]');
      if (cell) cell.textContent = num((Number(it.qty) || 0) * (Number(it.rate) || 0));
    });
    $('tSub').textContent = num(t.sub);
    $('tDisc').textContent = '-' + num(t.disc);
    $('tTax').textContent = num(t.tax);
    $('tTot').textContent = num(t.total);
    $('dueAmount').textContent = num(t.total);
    $('rowDiscount').hidden = !(Number(D.discount) > 0);
    $('rowTax').hidden = !(Number(D.tax) > 0);
    $('roSub').textContent = num(t.sub);
    $('roDisc').textContent = num(t.disc);
    $('roTax').textContent = num(t.tax);
    $('roTot').textContent = num(t.total);
  }

  function renderAll() {
    renderLabels();
    renderParties();
    renderRows();
    renderLogo();
    applyAccent();
  }

  function applyAccent() {
    document.documentElement.style.setProperty('--accent', D.accent);
    document.documentElement.style.setProperty('--tint', ACCENTS[D.accent] || '#f1f3ff');
    Array.prototype.forEach.call(document.querySelectorAll('.sw'), function (b) {
      b.classList.toggle('is-on', b.dataset.accent === D.accent);
    });
  }

  function renderLogo() {
    if (D.logo) {
      $('logoBox').hidden = false;
      $('logoImg').src = D.logo;
      $('logoName').textContent = 'Logo set';
      $('clearLogo').hidden = false;
    } else {
      $('logoBox').hidden = true;
      $('logoName').textContent = 'Drop an image or click';
      $('clearLogo').hidden = true;
    }
  }

  /* ---------- save ---------- */
  var saveTimer = null;
  function scheduleSave() {
    $('saveState').textContent = 'Saving';
    $('saveState').classList.add('busy');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem('invoicekit.v1', JSON.stringify(D));
        $('saveState').textContent = 'Saved locally';
      } catch (e) {
        $('saveState').textContent = 'Not saved';
      }
      $('saveState').classList.remove('busy');
    }, 350);
  }

  /* ---------- toasts / undo ---------- */
  var undoStack = [];
  function snap() { undoStack.push(JSON.stringify(D)); if (undoStack.length > 20) undoStack.shift(); }
  function undo() {
    var prev = undoStack.pop();
    if (!prev) { toast('Nothing to undo'); return; }
    D = JSON.parse(prev);
    renderAll();
    scheduleSave();
  }
  function toast(msg, action) {
    var host = $('toasts');
    var node = document.createElement('div');
    node.className = 'toast';
    var s = document.createElement('span'); s.textContent = msg; node.appendChild(s);
    if (action) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = action.label;
      b.onclick = function () { action.run(); node.remove(); };
      node.appendChild(b);
    }
    host.appendChild(node);
    setTimeout(function () { node.style.opacity = '0'; setTimeout(function () { node.remove(); }, 200); }, action ? 6000 : 2200);
  }

  /* ---------- zoom ---------- */
  var zoom = 1, userZoomed = false;
  function setZoom(z, manual) {
    zoom = Math.max(0.35, Math.min(1.4, z));
    if (manual !== false) userZoomed = true;
    $('sheet').style.zoom = zoom;
    $('zoomVal').textContent = Math.round(zoom * 100) + '%';
  }
  function fitZoom() {
    if (window.innerWidth <= 860) { setZoom(1, false); return; }
    var w = $('canvas').clientWidth - 56;
    setZoom(Math.min(1, w / 794), false);
  }

  /* ---------- commands ---------- */
  function addLine() {
    snap();
    D.items.push({ desc: 'New line item', qty: 1, rate: 0 });
    renderRows();
    var cells = document.querySelectorAll('[data-f$=".desc"]');
    var last = cells[cells.length - 1];
    if (last) {
      last.focus();
      var r = document.createRange(); r.selectNodeContents(last);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    scheduleSave();
  }
  function deleteLine(i) {
    snap();
    var name = D.items[i].desc;
    D.items.splice(i, 1);
    renderRows();
    scheduleSave();
    toast('Line removed', { label: 'Undo', run: undo });
  }
  function setType(t) {
    D.type = t;
    Array.prototype.forEach.call(document.querySelectorAll('[data-type]'), function (b) { b.classList.toggle('is-on', b.dataset.type === t); });
    renderLabels();
    scheduleSave();
  }
  function setLang(l) {
    D.lang = l;
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) { b.classList.toggle('is-on', b.dataset.lang === l); });
    renderLabels();
    scheduleSave();
  }
  function newDoc() {
    snap();
    var n = String(Number((D.number.match(/(\d+)$/) || [0, 1])[1]) + 1);
    while (n.length < 4) n = '0' + n;
    D.number = D.number.replace(/\d+$/, n);
    D.issue = today(0); D.due = today(20);
    D.items = [{ desc: 'New line item', qty: 1, rate: 0 }];
    D.discount = 0; D.tax = 0;
    renderAll();
    syncInputs();
    scheduleSave();
    toast('New document ' + D.number, { label: 'Undo', run: undo });
  }
  function syncInputs() {
    $('currency').value = D.currency;
    $('issue').value = D.issue;
    $('due').value = D.due;
    $('tax').value = D.tax;
    $('discount').value = D.discount;
    $('bizEmail').value = D.biz.email;
    $('bizAddr').value = D.biz.addr;
    $('cliEmail').value = D.cli.email;
    $('cliAddr').value = D.cli.addr;
  }

  var COMMANDS = [
    { label: 'Add a line item', hint: 'A', run: addLine },
    { label: 'Print / Save as PDF', hint: '⌘P', run: function () { window.print(); } },
    { label: 'Invoice type', hint: '', run: function () { setType('invoice'); } },
    { label: 'Quote type', hint: '', run: function () { setType('quote'); } },
    { label: 'Language: English', hint: '', run: function () { setLang('en'); } },
    { label: 'Language: 中文', hint: '', run: function () { setLang('zh'); } },
    { label: 'Language: both', hint: '', run: function () { setLang('both'); } },
    { label: 'Currency: USD', hint: '', run: function () { D.currency = 'USD'; $('currency').value = 'USD'; recompute(); scheduleSave(); } },
    { label: 'Currency: EUR', hint: '', run: function () { D.currency = 'EUR'; $('currency').value = 'EUR'; recompute(); scheduleSave(); } },
    { label: 'Currency: CNY', hint: '', run: function () { D.currency = 'CNY'; $('currency').value = 'CNY'; recompute(); scheduleSave(); } },
    { label: 'Start a new invoice', hint: '', run: newDoc },
    { label: 'Undo', hint: '⌘Z', run: undo },
    { label: 'Fit the page to the window', hint: '', run: fitZoom }
  ];
  var palIdx = 0, palFiltered = COMMANDS;

  /* ---------- wiring ---------- */
  function wire() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('invoicekit.v1') || 'null'); } catch (e) {}
    if (saved && saved.items) D = saved;
    renderAll();
    syncInputs();
    setType(D.type); setLang(D.lang);
    fitZoom();

    /* in-place editing */
    var sheet = $('sheet');
    sheet.addEventListener('input', function (e) {
      var el = e.target.closest('[data-f]');
      if (!el) return;
      var path = el.dataset.f;
      var v = el.innerText.replace(/\n$/, '');
      if (/\.(qty|rate)$/.test(path)) {
        v = parseFloat(v.replace(/[^0-9.\-]/g, '')) || 0;
      }
      setPath(D, path, v);
      if (path.indexOf('items.') === 0) recompute();
      if (path === 'biz.name' || path === 'cli.name') renderParties();
      scheduleSave();
    });
    sheet.addEventListener('blur', function (e) {
      var el = e.target.closest ? e.target.closest('[data-f]') : null;
      if (!el) return;
      var path = el.dataset.f;
      if (/\.(qty|rate)$/.test(path)) {
        var v = parseFloat(el.innerText.replace(/[^0-9.\-]/g, '')) || 0;
        el.innerText = /\.qty$/.test(path) ? String(v) : fmtNum(v, 2);
        setPath(D, path, v);
        recompute();
        scheduleSave();
      }
    }, true);
    sheet.addEventListener('paste', function (e) {
      if (!e.target.closest('[data-f]')) return;
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text.replace(/\r/g, ''));
    });
    sheet.addEventListener('keydown', function (e) {
      if (!e.target.closest('[data-f]')) return;
      if (e.key === 'Enter' && e.target.classList.contains('desc-cell')) { e.preventDefault(); addLine(); }
    });
    $('rows').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del]');
      if (btn) deleteLine(Number(btn.dataset.del));
    });
    $('addRow').addEventListener('click', addLine);

    /* inspector tabs */
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (x) { x.classList.toggle('is-on', x === t); });
        Array.prototype.forEach.call(document.querySelectorAll('.insp-pane'), function (p) { p.classList.toggle('is-on', p.dataset.pane === t.dataset.tab); });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-type]'), function (b) {
      b.addEventListener('click', function () { setType(b.dataset.type); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) {
      b.addEventListener('click', function () { setLang(b.dataset.lang); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-disc]'), function (b) {
      b.addEventListener('click', function () {
        D.discMode = b.dataset.disc;
        Array.prototype.forEach.call(document.querySelectorAll('[data-disc]'), function (x) { x.classList.toggle('is-on', x === b); });
        recompute(); scheduleSave();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.sw'), function (b) {
      b.addEventListener('click', function () { D.accent = b.dataset.accent; applyAccent(); scheduleSave(); });
    });

    $('currency').addEventListener('change', function (e) { D.currency = e.target.value; recompute(); scheduleSave(); });
    $('issue').addEventListener('change', function (e) { D.issue = e.target.value; renderDates(); scheduleSave(); });
    $('due').addEventListener('change', function (e) { D.due = e.target.value; renderDates(); scheduleSave(); });
    $('tax').addEventListener('input', function (e) { D.tax = parseFloat(e.target.value) || 0; recompute(); scheduleSave(); });
    $('discount').addEventListener('input', function (e) { D.discount = parseFloat(e.target.value) || 0; recompute(); scheduleSave(); });
    $('bizEmail').addEventListener('input', function (e) { D.biz.email = e.target.value; renderParties(); scheduleSave(); });
    $('bizAddr').addEventListener('input', function (e) { D.biz.addr = e.target.value; renderParties(); scheduleSave(); });
    $('cliEmail').addEventListener('input', function (e) { D.cli.email = e.target.value; renderParties(); scheduleSave(); });
    $('cliAddr').addEventListener('input', function (e) { D.cli.addr = e.target.value; renderParties(); scheduleSave(); });

    $('btnPrint').addEventListener('click', function () { window.print(); });
    $('zoomIn').addEventListener('click', function () { setZoom(zoom + 0.1, true); });
    $('zoomOut').addEventListener('click', function () { setZoom(zoom - 0.1, true); });
    $('zoomFit').addEventListener('click', function () { userZoomed = false; fitZoom(); });
    $('btnPalette').addEventListener('click', openPalette);

    /* logo */
    var drop = $('logoDrop');
    drop.addEventListener('click', function () { $('logoInput').click(); });
    $('logoInput').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (f) readLogo(f);
      e.target.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer.files[0];
      if (f && /^image\//.test(f.type)) readLogo(f);
    });
    $('clearLogo').addEventListener('click', function () { snap(); D.logo = ''; renderLogo(); scheduleSave(); toast('Logo removed', { label: 'Undo', run: undo }); });
    $('resetDoc').addEventListener('click', newDoc);

    /* palette */
    $('paletteInput').addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase().trim();
      palFiltered = q ? COMMANDS.filter(function (c) { return c.label.toLowerCase().indexOf(q) >= 0; }) : COMMANDS;
      palIdx = 0; drawPalette();
    });
    $('palette').addEventListener('click', function (e) { if (e.target === $('palette')) closePalette(); });

    /* keys */
    window.addEventListener('keydown', function (e) {
      var meta = e.metaKey || e.ctrlKey;
      var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); $('palette').hidden ? openPalette() : closePalette(); return; }
      if (meta && e.key.toLowerCase() === 'p') { e.preventDefault(); window.print(); return; }
      if (meta && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); undo(); return; }
      if (e.key === 'Escape') { closePalette(); return; }
      if (!$('palette').hidden) {
        if (e.key === 'ArrowDown') { e.preventDefault(); palIdx = Math.min(palIdx + 1, palFiltered.length - 1); drawPalette(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); palIdx = Math.max(palIdx - 1, 0); drawPalette(); }
        if (e.key === 'Enter') { e.preventDefault(); var c = palFiltered[palIdx]; if (c) { closePalette(); c.run(); } }
        return;
      }
      if (typing) return;
      if (e.key === 'a') { e.preventDefault(); addLine(); }
    });

    window.addEventListener('resize', function () { if (!userZoomed) fitZoom(); });
    requestAnimationFrame(function () { fitZoom(); });
    setTimeout(fitZoom, 60);
    window.addEventListener('beforeunload', function () {
      try { localStorage.setItem('invoicekit.v1', JSON.stringify(D)); } catch (e) {}
    });
  }

  function readLogo(file) {
    if (file.size > 900000) { toast('Image is too large, keep it under 900 KB'); return; }
    var r = new FileReader();
    r.onload = function () {
      snap();
      D.logo = r.result;
      renderLogo();
      scheduleSave();
      toast('Logo added', { label: 'Undo', run: undo });
    };
    r.readAsDataURL(file);
  }

  function openPalette() {
    $('palette').hidden = false; $('paletteInput').value = ''; palIdx = 0; palFiltered = COMMANDS; drawPalette();
    setTimeout(function () { $('paletteInput').focus(); }, 20);
  }
  function closePalette() { $('palette').hidden = true; }
  function drawPalette() {
    var list = $('paletteList'); list.innerHTML = '';
    palFiltered.forEach(function (c, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + c.label + '</span>' + (c.hint ? '<span>' + c.hint + '</span>' : '');
      if (i === palIdx) li.className = 'is-on';
      li.onclick = function () { closePalette(); c.run(); };
      list.appendChild(li);
    });
  }

  window.InvoiceKitDebug = { doc: D, totals: totals, num: num, setType: setType, setLang: setLang, addLine: addLine, newDoc: newDoc, renderAll: renderAll, undo: undo };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
