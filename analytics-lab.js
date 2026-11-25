/* ===========================================================
   Analytics Lab — Priyanshu Raj portfolio
   Three interactive data-analytics case studies, vanilla JS + SVG.
   Mounts into <section id="analytics" data-al-root> on the page.
   =========================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     EDIT ME: links shown under each project.
     Leave a value as '' and its button is hidden automatically.
     ---------------------------------------------------------- */
  var LINKS = {
    pbi:   { repo: '', live: '' },   // e.g. 'https://github.com/you/superstore-powerbi', Power BI "Publish to web" link
    churn: { repo: '', live: '' },   // e.g. GitHub repo, Kaggle / Colab notebook link
    ab:    { repo: '', live: '' }    // e.g. GitHub repo, notebook link
  };

  /* ================= utilities ================= */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (k.slice(0, 5) === 'aria-' && v != null) { e.setAttribute(k, String(v)); continue; }
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function s(tag, attrs, kids) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null) continue;
      if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function lin(d0, d1, r0, r1) { var m = (r1 - r0) / ((d1 - d0) || 1); return function (v) { return r0 + (v - d0) * m; }; }
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p, st = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for (var i = 0; i < st.length; i++) if (n <= st[i]) return st[i] * p; return 10 * p; }
  function money(v) { var a = Math.abs(v), sg = v < 0 ? '-' : ''; return sg + (a >= 1e6 ? '$' + (a / 1e6).toFixed(2) + 'M' : a >= 1e3 ? '$' + (a / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'K' : '$' + Math.round(a)); }
  function pct(v, d) { return (v * 100).toFixed(d == null ? 1 : d) + '%'; }
  function num(v) { return Math.round(v).toLocaleString('en-US'); }
  function seeded(seed) { var x = seed; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tween(el, to, fmt) {
    var from = el._v == null ? to : el._v; el._v = to;
    if (reduced || from === to) { el.textContent = fmt(to); return; }
    var t0 = performance.now(), dur = 650;
    cancelAnimationFrame(el._raf);
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) el._raf = requestAnimationFrame(step);
    })(t0);
  }

  // statistics helpers
  function erf(x) { var t = 1 / (1 + 0.3275911 * Math.abs(x)); var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  function ncdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function npdf(x, m, sd) { var z = (x - m) / sd; return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI)); }
  function ninv(p) { // Acklam
    var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
        b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
        c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
        d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416], q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 0.97575) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  /* ================= tooltip ================= */
  var tipEl = null;
  var tip = {
    show: function (html, x, y) {
      if (!tipEl) return;
      tipEl.innerHTML = html; tipEl.classList.add('on');
      var w = tipEl.offsetWidth, hh = tipEl.offsetHeight, vw = window.innerWidth;
      var left = x + 14; if (left + w > vw - 8) left = x - w - 14; if (left < 8) left = 8;
      var top = y - hh - 12; if (top < 8) top = y + 16;
      tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
    },
    hide: function () { if (tipEl) tipEl.classList.remove('on'); }
  };
  function tipRows(title, rows) {
    return '<div class="tt">' + title + '</div>' + rows.map(function (r) {
      return '<div class="tr"><span>' + (r[2] ? '<i style="background:' + r[2] + '"></i>' : '') + r[0] + '</span><b>' + r[1] + '</b></div>';
    }).join('');
  }

  /* hover for mouse, tap/drag for touch (pointer events) */
  function onHover(el, move, leave) {
    el.style.touchAction = 'pan-y';
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', move);
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') leave(e); });
    el.addEventListener('pointercancel', leave);
  }

  /* responsive chart: redraws on container resize */
  var cleanups = [];
  function chart(container, draw) {
    var last = 0;
    function run() { var w = container.clientWidth; if (!w || w === last) return; last = w; container.innerHTML = ''; draw(w); }
    container._redraw = function () { last = 0; run(); };
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { requestAnimationFrame(run); }); ro.observe(container); cleanups.push(function () { ro.disconnect(); }); }
    else { window.addEventListener('resize', run); cleanups.push(function () { window.removeEventListener('resize', run); }); }
    run();
    return container;
  }

  /* ================= code highlighter ================= */
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var LANG = {
    dax: { c: /(\/\/.*$|--.*$)/, s: /("(?:[^"]|"")*")/, k: /\b(VAR|RETURN|TRUE|FALSE|IN|NOT|AND|OR)\b/, f: /\b([A-Z][A-Z0-9.]*)(?=\s*\()/, r: /('[^']+'|[A-Za-z_]+)?\[[^\]]+\]/, n: /\b\d+(\.\d+)?\b/ },
    sql: { c: /(--.*$)/, s: /('(?:[^']|'')*')/, k: /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|WITH|AS|CASE|WHEN|THEN|ELSE|END|AND|OR|ON|JOIN|LEFT JOIN|INNER JOIN|OVER|PARTITION BY|DESC|ASC|NULLIF|BETWEEN|IN|IS|NOT|NULL|DISTINCT|HAVING|LIMIT)\b/i, f: /\b([A-Za-z_]+)(?=\s*\()/, r: null, n: /\b\d+(\.\d+)?\b/ },
    python: { c: /(#.*$)/, s: /("""[\s\S]*?"""|f?"[^"]*"|f?'[^']*')/, k: /\b(import|from|as|def|return|for|in|if|else|elif|with|print|lambda|True|False|None|and|or|not)\b/, f: /\b([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()/, r: null, n: /\b\d+(\.\d+)?\b/ }
  };
  function highlight(code, lang) {
    var L = LANG[lang];
    return code.split('\n').map(function (line) {
      var out = '', rest = line;
      var order = ['c', 's', 'r', 'k', 'f', 'n'];
      while (rest.length) {
        var best = null, bi = Infinity, bt = null;
        order.forEach(function (t) {
          if (!L[t]) return;
          var m = L[t].exec(rest);
          if (m && m.index < bi) { bi = m.index; best = m; bt = t; }
        });
        if (!best) { out += esc(rest); break; }
        var tok = bt === 'f' ? best[1] : best[0];
        out += esc(rest.slice(0, bi)) + '<span class="t-' + bt + '">' + esc(tok) + '</span>';
        rest = rest.slice(bi + tok.length);
      }
      return '<span class="ln">' + (out || ' ') + '</span>';
    }).join('');
  }
  function codeView(files) {
    var cur = 0, wrap = h('div', { class: 'al-code' });
    var list = h('div', { class: 'al-files', role: 'tablist', 'aria-label': 'Source files' });
    var main = h('div', { class: 'al-code-main' });
    function render() {
      list.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-selected', i === cur); });
      var f = files[cur];
      main.innerHTML = '';
      var copy = h('button', { class: 'al-copy', text: 'copy' });
      copy.addEventListener('click', function () {
        try { navigator.clipboard.writeText(f.code); copy.textContent = 'copied ✓'; setTimeout(function () { copy.textContent = 'copy'; }, 1400); } catch (e) {}
      });
      main.appendChild(h('div', { class: 'al-code-note', style: 'display:flex;gap:12px;align-items:flex-start' }, [h('div', { html: '<b>Why</b>' + f.note }), copy]));
      main.appendChild(h('pre', { class: 'al-pre', html: highlight(f.code, f.lang) }));
    }
    files.forEach(function (f, i) {
      list.appendChild(h('button', { role: 'tab', onclick: function () { cur = i; render(); } }, [h('span', { class: 'fn', text: f.name }), h('span', { class: 'fd', text: f.desc })]));
    });
    wrap.appendChild(list); wrap.appendChild(main); render();
    return wrap;
  }

  function kpiCard(label, extraClass) {
    var v = h('div', { class: 'al-kpi-v', text: '—' }), d = h('div', { class: 'al-kpi-d', text: '' });
    var spark = h('div');
    var el = h('div', { class: 'al-kpi' + (extraClass ? ' ' + extraClass : '') }, [h('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start;gap:8px' }, [h('div', { class: 'al-kpi-l', text: label }), spark]), v, d]);
    return { el: el, v: v, d: d, spark: spark };
  }
  function sparkline(container, vals, color) {
    container.innerHTML = '';
    var w = 62, hh = 24, mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    var x = lin(0, vals.length - 1, 0, w), y = lin(mn, mx, hh - 2, 2);
    var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
    container.appendChild(s('svg', { width: w, height: hh, viewBox: '0 0 ' + w + ' ' + hh }, [s('path', { d: d, fill: 'none', stroke: color, 'stroke-width': 1.5 })]));
  }

  /* ===========================================================
     PROJECT 1 — POWER BI · Superstore sales & profitability
     =========================================================== */
  var PBI = (function () {
    var regions = ['West', 'East', 'Central', 'South'];
    var regSales = { West: 725458, East: 678781, Central: 501240, South: 391722 };
    var regMargin = { West: 0.1494, East: 0.1348, Central: 0.0792, South: 0.1193 };
    var cats = ['Technology', 'Furniture', 'Office Supplies'];
    var catShare = { Technology: 0.364, Furniture: 0.323, 'Office Supplies': 0.313 };
    var catMargin = { Technology: 0.174, Furniture: 0.0249, 'Office Supplies': 0.1704 };
    var catColor = { Technology: 'var(--orange)', Furniture: 'var(--violet)', 'Office Supplies': 'var(--gold)' };
    var years = [2014, 2015, 2016, 2017], yrShare = [0.2108, 0.2048, 0.2652, 0.3192];
    var season = [0.45, 0.35, 0.85, 0.7, 0.75, 0.75, 0.75, 0.65, 1.35, 0.9, 1.4, 1.4];
    var sSum = season.reduce(function (a, b) { return a + b; }, 0); season = season.map(function (v) { return v / sSum; });
    var rnd = seeded(42), rows = [];
    regions.forEach(function (r) { cats.forEach(function (c) { years.forEach(function (y, yi) { season.forEach(function (sm, m) {
      var sales = regSales[r] * catShare[c] * yrShare[yi] * sm * (1 + (rnd() - 0.5) * 0.36);
      var profit = sales * catMargin[c] * (regMargin[r] / 0.1247) * (1 + (rnd() - 0.5) * 0.5);
      rows.push({ r: r, c: c, y: y, m: m, sales: sales, profit: profit, orders: sales / 458.6 * (1 + (rnd() - 0.5) * 0.2) });
    }); }); }); });
    // sub-category profit (Sample Superstore totals)
    var subs = [
      ['Copiers', 'Technology', 55618, 149528], ['Phones', 'Technology', 44516, 330007], ['Accessories', 'Technology', 41937, 167380], ['Machines', 'Technology', 3385, 189239],
      ['Paper', 'Office Supplies', 34054, 78479], ['Binders', 'Office Supplies', 30222, 203413], ['Storage', 'Office Supplies', 21279, 223844], ['Appliances', 'Office Supplies', 18138, 107532],
      ['Envelopes', 'Office Supplies', 6964, 16476], ['Art', 'Office Supplies', 6528, 27119], ['Labels', 'Office Supplies', 5546, 12486], ['Fasteners', 'Office Supplies', 950, 3024], ['Supplies', 'Office Supplies', -1189, 46674],
      ['Chairs', 'Furniture', 26590, 328449], ['Furnishings', 'Furniture', 13059, 91705], ['Bookcases', 'Furniture', -3473, 114880], ['Tables', 'Furniture', -17725, 206966]
    ].map(function (a) { return { n: a[0], c: a[1], profit: a[2], sales: a[3] }; });
    return { regions: regions, cats: cats, catColor: catColor, years: years, rows: rows, subs: subs };
  })();

  function buildPBI() {
    var st = { region: null, year: null, cat: null };
    var root = h('div');
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function filt(o) {
      o = o || {};
      var r = 'region' in o ? o.region : st.region, y = 'year' in o ? o.year : st.year, c = 'cat' in o ? o.cat : st.cat;
      return PBI.rows.filter(function (x) { return (!r || x.r === r) && (!y || x.y === y) && (!c || x.c === c); });
    }
    function sum(rs, k) { var t = 0; for (var i = 0; i < rs.length; i++) t += rs[i][k]; return t; }

    // slicers
    var slicers = h('div', { class: 'al-slicers' });
    function chipGroup(label, opts, key) {
      var g = h('div', { class: 'al-slicer' }, [h('span', { text: label })]);
      [null].concat(opts).forEach(function (o) {
        var b = h('button', { class: 'al-chip', text: o == null ? 'All' : String(o), 'aria-pressed': 'false' });
        b.addEventListener('click', function () { st[key] = o; update(); });
        b._val = o; b._key = key; g.appendChild(b);
      });
      return g;
    }
    slicers.appendChild(chipGroup('Region', PBI.regions, 'region'));
    slicers.appendChild(chipGroup('Year', PBI.years, 'year'));
    var catTag = h('button', { class: 'al-clear', style: 'display:none' });
    catTag.addEventListener('click', function () { st.cat = null; update(); });
    slicers.appendChild(catTag);
    root.appendChild(slicers);

    var k1 = kpiCard('Total sales', 'hot'), k2 = kpiCard('Total profit'), k3 = kpiCard('Profit margin'), k4 = kpiCard('Orders');
    root.appendChild(h('div', { class: 'al-kpis' }, [k1.el, k2.el, k3.el, k4.el]));

    // trend card
    var trendBox = h('div', { class: 'al-chart' });
    var trendSub = h('span', { class: 'al-card-s' });
    var trendCard = h('div', { class: 'al-card' }, [
      h('div', { class: 'al-card-h' }, [h('div', {}, [h('div', { class: 'al-card-t', text: 'Sales & profit trend' }), trendSub]),
        h('div', { class: 'al-legend', html: '<span><i style="background:var(--orange)"></i>Sales</span><span><i style="background:var(--green)"></i>Profit</span>' })]),
      trendBox]);
    var catBox = h('div', { class: 'al-chart' });
    var catCard = h('div', { class: 'al-card' }, [
      h('div', { class: 'al-card-h' }, [h('div', { class: 'al-card-t', text: 'Sales by category' }), h('span', { class: 'al-card-s', text: 'click to cross-filter' })]), catBox]);
    root.appendChild(h('div', { class: 'al-grid' }, [trendCard, catCard]));

    var subBox = h('div', { class: 'al-chart' });
    var subCard = h('div', { class: 'al-card' }, [
      h('div', { class: 'al-card-h' }, [h('div', { class: 'al-card-t', text: 'Profit by sub-category' }), h('span', { class: 'al-card-s', text: 'loss-makers in red' })]), subBox]);
    var insight = h('div', { class: 'al-insight' });
    root.appendChild(h('div', { class: 'al-grid' }, [subCard, insight]));

    var data = {};
    function drawTrend(w) {
      var pts = data.trend, H = 230, ml = 46, mr = 10, mt = 10, mb = 26;
      var mx = niceMax(Math.max.apply(null, pts.map(function (p) { return p.sales; })));
      var mnP = Math.min(0, Math.min.apply(null, pts.map(function (p) { return p.profit; })));
      var x = lin(0, pts.length - 1, ml, w - mr), y = lin(mnP, mx, H - mb, mt);
      var g = s('svg', { width: w, height: H });
      for (var i = 0; i <= 4; i++) { var v = mnP + (mx - mnP) * i / 4, yy = y(v); g.appendChild(s('line', { x1: ml, x2: w - mr, y1: yy, y2: yy, class: 'al-grid-l' })); g.appendChild(s('text', { x: ml - 8, y: yy + 3, 'text-anchor': 'end', class: 'al-ax', text: money(v) })); }
      var step = pts.length > 24 ? 6 : pts.length > 12 ? 3 : 1;
      if (w < 480) step *= 2;
      pts.forEach(function (p, i) { if (i % step === 0) g.appendChild(s('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'al-ax', text: p.label })); });
      var line = function (k) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[k]).toFixed(1); }).join(''); };
      var gradId = 'alg' + Math.floor(Math.random() * 1e6);
      g.appendChild(s('defs', {}, [s('linearGradient', { id: gradId, x1: 0, x2: 0, y1: 0, y2: 1 }, [s('stop', { offset: '0%', 'stop-color': 'var(--orange)', 'stop-opacity': 0.32 }), s('stop', { offset: '100%', 'stop-color': 'var(--orange)', 'stop-opacity': 0 })])]));
      var area = s('path', { d: line('sales') + 'L' + x(pts.length - 1) + ' ' + y(mnP) + 'L' + x(0) + ' ' + y(mnP) + 'Z', fill: 'url(#' + gradId + ')' });
      var sl = s('path', { d: line('sales'), fill: 'none', stroke: 'var(--orange)', 'stroke-width': 2 });
      var pl = s('path', { d: line('profit'), fill: 'none', stroke: 'var(--green)', 'stroke-width': 1.6 });
      g.appendChild(area); g.appendChild(sl); g.appendChild(pl);
      if (!reduced) { var len = sl.getTotalLength ? 2000 : 0; [sl, pl].forEach(function (p) { p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 1s cubic-bezier(.22,.7,.3,1)'; requestAnimationFrame(function () { p.style.strokeDashoffset = 0; }); }); }
      var cross = s('line', { y1: mt, y2: H - mb, stroke: 'var(--ink-3)', 'stroke-dasharray': '3 4', opacity: 0 });
      var dot1 = s('circle', { r: 4, fill: 'var(--orange)', opacity: 0 }), dot2 = s('circle', { r: 3.5, fill: 'var(--green)', opacity: 0 });
      g.appendChild(cross); g.appendChild(dot1); g.appendChild(dot2);
      var hit = s('rect', { x: ml, y: mt, width: w - ml - mr, height: H - mt - mb, fill: 'transparent' });
      function move(e) {
        var r = g.getBoundingClientRect(), px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        var i = Math.max(0, Math.min(pts.length - 1, Math.round((px - ml) / ((w - ml - mr) / (pts.length - 1 || 1)))));
        var p = pts[i], xx = x(i);
        cross.setAttribute('x1', xx); cross.setAttribute('x2', xx); cross.setAttribute('opacity', 1);
        dot1.setAttribute('cx', xx); dot1.setAttribute('cy', y(p.sales)); dot1.setAttribute('opacity', 1);
        dot2.setAttribute('cx', xx); dot2.setAttribute('cy', y(p.profit)); dot2.setAttribute('opacity', 1);
        tip.show(tipRows(p.full, [['Sales', money(p.sales), 'var(--orange)'], ['Profit', money(p.profit), 'var(--green)'], ['Margin', pct(p.profit / p.sales)]]), e.touches ? e.touches[0].clientX : e.clientX, e.touches ? e.touches[0].clientY : e.clientY);
      }
      function leave() { cross.setAttribute('opacity', 0); dot1.setAttribute('opacity', 0); dot2.setAttribute('opacity', 0); tip.hide(); }
      onHover(hit, move, leave);
      g.appendChild(hit);
      trendBox.appendChild(g);
    }
    function drawCats(w) {
      var cs = data.cats, H = 230, rowH = 64, mx = niceMax(Math.max.apply(null, cs.map(function (c) { return c.sales; })));
      var g = s('svg', { width: w, height: H });
      var x = lin(0, mx, 0, w - 4);
      cs.forEach(function (c, i) {
        var y0 = 12 + i * (rowH + 8), on = !st.cat || st.cat === c.c;
        var grp = s('g', { class: 'al-bar-hit', style: 'opacity:' + (on ? 1 : 0.3) + ';transition:opacity .3s', tabindex: 0, role: 'button', 'aria-label': 'Filter by ' + c.c });
        grp.appendChild(s('text', { x: 0, y: y0 + 10, style: 'font-size:12.5px;font-weight:600;fill:var(--ink)', text: c.c }));
        grp.appendChild(s('text', { x: w - 4, y: y0 + 10, 'text-anchor': 'end', class: 'al-ax', style: 'fill:var(--ink-2)', text: money(c.sales) }));
        grp.appendChild(s('rect', { x: 0, y: y0 + 20, width: w - 4, height: 16, fill: 'var(--bg-3)' }));
        var bar = s('rect', { x: 0, y: y0 + 20, width: reduced ? x(c.sales) : 0, height: 16, fill: PBI.catColor[c.c], style: 'transition:width .7s cubic-bezier(.22,.7,.3,1)' });
        grp.appendChild(bar);
        var mcol = c.profit / c.sales < 0.05 ? '#ef5a4c' : 'var(--green)';
        grp.appendChild(s('text', { x: 0, y: y0 + 52, class: 'al-ax', html: '', text: 'margin ' + pct(c.profit / c.sales) + ' · profit ' + money(c.profit), style: 'fill:' + mcol }));
        grp.appendChild(s('rect', { x: 0, y: y0, width: w, height: rowH, fill: 'transparent' }));
        var act = function () { st.cat = st.cat === c.c ? null : c.c; update(); };
        grp.addEventListener('click', act);
        grp.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
        g.appendChild(grp);
        if (!reduced) requestAnimationFrame(function () { requestAnimationFrame(function () { bar.setAttribute('width', x(c.sales)); }); });
      });
      catBox.appendChild(g);
    }
    function drawSubs(w) {
      var list = data.subs, rowH = 22, H = list.length * rowH + 8;
      var mx = Math.max.apply(null, list.map(function (d) { return Math.abs(d.p); }));
      var small = w < 420, labW = small ? 80 : Math.min(110, w * 0.28), mid = labW + (w - labW) * (Math.min.apply(null, list.map(function (d) { return d.p; })) < 0 ? 0.3 : 0.02);
      var xr = lin(0, mx, 0, w - mid - 56);
      var xl = lin(0, mx, 0, Math.max(10, mid - labW - 8));
      var g = s('svg', { width: w, height: H });
      g.appendChild(s('line', { x1: mid, x2: mid, y1: 0, y2: H, stroke: 'var(--line-2)' }));
      list.forEach(function (d, i) {
        var y = 4 + i * rowH, neg = d.p < 0, bw = neg ? Math.min(xl(-d.p), mid - labW - 4) : xr(d.p);
        var grp = s('g');
        grp.appendChild(s('text', { x: 0, y: y + 13, style: 'font-size:' + (small ? 11 : 12) + 'px;fill:var(--ink-2)', text: d.n }));
        grp.appendChild(s('rect', { x: neg ? mid - bw : mid, y: y + 3, width: Math.max(1, bw), height: 13, fill: neg ? '#ef5a4c' : PBI.catColor[d.c], opacity: 0.9 }));
        grp.appendChild(s('text', { x: neg ? mid + 6 : mid + bw + 6, y: y + 13, class: 'al-ax', style: 'fill:' + (neg ? '#ef5a4c' : 'var(--ink-2)'), text: money(d.p) }));
        var hr = s('rect', { x: 0, y: y, width: w, height: rowH, fill: 'transparent' });
        onHover(hr, function (e) { tip.show(tipRows(d.n + ' · ' + d.c, [['Profit', money(d.p)], ['Sales', money(d.s)], ['Margin', pct(d.p / d.s)]]), e.clientX, e.clientY); }, tip.hide);
        grp.appendChild(hr);
        g.appendChild(grp);
      });
      subBox.appendChild(g);
    }

    function update() {
      slicers.querySelectorAll('.al-chip').forEach(function (b) { b.setAttribute('aria-pressed', st[b._key] === b._val); });
      catTag.style.display = st.cat ? '' : 'none'; catTag.textContent = st.cat ? '× category: ' + st.cat : '';
      var rs = filt(), sales = sum(rs, 'sales'), profit = sum(rs, 'profit'), orders = sum(rs, 'orders');
      // comparison period
      var cmpYear = st.year ? (st.year > 2014 ? st.year - 1 : null) : null;
      var curRs = st.year ? rs : filt({ year: 2017 }), prevRs = st.year ? (cmpYear ? filt({ year: cmpYear }) : null) : filt({ year: 2016 });
      function delta(el, k, isRatio) {
        if (!prevRs) { el.className = 'al-kpi-d'; el.textContent = 'first year in data'; return; }
        var a, b;
        if (isRatio) { a = sum(curRs, 'profit') / sum(curRs, 'sales'); b = sum(prevRs, 'profit') / sum(prevRs, 'sales'); var dd = (a - b) * 100; el.className = 'al-kpi-d ' + (dd >= 0 ? 'up' : 'down'); el.textContent = (dd >= 0 ? '▲ ' : '▼ ') + Math.abs(dd).toFixed(1) + ' pts ' + (st.year ? 'vs ' + cmpYear : 'YoY 2017'); return; }
        a = sum(curRs, k); b = sum(prevRs, k); var d = (a - b) / b;
        el.className = 'al-kpi-d ' + (d >= 0 ? 'up' : 'down'); el.textContent = (d >= 0 ? '▲ ' : '▼ ') + pct(Math.abs(d)) + ' ' + (st.year ? 'vs ' + cmpYear : 'YoY 2017');
      }
      tween(k1.v, sales, money); delta(k1.d, 'sales');
      tween(k2.v, profit, money); delta(k2.d, 'profit');
      tween(k3.v, profit / sales, function (v) { return pct(v); }); delta(k3.d, null, true);
      tween(k4.v, orders, num); delta(k4.d, 'orders');
      // trend
      var keys = {}, trend = [];
      rs.forEach(function (x) { var k = x.y * 12 + x.m; if (!keys[k]) { keys[k] = { k: k, sales: 0, profit: 0, y: x.y, m: x.m }; } keys[k].sales += x.sales; keys[k].profit += x.profit; });
      Object.keys(keys).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) { var o = keys[k]; trend.push({ sales: o.sales, profit: o.profit, label: st.year ? MONTHS[o.m] : (o.m === 0 ? String(o.y) : MONTHS[o.m]), full: MONTHS[o.m] + ' ' + o.y }); });
      if (!st.year) trend.forEach(function (p, i) { p.label = i % 12 === 0 ? p.full.slice(4) : p.full.slice(0, 3); });
      data.trend = trend;
      trendSub.textContent = (st.year ? 'monthly · ' + st.year : 'monthly · 2014 – 2017') + (st.region ? ' · ' + st.region : '') + (st.cat ? ' · ' + st.cat : '');
      sparkline(k1.spark, trend.map(function (p) { return p.sales; }), 'var(--orange)');
      sparkline(k2.spark, trend.map(function (p) { return p.profit; }), 'var(--green)');
      sparkline(k3.spark, trend.map(function (p) { return p.profit / p.sales; }), 'var(--ink-3)');
      sparkline(k4.spark, trend.map(function (p) { return p.sales; }), 'var(--ink-3)');
      // categories (ignore own cat filter so all bars stay visible)
      var crs = filt({ cat: null });
      data.cats = PBI.cats.map(function (c) { var r = crs.filter(function (x) { return x.c === c; }); return { c: c, sales: sum(r, 'sales'), profit: sum(r, 'profit') }; });
      // sub-categories scaled to the filter
      var totalAll = sum(PBI.rows, 'sales'), share = sum(filt({ cat: null }), 'sales') / totalAll;
      var subs = PBI.subs.filter(function (d) { return !st.cat || d.c === st.cat; }).map(function (d) { return { n: d.n, c: d.c, p: d.profit * share, s: d.sales * share }; });
      subs.sort(function (a, b) { return b.p - a.p; });
      if (!st.cat) subs = subs.slice(0, 6).concat(subs.filter(function (d) { return d.p < 0; }));
      data.subs = subs;
      // insight
      var tables = PBI.subs.filter(function (d) { return d.n === 'Tables'; })[0];
      var reg = st.region || 'all regions';
      var furn = data.cats.filter(function (c) { return c.c === 'Furniture'; })[0];
      insight.innerHTML = '<div class="k">Key insight</div><div class="big">' + money(tables.profit * share) + '</div>' +
        '<p><strong style="color:var(--ink)">Tables lose money</strong> in ' + reg + (st.year ? ' (' + st.year + ')' : '') + '. Discounts above 20% push the line negative, dragging Furniture to a <strong style="color:var(--ink)">' + pct(furn.profit / furn.sales) + '</strong> margin while it brings in ' + money(furn.sales) + ' of sales.</p>' +
        '<p>Recommendation: cap Furniture discounts at 20% and bundle Tables with Chairs — worth an estimated <strong style="color:var(--green)">+' + money(Math.abs(tables.profit * share) * 1.4) + '</strong> profit/yr.</p>';
      [trendBox, catBox, subBox].forEach(function (b) { b._redraw && b._redraw(); });
    }
    update();
    chart(trendBox, drawTrend); chart(catBox, drawCats); chart(subBox, drawSubs);
    return root;
  }

  function buildPBIModel() {
    var wrap = h('div', { class: 'al-model' });
    var W = 900, H = 440;
    var tables = [
      { id: 'fact', name: 'Fact_Sales', x: 350, y: 140, fields: ['Order ID', 'Order Date →', 'Product ID →', 'Customer ID →', 'Postal Code →', 'Sales', 'Quantity', 'Discount', 'Profit'], fact: true },
      { id: 'date', name: 'Dim_Date', x: 40, y: 40, fields: ['Date (PK)', 'Year', 'Quarter', 'Month', 'Is Weekend'] },
      { id: 'prod', name: 'Dim_Product', x: 660, y: 40, fields: ['Product ID (PK)', 'Product Name', 'Sub-Category', 'Category'] },
      { id: 'cust', name: 'Dim_Customer', x: 40, y: 270, fields: ['Customer ID (PK)', 'Customer Name', 'Segment'] },
      { id: 'geo', name: 'Dim_Geography', x: 660, y: 270, fields: ['Postal Code (PK)', 'City', 'State', 'Region'] }
    ];
    var g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Star schema data model' });
    var tw = 200, rh = 20;
    var rels = [], groups = {};
    function anchor(t) { return { x: t.x + tw / 2, y: t.y + 16 + t.fields.length * rh / 2 }; }
    var fact = tables[0];
    tables.slice(1).forEach(function (t) {
      var a = anchor(t), b = anchor(fact);
      var bx = t.x < fact.x ? fact.x : fact.x + tw, ax = t.x < fact.x ? t.x + tw : t.x;
      var mid = (ax + bx) / 2;
      var p = s('path', { class: 'al-rel', d: 'M' + ax + ' ' + a.y + ' H' + mid + ' V' + b.y + ' H' + bx, fill: 'none', stroke: 'var(--grid-2)', 'stroke-width': 1.5 });
      var l1 = s('text', { x: ax + (t.x < fact.x ? 6 : -14), y: a.y - 6, class: 'al-ax', text: '1' });
      var l2 = s('text', { x: bx + (t.x < fact.x ? -12 : 6), y: b.y - 6, class: 'al-ax', text: '*' });
      rels.push({ id: t.id, p: p, l: [l1, l2] }); g.appendChild(p); g.appendChild(l1); g.appendChild(l2);
    });
    tables.forEach(function (t) {
      var th = 30 + t.fields.length * rh;
      var grp = s('g', { class: 'al-tbl', style: 'cursor:pointer' });
      grp.appendChild(s('rect', { x: t.x, y: t.y, width: tw, height: th, fill: 'var(--bg-1)', stroke: t.fact ? 'var(--orange)' : 'var(--line-2)' }));
      var hd = s('rect', { class: 'h', x: t.x, y: t.y, width: tw, height: 26, fill: t.fact ? 'var(--orange)' : 'var(--bg-3)' });
      grp.appendChild(hd);
      grp.appendChild(s('text', { x: t.x + 10, y: t.y + 17, style: 'font-family:Geist Mono,monospace;font-size:12px;font-weight:600;fill:' + (t.fact ? '#fff' : 'var(--ink)'), text: t.name }));
      t.fields.forEach(function (f, i) {
        var key = /PK|→/.test(f);
        grp.appendChild(s('text', { x: t.x + 12, y: t.y + 44 + i * rh, style: 'font-family:Geist Mono,monospace;font-size:11px;fill:' + (key ? 'var(--orange)' : 'var(--ink-2)'), text: f }));
      });
      grp.addEventListener('mouseenter', function () {
        rels.forEach(function (r) { var on = t.fact || r.id === t.id; r.p.setAttribute('stroke', on ? 'var(--orange)' : 'var(--grid-2)'); r.p.style.opacity = on ? 1 : 0.25; r.p.setAttribute('stroke-dasharray', on ? '4 5' : ''); r.p.style.animation = on && !reduced ? 'prDash 1.1s linear infinite' : ''; });
        if (!t.fact) hd.setAttribute('fill', 'var(--orange-dim)');
      });
      grp.addEventListener('mouseleave', function () {
        rels.forEach(function (r) { r.p.setAttribute('stroke', 'var(--grid-2)'); r.p.style.opacity = 1; r.p.setAttribute('stroke-dasharray', ''); r.p.style.animation = ''; });
        if (!t.fact) hd.setAttribute('fill', 'var(--bg-3)');
      });
      groups[t.id] = grp; g.appendChild(grp);
    });
    g.appendChild(s('text', { x: W / 2, y: H - 12, 'text-anchor': 'middle', class: 'al-ax', text: 'star schema · one-to-many relationships · single-direction filtering · hover a table to trace its relationship' }));
    wrap.appendChild(g);
    return h('div', {}, [h('div', { class: 'al-swipe', text: 'swipe sideways to see the full model →' }), wrap]);
  }

  var PBI_CODE = [
    { name: 'Core measures.dax', desc: 'Sales, profit, margin', lang: 'dax', note: 'Explicit measures instead of implicit sums, so every visual uses one governed definition and DIVIDE handles divide-by-zero.',
      code: '// ---------- Core measures ----------\nTotal Sales = SUM ( Fact_Sales[Sales] )\n\nTotal Profit = SUM ( Fact_Sales[Profit] )\n\nProfit Margin % =\n    DIVIDE ( [Total Profit], [Total Sales] )\n\nOrders =\n    DISTINCTCOUNT ( Fact_Sales[Order ID] )\n\nAvg Order Value =\n    DIVIDE ( [Total Sales], [Orders] )' },
    { name: 'Time intelligence.dax', desc: 'YoY, YTD, rolling', lang: 'dax', note: 'Time-intelligence over a marked date table, which drives the YoY deltas on every KPI card.',
      code: 'Sales LY =\n    CALCULATE ( [Total Sales], SAMEPERIODLASTYEAR ( Dim_Date[Date] ) )\n\nSales YoY % =\n    VAR _cur = [Total Sales]\n    VAR _ly  = [Sales LY]\n    RETURN DIVIDE ( _cur - _ly, _ly )\n\nSales YTD =\n    TOTALYTD ( [Total Sales], Dim_Date[Date] )\n\nSales Rolling 3M =\n    CALCULATE (\n        [Total Sales],\n        DATESINPERIOD ( Dim_Date[Date], MAX ( Dim_Date[Date] ), -3, MONTH )\n    )' },
    { name: 'Discount leakage.dax', desc: 'Where margin goes', lang: 'dax', note: 'Calculates the profit lost to deep discounts. This measure surfaced the Tables problem.',
      code: '// Profit lost on order lines discounted above 20%\nDeep Discount Loss =\n    CALCULATE (\n        [Total Profit],\n        Fact_Sales[Discount] > 0.2,\n        Fact_Sales[Profit] < 0\n    )\n\nLoss-Making Lines =\n    CALCULATE (\n        COUNTROWS ( Fact_Sales ),\n        Fact_Sales[Profit] < 0\n    )\n\n// Dynamic title for the report header\nReport Title =\n    "Performance · "\n        & SELECTEDVALUE ( Dim_Geography[Region], "All regions" )' },
    { name: 'Power Query (M)', desc: 'Cleaning & shaping', lang: 'sql', note: 'Power Query steps that clean the raw CSV and split it into the star schema. Shown here in SQL form for readability.',
      code: '-- Equivalent of the Power Query transformations\nSELECT\n    "Order ID"                         AS order_id,\n    CAST("Order Date" AS DATE)         AS order_date,\n    "Product ID"                       AS product_id,\n    "Customer ID"                      AS customer_id,\n    "Postal Code"                      AS postal_code,\n    ROUND(Sales, 2)                    AS sales,\n    Quantity                           AS quantity,\n    Discount                           AS discount,\n    ROUND(Profit, 2)                   AS profit\nFROM raw_superstore\nWHERE Sales > 0;   -- removes 0 bad rows, validates load' }
  ];

  /* ===========================================================
     PROJECT 2 — SQL + PYTHON · Telco customer churn
     =========================================================== */
  var CHURN = {
    total: 7043, churned: 1869, mrrLost: 139131,
    dims: {
      'Contract': [['Month-to-month', 3875, 0.427], ['One year', 1473, 0.113], ['Two year', 1695, 0.028]],
      'Internet': [['Fiber optic', 3096, 0.419], ['DSL', 2421, 0.190], ['No internet', 1526, 0.074]],
      'Payment': [['Electronic check', 2365, 0.453], ['Mailed check', 1612, 0.191], ['Bank transfer', 1544, 0.167], ['Credit card', 1522, 0.152]],
      'Tenure': [['0–12 mo', 2186, 0.474], ['13–24 mo', 1024, 0.287], ['25–48 mo', 1594, 0.204], ['49–60 mo', 832, 0.144], ['61–72 mo', 1407, 0.066]]
    },
    surv: [ // Weibull fit per contract type
      { n: 'Month-to-month', lam: 48, k: 0.75, c: 'var(--orange)' },
      { n: 'One year', lam: 260, k: 0.9, c: 'var(--gold)' },
      { n: 'Two year', lam: 1500, k: 1.1, c: 'var(--green)' }
    ],
    coef: { b0: -0.295, contract: { 'Month-to-month': 0, 'One year': -1.0, 'Two year': -2.0 }, internet: { 'DSL': 0, 'Fiber optic': 0.8, 'No internet': -0.8 },
      payment: { 'Electronic check': 0.45, 'Mailed check': 0, 'Bank transfer': -0.05, 'Credit card': -0.1 }, tenure: -0.035, support: -0.4, charges: 0.006 }
  };

  function buildChurn() {
    var root = h('div');
    var k1 = kpiCard('Customers'), k2 = kpiCard('Churn rate', 'hot'), k3 = kpiCard('Monthly revenue lost'), k4 = kpiCard('Model ROC-AUC');
    root.appendChild(h('div', { class: 'al-kpis' }, [k1.el, k2.el, k3.el, k4.el]));
    tween(k1.v, CHURN.total, num); k1.d.textContent = '21 features · 1 row per customer';
    tween(k2.v, CHURN.churned / CHURN.total, function (v) { return pct(v); }); k2.d.className = 'al-kpi-d down'; k2.d.textContent = num(CHURN.churned) + ' customers left';
    tween(k3.v, CHURN.mrrLost, money); k3.d.className = 'al-kpi-d down'; k3.d.textContent = '≈ ' + money(CHURN.mrrLost * 12) + ' / year';
    tween(k4.v, 0.84, function (v) { return v.toFixed(2); }); k4.d.className = 'al-kpi-d up'; k4.d.textContent = 'logistic regression · test set';
    sparkline(k2.spark, CHURN.dims.Tenure.map(function (d) { return d[2]; }), 'var(--orange)');

    // driver explorer
    var dim = 'Contract';
    var seg = h('div', { class: 'al-seg', role: 'group', 'aria-label': 'Churn driver dimension' });
    var drvBox = h('div', { class: 'al-chart' });
    var drvNote = h('p', { style: 'font-size:12.5px;color:var(--ink-2);margin-top:10px;line-height:1.55' });
    Object.keys(CHURN.dims).forEach(function (d) {
      var b = h('button', { text: d, 'aria-pressed': d === dim });
      b.addEventListener('click', function () { dim = d; seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); drvBox._redraw(); note(); });
      seg.appendChild(b);
    });
    var NOTES = {
      Contract: 'Month-to-month customers churn at <b style="color:var(--ink)">15×</b> the rate of two-year contracts. Contract length is the biggest single driver.',
      Internet: 'Fiber-optic users churn at 42% despite paying the most, which points to a price-to-value problem rather than a coverage one.',
      Payment: 'Electronic-check payers churn at 3× the rate of auto-pay customers. Moving them to auto-pay is a cheap win.',
      Tenure: 'Churn is front-loaded: almost half of first-year customers leave. The first 90 days are where retention is won.'
    };
    function note() { drvNote.innerHTML = NOTES[dim]; }
    note();
    chart(drvBox, function (w) {
      var rows = CHURN.dims[dim], rowH = 46, H = rows.length * rowH + 22;
      var avg = CHURN.churned / CHURN.total;
      var labW = Math.min(130, w * 0.34), x = lin(0, 0.5, labW, w - 50);
      var g = s('svg', { width: w, height: H });
      rows.forEach(function (r, i) {
        var y = 6 + i * rowH, hot = r[2] > avg;
        g.appendChild(s('text', { x: 0, y: y + 15, style: 'font-size:12.5px;fill:var(--ink);font-weight:500', text: r[0] }));
        g.appendChild(s('text', { x: 0, y: y + 31, class: 'al-ax', text: num(r[1]) + ' cust.' }));
        g.appendChild(s('rect', { x: labW, y: y + 8, width: w - 50 - labW, height: 18, fill: 'var(--bg-3)' }));
        var bar = s('rect', { x: labW, y: y + 8, width: reduced ? x(r[2]) - labW : 0, height: 18, fill: hot ? 'var(--orange)' : 'var(--ink-3)', style: 'transition:width .7s cubic-bezier(.22,.7,.3,1) ' + (i * 60) + 'ms' });
        g.appendChild(bar);
        g.appendChild(s('text', { x: w - 44, y: y + 21, class: 'al-ax', style: 'fill:' + (hot ? 'var(--orange)' : 'var(--ink-2)') + ';font-size:11.5px;font-weight:600', text: pct(r[2]) }));
        var hit = s('rect', { x: 0, y: y, width: w, height: rowH, fill: 'transparent' });
        onHover(hit, function (e) { tip.show(tipRows(dim + ' · ' + r[0], [['Churn rate', pct(r[2])], ['Customers', num(r[1])], ['Churned', num(r[1] * r[2])], ['vs average', (r[2] / avg).toFixed(2) + '×']]), e.clientX, e.clientY); }, tip.hide);
        g.appendChild(hit);
        if (!reduced) requestAnimationFrame(function () { requestAnimationFrame(function () { bar.setAttribute('width', x(r[2]) - labW); }); });
      });
      var ax = x(avg);
      g.appendChild(s('line', { x1: ax, x2: ax, y1: 0, y2: H - 16, stroke: 'var(--ink)', 'stroke-dasharray': '2 3', opacity: 0.6 }));
      g.appendChild(s('text', { x: ax, y: H - 3, 'text-anchor': 'middle', class: 'al-ax', text: 'avg ' + pct(avg) }));
      drvBox.appendChild(g);
    });
    var drvCard = h('div', { class: 'al-card' }, [h('div', { class: 'al-card-h' }, [h('div', { class: 'al-card-t', text: 'Churn drivers' }), seg]), drvBox, drvNote]);

    // risk scorer
    var inp = { contract: 'Month-to-month', internet: 'Fiber optic', payment: 'Electronic check', tenure: 4, charges: 85, support: false };
    function select(label, key, opts) {
      var segc = h('div', { class: 'al-seg', style: 'display:flex;flex-wrap:wrap' });
      opts.forEach(function (o) {
        var b = h('button', { text: o.replace('Month-to-month', 'Monthly').replace(' transfer', '').replace(' check', ' chk').replace('No internet', 'None').replace('Fiber optic', 'Fiber').replace('Credit card', 'Card'), 'aria-pressed': inp[key] === o, title: o });
        b.addEventListener('click', function () { inp[key] = o; segc.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); score(); });
        segc.appendChild(b);
      });
      return h('div', { class: 'al-field' }, [h('div', { class: 'lbl', text: label }), segc]);
    }
    function range(label, key, min, max, unit) {
      var val = h('b', { text: inp[key] + unit });
      var r = h('input', { type: 'range', class: 'al-range', min: min, max: max, value: inp[key], 'aria-label': label });
      function paint() { r.style.setProperty('--p', ((r.value - min) / (max - min) * 100) + '%'); }
      r.addEventListener('input', function () { inp[key] = +r.value; val.textContent = r.value + unit; paint(); score(); });
      paint();
      return h('div', { class: 'al-field' }, [h('label', {}, [document.createTextNode(label), val]), r]);
    }
    var supT = h('input', { type: 'checkbox' });
    supT.addEventListener('change', function () { inp.support = supT.checked; score(); });
    var gaugeBox = h('div', { style: 'display:flex;flex-direction:column;align-items:center' });
    var factors = h('div', { class: 'al-factors' });
    var gauge = { arc: null, needle: null, val: null, lab: null };
    (function () {
      var W = 240, Hh = 140, cx = 120, cy = 124, R = 96;
      var g = s('svg', { width: W, height: Hh, viewBox: '0 0 ' + W + ' ' + Hh });
      function arc(a0, a1, r) { var p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)]; return 'M' + p0[0] + ' ' + p0[1] + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1]; }
      g.appendChild(s('path', { d: arc(Math.PI, 2 * Math.PI, R), stroke: 'var(--bg-3)', 'stroke-width': 14, fill: 'none' }));
      gauge.arc = s('path', { d: arc(Math.PI, Math.PI + 0.01, R), stroke: 'var(--orange)', 'stroke-width': 14, fill: 'none', style: 'transition:stroke .3s' });
      g.appendChild(gauge.arc);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) { var a = Math.PI + t * Math.PI; g.appendChild(s('line', { x1: cx + (R - 12) * Math.cos(a), y1: cy + (R - 12) * Math.sin(a), x2: cx + (R - 18) * Math.cos(a), y2: cy + (R - 18) * Math.sin(a), stroke: 'var(--ink-3)' })); });
      gauge.val = s('text', { x: cx, y: cy - 22, 'text-anchor': 'middle', style: 'font-size:34px;font-weight:800;letter-spacing:-.04em;fill:var(--ink)', text: '0%' });
      gauge.lab = s('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', style: "font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:.14em;fill:var(--ink-3)", text: 'CHURN RISK' });
      g.appendChild(gauge.val); g.appendChild(gauge.lab);
      gauge.arcFn = arc; gauge.R = R;
      gaugeBox.appendChild(g);
    })();
    var action = h('div', { style: 'font-size:12.5px;color:var(--ink-2);text-align:center;margin-top:4px;line-height:1.5;max-width:34ch' });
    gaugeBox.appendChild(action);
    var curP = 0;
    function score() {
      var C = CHURN.coef;
      var parts = [
        ['Contract', C.contract[inp.contract]], ['Internet', C.internet[inp.internet]], ['Payment', C.payment[inp.payment]],
        ['Tenure', C.tenure * (inp.tenure - 12)], ['Monthly bill', C.charges * (inp.charges - 65)], ['Tech support', inp.support ? C.support : 0]
      ];
      var logit = C.b0 + C.tenure * 12 + C.charges * 0 + parts.reduce(function (a, p) { return a + p[1]; }, 0);
      var p = 1 / (1 + Math.exp(-logit));
      var from = curP, t0 = performance.now();
      curP = p;
      (function step(t) {
        var k = reduced ? 1 : Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - k, 3), v = from + (p - from) * e;
        gauge.arc.setAttribute('d', gauge.arcFn(Math.PI, Math.PI + Math.max(0.01, v * Math.PI), gauge.R));
        gauge.val.textContent = Math.round(v * 100) + '%';
        if (k < 1) requestAnimationFrame(step);
      })(t0);
      var col = p > 0.5 ? '#ef5a4c' : p > 0.25 ? 'var(--orange)' : 'var(--green)';
      gauge.arc.setAttribute('stroke', col);
      action.innerHTML = p > 0.5 ? '<b style="color:#ef5a4c">High risk.</b> Offer a 12-month contract with a loyalty discount and get them onto auto-pay.' :
        p > 0.25 ? '<b style="color:var(--orange)">Watch list.</b> Trigger an onboarding check-in and a tech-support trial.' :
        '<b style="color:var(--green)">Low risk.</b> No action needed; a good upsell candidate.';
      factors.innerHTML = '';
      parts.sort(function (a, b) { return Math.abs(b[1]) - Math.abs(a[1]); }).forEach(function (pt) {
        var v = pt[1], wd = Math.min(50, Math.abs(v) / 2.2 * 50);
        factors.appendChild(h('div', { class: 'al-factor' }, [h('span', { text: pt[0] }),
          h('div', { class: 'tr', html: '<i style="' + (v >= 0 ? 'left:50%' : 'right:50%') + ';width:' + wd + '%;background:' + (v >= 0 ? '#ef5a4c' : 'var(--green)') + '"></i>' }),
          h('span', { class: 'v', style: 'color:' + (v > 0.01 ? '#ef5a4c' : v < -0.01 ? 'var(--green)' : 'var(--ink-3)'), text: (v >= 0 ? '+' : '') + v.toFixed(2) })]));
      });
    }
    var form = h('div', { class: 'al-form' }, [
      select('Contract', 'contract', ['Month-to-month', 'One year', 'Two year']),
      select('Internet', 'internet', ['Fiber optic', 'DSL', 'No internet']),
      select('Payment', 'payment', ['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card']),
      range('Tenure', 'tenure', 0, 72, ' mo'),
      range('Monthly charges', 'charges', 20, 120, ' $'),
      h('label', { class: 'al-toggle' }, [supT, document.createTextNode('Has tech support')])
    ]);
    var scorer = h('div', { class: 'al-card' }, [
      h('div', { class: 'al-card-h' }, [h('div', { class: 'al-card-t', text: 'Live churn-risk scorer' }), h('span', { class: 'al-card-s', text: 'try a customer profile' })]),
      h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;align-items:start' }, [form,
        h('div', {}, [gaugeBox, h('div', { class: 'al-card-s', style: 'margin:14px 0 8px;letter-spacing:.12em;text-transform:uppercase', text: 'log-odds contribution' }), factors])])
    ]);
    root.appendChild(h('div', { class: 'al-grid even' }, [drvCard, scorer]));
    score();

    // survival curves
    var on = { 0: true, 1: true, 2: true };
    var legend = h('div', { class: 'al-legend' });
    var survBox = h('div', { class: 'al-chart' });
    CHURN.surv.forEach(function (c, i) {
      var b = h('button', { class: 'al-chip', 'aria-pressed': 'true', style: 'display:flex;align-items:center;gap:6px', html: '<i style="width:9px;height:9px;display:inline-block;background:' + c.c + '"></i>' + c.n });
      b.addEventListener('click', function () { on[i] = !on[i]; b.setAttribute('aria-pressed', on[i]); b.style.background = on[i] ? '' : 'transparent'; b.style.opacity = on[i] ? 1 : 0.45; survBox._redraw(); });
      b.style.background = 'transparent'; b.style.color = 'var(--ink-2)'; b.style.borderColor = 'var(--line-2)';
      legend.appendChild(b);
    });
    chart(survBox, function (w) {
      var H = 230, ml = 40, mr = 12, mt = 10, mb = 26;
      var x = lin(0, 72, ml, w - mr), y = lin(0, 1, H - mb, mt);
      var g = s('svg', { width: w, height: H });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { g.appendChild(s('line', { x1: ml, x2: w - mr, y1: y(v), y2: y(v), class: 'al-grid-l' })); g.appendChild(s('text', { x: ml - 8, y: y(v) + 3, 'text-anchor': 'end', class: 'al-ax', text: Math.round(v * 100) + '%' })); });
      [0, 12, 24, 36, 48, 60, 72].forEach(function (m) { g.appendChild(s('text', { x: x(m), y: H - 8, 'text-anchor': 'middle', class: 'al-ax', text: m + 'm' })); });
      var S = function (c, t) { return Math.exp(-Math.pow(t / c.lam, c.k)); };
      CHURN.surv.forEach(function (c, i) {
        if (!on[i]) return;
        var d = ''; for (var t = 0; t <= 72; t++) d += (t ? 'H' + x(t).toFixed(1) + 'V' : 'M' + x(0) + ' ') + y(S(c, t)).toFixed(1);
        var p = s('path', { d: d, fill: 'none', stroke: c.c, 'stroke-width': 2 });
        g.appendChild(p);
      });
      var cross = s('line', { y1: mt, y2: H - mb, stroke: 'var(--ink-3)', 'stroke-dasharray': '3 4', opacity: 0 });
      g.appendChild(cross);
      var hit = s('rect', { x: ml, y: mt, width: w - ml - mr, height: H - mt - mb, fill: 'transparent' });
      onHover(hit, function (e) {
        var r = g.getBoundingClientRect(), t = Math.max(0, Math.min(72, Math.round((e.clientX - r.left - ml) / (w - ml - mr) * 72)));
        cross.setAttribute('x1', x(t)); cross.setAttribute('x2', x(t)); cross.setAttribute('opacity', 1);
        tip.show(tipRows('Month ' + t + ' · still active', CHURN.surv.filter(function (c, i) { return on[i]; }).map(function (c) { return [c.n, pct(S(c, t)), c.c]; })), e.clientX, e.clientY);
      }, function () { cross.setAttribute('opacity', 0); tip.hide(); });
      g.appendChild(hit);
      survBox.appendChild(g);
    });
    var survCard = h('div', { class: 'al-card' }, [h('div', { class: 'al-card-h' }, [h('div', {}, [h('div', { class: 'al-card-t', text: 'Customer survival by contract' }), h('span', { class: 'al-card-s', text: 'Kaplan–Meier style · share of customers still active' })]), legend]), survBox]);
    var ins = h('div', { class: 'al-insight', html: '<div class="k">Business impact</div><div class="big">' + money(CHURN.mrrLost * 12 * 0.25) + '</div><p>Annual revenue protected if the scorer\'s top-risk decile is moved to 1-year contracts at a <strong style="color:var(--ink)">25% save rate</strong>.</p><p>The scored list is exported weekly as a call list for the retention team, ranked by <strong style="color:var(--ink)">risk × monthly bill</strong>.</p>' });
    root.appendChild(h('div', { class: 'al-grid' }, [survCard, ins]));
    return root;
  }

  var CHURN_CODE = [
    { name: 'churn_by_segment.sql', desc: 'Segment churn + lift', lang: 'sql', note: 'One query gives churn rate, revenue lost and lift against the base rate for every segment, using a window function so the base rate is calculated only once.',
      code: "-- Churn rate & revenue at risk by contract type\nWITH base AS (\n    SELECT\n        contract,\n        COUNT(*)                                        AS customers,\n        SUM(CASE WHEN churn = 'Yes' THEN 1 ELSE 0 END)  AS churned,\n        SUM(CASE WHEN churn = 'Yes' THEN monthly_charges END) AS mrr_lost\n    FROM telco_customers\n    GROUP BY contract\n)\nSELECT\n    contract,\n    customers,\n    churned,\n    ROUND(100.0 * churned / customers, 1)                    AS churn_rate_pct,\n    ROUND(mrr_lost, 0)                                       AS mrr_lost,\n    ROUND((1.0 * churned / customers)\n        / (SUM(churned) OVER () * 1.0 / SUM(customers) OVER ()), 2) AS lift_vs_avg\nFROM base\nORDER BY churn_rate_pct DESC;" },
    { name: 'tenure_cohorts.sql', desc: 'Tenure bands', lang: 'sql', note: 'Buckets customers by tenure to show that churn is concentrated early in the customer lifecycle.',
      code: "SELECT\n    CASE\n        WHEN tenure <= 12 THEN '0-12'\n        WHEN tenure <= 24 THEN '13-24'\n        WHEN tenure <= 48 THEN '25-48'\n        WHEN tenure <= 60 THEN '49-60'\n        ELSE '61-72'\n    END                                              AS tenure_band,\n    COUNT(*)                                         AS customers,\n    ROUND(AVG(CASE WHEN churn = 'Yes' THEN 1.0 ELSE 0 END) * 100, 1) AS churn_pct,\n    ROUND(AVG(monthly_charges), 2)                   AS avg_bill\nFROM telco_customers\nGROUP BY 1\nORDER BY MIN(tenure);" },
    { name: 'churn_model.py', desc: 'Logistic regression', lang: 'python', note: 'An interpretable model was chosen on purpose, because the retention team needs to know why a customer is at risk, not just the score.',
      code: "import pandas as pd\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.preprocessing import OneHotEncoder, StandardScaler\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import roc_auc_score\n\ndf = pd.read_csv(\"telco_churn.csv\")\ndf[\"TotalCharges\"] = pd.to_numeric(df[\"TotalCharges\"], errors=\"coerce\").fillna(0)\ny = (df[\"Churn\"] == \"Yes\").astype(int)\n\ncat = [\"Contract\", \"InternetService\", \"PaymentMethod\", \"TechSupport\"]\nnum = [\"tenure\", \"MonthlyCharges\"]\n\nmodel = Pipeline([\n    (\"prep\", ColumnTransformer([\n        (\"cat\", OneHotEncoder(drop=\"first\"), cat),\n        (\"num\", StandardScaler(), num),\n    ])),\n    (\"clf\", LogisticRegression(max_iter=1000, class_weight=\"balanced\")),\n])\n\nX_tr, X_te, y_tr, y_te = train_test_split(df[cat + num], y, test_size=0.2,\n                                          stratify=y, random_state=42)\nmodel.fit(X_tr, y_tr)\nprint(\"ROC-AUC:\", round(roc_auc_score(y_te, model.predict_proba(X_te)[:, 1]), 3))" },
    { name: 'survival.py', desc: 'Kaplan–Meier curves', lang: 'python', note: 'Survival curves show when customers leave, which a single churn percentage cannot.',
      code: "from lifelines import KaplanMeierFitter\nimport matplotlib.pyplot as plt\n\nkmf = KaplanMeierFitter()\nax = plt.gca()\n\nfor contract, grp in df.groupby(\"Contract\"):\n    kmf.fit(grp[\"tenure\"], event_observed=(grp[\"Churn\"] == \"Yes\"), label=contract)\n    kmf.plot_survival_function(ax=ax, ci_show=True)\n\nax.set_xlabel(\"Months since sign-up\")\nax.set_ylabel(\"Share still active\")" }
  ];

  /* ===========================================================
     PROJECT 3 — PYTHON · A/B test (e-commerce landing page)
     =========================================================== */
  var AB = { nC: 145274, xC: 17489, nT: 145310, xT: 17264 };

  function buildAB() {
    var root = h('div');
    var pC = AB.xC / AB.nC, pT = AB.xT / AB.nT, diff = pT - pC;
    var pp = (AB.xC + AB.xT) / (AB.nC + AB.nT);
    var sePool = Math.sqrt(pp * (1 - pp) * (1 / AB.nC + 1 / AB.nT));
    var z = diff / sePool, pval = 2 * (1 - ncdf(Math.abs(z)));
    var seU = Math.sqrt(pC * (1 - pC) / AB.nC + pT * (1 - pT) / AB.nT);
    var ci = [diff - 1.96 * seU, diff + 1.96 * seU];

    var k1 = kpiCard('Users in test'), k2 = kpiCard('Control (old page)'), k3 = kpiCard('Treatment (new page)'), k4 = kpiCard('p-value', 'hot');
    root.appendChild(h('div', { class: 'al-kpis' }, [k1.el, k2.el, k3.el, k4.el]));
    tween(k1.v, AB.nC + AB.nT, num); k1.d.textContent = 'after de-duplication & QA';
    tween(k2.v, pC, function (v) { return pct(v, 2); }); k2.d.textContent = num(AB.xC) + ' / ' + num(AB.nC);
    tween(k3.v, pT, function (v) { return pct(v, 2); }); k3.d.className = 'al-kpi-d down'; k3.d.textContent = '▼ ' + Math.abs(diff * 100).toFixed(2) + ' pts vs control';
    tween(k4.v, pval, function (v) { return v.toFixed(3); }); k4.d.textContent = 'z = ' + z.toFixed(2) + ' · two-sided';

    // distributions
    var showCI = true;
    var distBox = h('div', { class: 'al-chart' });
    var ciBtn = h('button', { class: 'al-chip', 'aria-pressed': 'true', text: '95% CI' });
    ciBtn.addEventListener('click', function () { showCI = !showCI; ciBtn.setAttribute('aria-pressed', showCI); distBox._redraw(); });
    chart(distBox, function (w) {
      var H = 230, ml = 14, mr = 14, mt = 14, mb = 28;
      var sdC = Math.sqrt(pC * (1 - pC) / AB.nC), sdT = Math.sqrt(pT * (1 - pT) / AB.nT);
      var lo = Math.min(pC, pT) - 4.2 * sdC, hi = Math.max(pC, pT) + 4.2 * sdC;
      var peak = npdf(pC, pC, sdC);
      var x = lin(lo, hi, ml, w - mr), y = lin(0, peak * 1.12, H - mb, mt);
      var g = s('svg', { width: w, height: H });
      for (var i = 0; i <= 6; i++) { var v = lo + (hi - lo) * i / 6; g.appendChild(s('text', { x: x(v), y: H - 8, 'text-anchor': 'middle', class: 'al-ax', text: pct(v, 2) })); }
      g.appendChild(s('line', { x1: ml, x2: w - mr, y1: H - mb, y2: H - mb, stroke: 'var(--line-2)' }));
      [[pC, sdC, 'var(--ink-3)', 'Control'], [pT, sdT, 'var(--orange)', 'Treatment']].forEach(function (c) {
        var d = 'M' + x(lo) + ' ' + y(0);
        for (var j = 0; j <= 120; j++) { var xv = lo + (hi - lo) * j / 120; d += 'L' + x(xv).toFixed(1) + ' ' + y(npdf(xv, c[0], c[1])).toFixed(1); }
        g.appendChild(s('path', { d: d + 'L' + x(hi) + ' ' + y(0) + 'Z', fill: c[2], 'fill-opacity': 0.14 }));
        g.appendChild(s('path', { d: d, fill: 'none', stroke: c[2], 'stroke-width': 2 }));
        g.appendChild(s('line', { x1: x(c[0]), x2: x(c[0]), y1: y(peak * 1.02), y2: H - mb, stroke: c[2], 'stroke-dasharray': '3 3' }));
        g.appendChild(s('text', { x: x(c[0]), y: y(peak * 1.06), 'text-anchor': 'middle', class: 'al-ax', style: 'fill:' + c[2] + ';font-weight:600', text: c[3] + ' ' + pct(c[0], 2) }));
        if (showCI) {
          var a = x(c[0] - 1.96 * c[1]), b = x(c[0] + 1.96 * c[1]), yy = H - mb - 8 - (c[3] === 'Control' ? 0 : 8);
          g.appendChild(s('line', { x1: a, x2: b, y1: yy, y2: yy, stroke: c[2], 'stroke-width': 3 }));
        }
      });
      var cross = s('line', { y1: mt, y2: H - mb, stroke: 'var(--ink-3)', 'stroke-dasharray': '2 4', opacity: 0 });
      g.appendChild(cross);
      var hit = s('rect', { x: ml, y: mt, width: w - ml - mr, height: H - mt - mb, fill: 'transparent' });
      onHover(hit, function (e) {
        var r = g.getBoundingClientRect(), xv = lo + (e.clientX - r.left - ml) / (w - ml - mr) * (hi - lo);
        cross.setAttribute('x1', x(xv)); cross.setAttribute('x2', x(xv)); cross.setAttribute('opacity', 1);
        tip.show(tipRows('true conversion = ' + pct(xv, 2), [['P(control ≥ this)', pct(1 - ncdf((xv - pC) / sdC)), 'var(--ink-3)'], ['P(treatment ≥ this)', pct(1 - ncdf((xv - pT) / sdT)), 'var(--orange)']]), e.clientX, e.clientY);
      }, function () { cross.setAttribute('opacity', 0); tip.hide(); });
      g.appendChild(hit);
      distBox.appendChild(g);
    });
    var distCard = h('div', { class: 'al-card' }, [h('div', { class: 'al-card-h' }, [h('div', {}, [h('div', { class: 'al-card-t', text: 'Sampling distributions' }), h('span', { class: 'al-card-s', text: 'how likely each true conversion rate is' })]), ciBtn]), distBox]);

    // decision + CI of difference
    var ciBox = h('div', { class: 'al-chart', style: 'margin-top:14px' });
    chart(ciBox, function (w) {
      var H = 70, lo = -0.006, hi = 0.006, x = lin(lo, hi, 8, w - 8);
      var g = s('svg', { width: w, height: H });
      g.appendChild(s('rect', { x: x(-0.005), y: 14, width: x(0.005) - x(-0.005), height: 26, fill: 'var(--bg-3)' }));
      g.appendChild(s('line', { x1: x(0), x2: x(0), y1: 6, y2: 48, stroke: 'var(--ink)', 'stroke-width': 1 }));
      g.appendChild(s('line', { x1: x(ci[0]), x2: x(ci[1]), y1: 27, y2: 27, stroke: 'var(--orange)', 'stroke-width': 4 }));
      g.appendChild(s('rect', { x: x(diff) - 5, y: 22, width: 10, height: 10, fill: 'var(--orange)' }));
      [-0.005, 0, 0.005].forEach(function (v) { g.appendChild(s('text', { x: x(v), y: H - 6, 'text-anchor': 'middle', class: 'al-ax', text: (v > 0 ? '+' : '') + (v * 100).toFixed(1) + ' pts' })); });
      g.appendChild(s('text', { x: x(-0.005) + 4, y: 11, class: 'al-ax', text: '±0.5 pt "worth shipping" zone' }));
      ciBox.appendChild(g);
    });
    var decision = h('div', { class: 'al-card' }, [
      h('div', { class: 'al-card-h' }, [h('div', { class: 'al-card-t', text: 'Decision' }), h('span', { class: 'al-verdict', html: '<i></i>Do not ship' })]),
      h('p', { style: 'font-size:13.5px;color:var(--ink-2);line-height:1.6', html: 'The new page converts <b style="color:var(--ink)">' + Math.abs(diff * 100).toFixed(2) + ' pts lower</b>, and the 95% CI of the difference is <b style="color:var(--ink)">[' + (ci[0] * 100).toFixed(2) + ', +' + (ci[1] * 100).toFixed(2) + '] pts</b>, which includes zero. With p = ' + pval.toFixed(2) + ' there is no evidence of an uplift, so we keep the old page and save the redesign cost.' }),
      ciBox,
      h('div', { class: 'al-card-s', style: 'margin-top:10px', text: 'Checks: SRM χ² p = 0.97 · novelty effect ruled out (week 1 vs 3) · no peeking: fixed horizon' })
    ]);
    root.appendChild(h('div', { class: 'al-grid' }, [distCard, decision]));

    // daily trend
    var rnd = seeded(7), days = [];
    for (var d = 0; d < 22; d++) { var nc = 6603 + (rnd() - 0.5) * 500, nt = 6605 + (rnd() - 0.5) * 500; days.push({ d: d, c: pC + (rnd() - 0.5) * 0.009, t: pT + (rnd() - 0.5) * 0.009, nc: nc, nt: nt }); }
    var dayBox = h('div', { class: 'al-chart' });
    chart(dayBox, function (w) {
      var H = 210, ml = 46, mr = 10, mt = 10, mb = 26, lo = 0.108, hi = 0.132;
      var x = lin(0, 21, ml, w - mr), y = lin(lo, hi, H - mb, mt);
      var g = s('svg', { width: w, height: H });
      [lo, 0.114, 0.12, 0.126, hi].forEach(function (v) { g.appendChild(s('line', { x1: ml, x2: w - mr, y1: y(v), y2: y(v), class: 'al-grid-l' })); g.appendChild(s('text', { x: ml - 8, y: y(v) + 3, 'text-anchor': 'end', class: 'al-ax', text: pct(v) })); });
      days.forEach(function (p, i) { if (i % (w < 480 ? 7 : 3) === 0) g.appendChild(s('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'al-ax', text: 'Jan ' + (i + 2) })); });
      [['c', 'var(--ink-3)'], ['t', 'var(--orange)']].forEach(function (k) {
        g.appendChild(s('path', { d: days.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[k[0]]).toFixed(1); }).join(''), fill: 'none', stroke: k[1], 'stroke-width': 1.8 }));
        days.forEach(function (p, i) { g.appendChild(s('rect', { x: x(i) - 2, y: y(p[k[0]]) - 2, width: 4, height: 4, fill: k[1] })); });
      });
      g.appendChild(s('line', { x1: ml, x2: w - mr, y1: y(pC), y2: y(pC), stroke: 'var(--ink-3)', 'stroke-dasharray': '2 4', opacity: 0.7 }));
      var cross = s('line', { y1: mt, y2: H - mb, stroke: 'var(--ink-3)', 'stroke-dasharray': '3 4', opacity: 0 });
      g.appendChild(cross);
      var hit = s('rect', { x: ml, y: mt, width: w - ml - mr, height: H - mt - mb, fill: 'transparent' });
      onHover(hit, function (e) {
        var r = g.getBoundingClientRect(), i = Math.max(0, Math.min(21, Math.round((e.clientX - r.left - ml) / (w - ml - mr) * 21))), p = days[i];
        cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
        tip.show(tipRows('Jan ' + (i + 2) + ', 2017', [['Control', pct(p.c, 2), 'var(--ink-3)'], ['Treatment', pct(p.t, 2), 'var(--orange)'], ['Users', num(p.nc + p.nt)]]), e.clientX, e.clientY);
      }, function () { cross.setAttribute('opacity', 0); tip.hide(); });
      g.appendChild(hit);
      dayBox.appendChild(g);
    });
    var dayCard = h('div', { class: 'al-card' }, [h('div', { class: 'al-card-h' }, [h('div', {}, [h('div', { class: 'al-card-t', text: 'Daily conversion' }), h('span', { class: 'al-card-s', text: '22-day fixed-horizon test' })]),
      h('div', { class: 'al-legend', html: '<span><i style="background:var(--ink-3)"></i>Control</span><span><i style="background:var(--orange)"></i>Treatment</span>' })]), dayBox]);

    // sample-size planner
    var pl = { base: 12, mde: 0.5, power: 80, alpha: 0.05, traffic: 13000 };
    var out = h('div', { class: 'al-out' });
    var oN = h('div', { class: 'v' }), oT = h('div', { class: 'v' }), oD = h('div', { class: 'v' });
    out.appendChild(h('div', {}, [h('div', { class: 'l', text: 'Per variant' }), oN]));
    out.appendChild(h('div', {}, [h('div', { class: 'l', text: 'Total users' }), oT]));
    out.appendChild(h('div', {}, [h('div', { class: 'l', text: 'Run time' }), oD]));
    var detect = h('p', { style: 'font-size:12.5px;color:var(--ink-2);margin-top:12px;line-height:1.55' });
    function calc() {
      var p1 = pl.base / 100, p2 = p1 + pl.mde / 100, pb = (p1 + p2) / 2;
      var za = ninv(1 - pl.alpha / 2), zb = ninv(pl.power / 100);
      var n = Math.pow(za * Math.sqrt(2 * pb * (1 - pb)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) / Math.pow(p2 - p1, 2);
      n = Math.ceil(n);
      tween(oN, n, num); tween(oT, n * 2, num); tween(oD, Math.ceil(n * 2 / pl.traffic), function (v) { return Math.ceil(v) + ' days'; });
      var mdeHad = (za + zb) * Math.sqrt(2 * p1 * (1 - p1) / AB.nC);
      detect.innerHTML = 'With <b style="color:var(--ink)">' + num(AB.nC) + '</b> users per arm, this test could reliably detect a change of <b style="color:var(--orange)">±' + (mdeHad * 100).toFixed(2) + ' pts</b>, so a real effect large enough to matter would have shown up.';
    }
    function rng(label, key, min, max, step, fmt) {
      var val = h('b', { text: fmt(pl[key]) });
      var r = h('input', { type: 'range', class: 'al-range', min: min, max: max, step: step, value: pl[key], 'aria-label': label });
      function paint() { r.style.setProperty('--p', ((r.value - min) / (max - min) * 100) + '%'); }
      r.addEventListener('input', function () { pl[key] = +r.value; val.textContent = fmt(pl[key]); paint(); calc(); });
      paint();
      return h('div', { class: 'al-field' }, [h('label', {}, [document.createTextNode(label), val]), r]);
    }
    var alphaSeg = h('div', { class: 'al-seg' });
    [0.01, 0.05, 0.1].forEach(function (a) {
      var b = h('button', { text: 'α ' + a, 'aria-pressed': a === pl.alpha });
      b.addEventListener('click', function () { pl.alpha = a; alphaSeg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); calc(); });
      alphaSeg.appendChild(b);
    });
    var planner = h('div', { class: 'al-card' }, [
      h('div', { class: 'al-card-h' }, [h('div', { class: 'al-card-t', text: 'Sample-size planner' }), alphaSeg]),
      h('div', { class: 'al-form' }, [
        rng('Baseline conversion', 'base', 1, 30, 0.5, function (v) { return v + '%'; }),
        rng('Min. detectable effect', 'mde', 0.1, 3, 0.1, function (v) { return '+' + (+v).toFixed(1) + ' pts'; }),
        rng('Statistical power', 'power', 70, 95, 1, function (v) { return v + '%'; }),
        rng('Daily traffic', 'traffic', 1000, 50000, 500, function (v) { return num(v) + '/day'; })
      ]),
      out, detect
    ]);
    calc();
    root.appendChild(h('div', { class: 'al-grid even' }, [dayCard, planner]));
    return root;
  }

  var AB_CODE = [
    { name: 'clean_and_qa.py', desc: 'Data QA before stats', lang: 'python', note: 'Removes rows where the variant and the page shown disagree, plus duplicate users. A test is only as reliable as its assignment data.',
      code: "import pandas as pd\n\ndf = pd.read_csv(\"ab_data.csv\")          # 294,478 rows\n\n# 1) drop rows where group and landing page disagree\nmismatch = ((df.group == \"treatment\") != (df.landing_page == \"new_page\"))\ndf = df[~mismatch]\n\n# 2) one row per user\ndf = df.drop_duplicates(subset=\"user_id\", keep=\"first\")\n\n# 3) sample-ratio-mismatch check\nfrom scipy.stats import chisquare\ncounts = df.group.value_counts()\nprint(\"SRM p-value:\", chisquare(counts).pvalue)   # 0.97 -> healthy split" },
    { name: 'ztest.py', desc: 'Two-proportion z-test', lang: 'python', note: 'A frequentist test with a pre-registered alpha of 0.05 and a fixed horizon (no peeking), plus a confidence interval for the effect size.',
      code: "from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep\n\nconv = df.groupby(\"group\")[\"converted\"].agg([\"sum\", \"count\"])\nsuccesses = [conv.loc[\"treatment\", \"sum\"], conv.loc[\"control\", \"sum\"]]\nnobs      = [conv.loc[\"treatment\", \"count\"], conv.loc[\"control\", \"count\"]]\n\nz, p = proportions_ztest(successes, nobs, alternative=\"two-sided\")\nlo, hi = confint_proportions_2indep(successes[0], nobs[0],\n                                    successes[1], nobs[1], method=\"wald\")\n\nprint(f\"z = {z:.2f}, p = {p:.3f}\")\nprint(f\"diff 95% CI: [{lo*100:.2f}, {hi*100:.2f}] pts\")\n# z = -1.31, p = 0.190  -> fail to reject H0" },
    { name: 'power.py', desc: 'Sample size & MDE', lang: 'python', note: 'Power analysis decided the test length before launch, the same calculation the planner on the left runs live.',
      code: "from statsmodels.stats.power import NormalIndPower\nfrom statsmodels.stats.proportion import proportion_effectsize\n\nbaseline, mde = 0.12, 0.005          # 12% -> 12.5%\neffect = proportion_effectsize(baseline + mde, baseline)\n\nn = NormalIndPower().solve_power(effect_size=effect, alpha=0.05,\n                                 power=0.80, ratio=1.0)\nprint(f\"users per variant: {n:,.0f}\")   # ~ 67,000" },
    { name: 'regression.py', desc: 'Country interaction', lang: 'python', note: 'A logistic regression with country interactions checks that no segment hides a real effect.',
      code: "import statsmodels.formula.api as smf\n\ndf = df.merge(pd.read_csv(\"countries.csv\"), on=\"user_id\")\ndf[\"treat\"] = (df.group == \"treatment\").astype(int)\n\nfit = smf.logit(\"converted ~ treat * C(country)\", data=df).fit()\nprint(fit.summary())\n# no interaction term significant at 0.05 -> effect is flat across US / UK / CA" }
  ];

  /* ===========================================================
     PROJECT REGISTRY
     =========================================================== */
  var PROJECTS = [
    { key: 'pbi', no: '01', short: 'Power BI', summary: 'An end-to-end Power BI report on four years of retail orders. It shows where revenue is growing, where profit is leaking, and what to change.', tool: 'Power BI · DAX · Power Query', color: 'var(--orange)', title: 'Retail Sales & Profitability Command Center', stat: '$2.3M', statL: 'sales analysed across 4 years & 4 regions',
      file: 'superstore_performance.pbix',
      views: [{ k: 'Report', b: buildPBI }, { k: 'Data model', b: buildPBIModel }, { k: 'DAX', b: function () { return codeView(PBI_CODE); } }],
      source: ['Dataset: Sample Superstore · 9,994 order lines · 2014–2017', 'web re-creation of the Power BI report · monthly split modelled'],
      case: {
        Problem: 'Leadership saw <strong>revenue up 56% in two years</strong> while margin barely moved, and nobody could say which products were eating the profit.',
        Approach: 'Built a <strong>star-schema model</strong> in Power Query, 20+ DAX measures with time intelligence, and a one-page report with cross-filtering slicers and drill-through.',
        Insight: '<strong>Tables & Bookcases lose $21K</strong> combined. Discounts above 20% turn every Furniture line negative, while Technology carries 51% of total profit.',
        Impact: 'A proposed discount cap is worth <strong>~$25K of profit a year</strong>. Monthly reporting went from a 2-day Excel job to a <strong>self-serve refresh</strong>.'
      }, stack: ['Power BI Desktop', 'DAX', 'Power Query (M)', 'Star schema', 'Drill-through', 'Row-level security'] },
    { key: 'churn', no: '02', short: 'Churn model', summary: 'Why telecom customers leave and who is likely to leave next. SQL finds the drivers, survival analysis shows when they leave, and a Python model scores every customer.', tool: 'SQL · Python · scikit-learn', color: 'var(--violet)', title: 'Customer Churn Analysis & Risk Scoring', stat: '26.5%', statL: 'churn explained & predicted (AUC 0.84)',
      file: 'telco_churn_analysis.ipynb',
      views: [{ k: 'Analysis', b: buildChurn }, { k: 'SQL & Python', b: function () { return codeView(CHURN_CODE); } }],
      source: ['Dataset: IBM Telco Customer Churn · 7,043 customers · 21 features', 'survival & risk model parameters fitted in Python'],
      case: {
        Problem: 'A telecom provider was losing <strong>1 in 4 customers</strong> and about <strong>$139K of monthly revenue</strong>, and retention offers went out with no targeting.',
        Approach: '<strong>SQL segmentation</strong> to size every driver, Kaplan–Meier survival curves for timing, and an <strong>interpretable logistic model</strong> to score each customer.',
        Insight: 'Month-to-month + fiber + e-check customers churn at <strong>over 50%</strong>. Half of all churn happens in the <strong>first 12 months</strong>.',
        Impact: 'A ranked weekly call list. Saving 25% of top-risk customers protects <strong>~$417K a year</strong> in recurring revenue.'
      }, stack: ['SQL (CTEs, window fns)', 'Python', 'pandas', 'scikit-learn', 'lifelines', 'Jupyter'] },
    { key: 'ab', no: '03', short: 'A/B test', summary: 'A complete A/B test readout for a redesigned landing page: data QA, a significance test, confidence intervals and power analysis, ending in a clear ship-or-kill decision.', tool: 'Python · Statistics · Experimentation', color: 'var(--green)', title: 'Landing-Page A/B Test: Ship or Kill?', stat: '290K', statL: 'users tested. The data said don\'t ship.',
      file: 'ab_test_landing_page.ipynb',
      views: [{ k: 'Experiment', b: buildAB }, { k: 'Python', b: function () { return codeView(AB_CODE); } }],
      source: ['Dataset: e-commerce A/B test (Kaggle "ab_data") · 294,478 sessions', 'daily series illustrative · test statistics computed live in your browser'],
      case: {
        Problem: 'Product wanted to roll out a <strong>redesigned landing page</strong> to everyone, based on a gut feeling that it "looked better".',
        Approach: 'Data QA (SRM check, de-duplication), a <strong>two-proportion z-test</strong> with a pre-set alpha, confidence intervals, power analysis and a <strong>country-interaction regression</strong>.',
        Insight: 'The new page converted at <strong>11.88% vs 12.04%</strong> for control (p = 0.19). The test was powered to catch ±0.34 pts, so <strong>no effect means no effect</strong>.',
        Impact: 'Recommended <strong>not shipping</strong>, which avoided the rollout cost and a possible conversion drop. I also set up a reusable <strong>experiment-readout template</strong>.'
      }, stack: ['Python', 'pandas', 'SciPy', 'statsmodels', 'Hypothesis testing', 'Power analysis'] }
  ];

  /* ===========================================================
     MOUNT
     =========================================================== */
  function mount(root) {
    if (root.getAttribute('data-al-mounted')) return;
    root.setAttribute('data-al-mounted', '1');
    root.innerHTML = '';
    root.classList.add('al-root');
    tipEl = h('div', { class: 'al-tip', role: 'tooltip' });
    var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;

    var head = h('div', { class: 'al-sub' }, [
      h('div', { class: 'al-sub-l' }, [h('span', { class: 'al-sub-k', text: 'A' }), h('span', { text: 'Analytics projects' }), h('span', { class: 'al-sub-tag', text: 'interactive' })]),
      h('p', { class: 'al-sub-p', text: 'Pick a project to see the business problem, what I did and the result. Then try the live dashboard underneath.' })
    ]);

    var picker = h('div', { class: 'al-picker', role: 'tablist', 'aria-label': 'Analytics projects' });
    var brief = h('div', { class: 'al-brief' });
    var caseEl = h('div', { class: 'al-case' });
    var demoL = h('div', { class: 'al-demo-l' });
    var stage = h('div', { class: 'al-stage' });
    var bar = h('div', { class: 'al-bar' });
    var body = h('div', { class: 'al-body', role: 'tabpanel' });
    var source = h('div', { class: 'al-source' });
    stage.appendChild(bar); stage.appendChild(body); stage.appendChild(source);
    var next = h('button', { class: 'al-next' });

    var cur = 0, curView = 0;
    PROJECTS.forEach(function (p, i) {
      var b = h('button', { class: 'al-pick', role: 'tab', id: 'al-tab-' + p.key, 'aria-selected': 'false', tabindex: '-1', style: '--c:' + p.color }, [
        h('div', { class: 'al-pick-top' }, [h('span', { class: 'al-tool', html: '<b></b>' + p.tool }), h('span', { class: 'al-pick-no', text: p.no })]),
        h('span', { class: 'al-pick-short', html: '<em>' + p.no + '</em>' + p.short }),
        h('h3', { text: p.title }),
        h('div', { class: 'al-pick-stat' }, [h('strong', { text: p.stat }), h('span', { text: p.statL })])
      ]);
      b.addEventListener('click', function () { if (i !== cur) select(i, 0); });
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
      b.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (n) { e.preventDefault(); var j = (cur + n + PROJECTS.length) % PROJECTS.length; select(j, 0); picker.children[j].focus(); }
      });
      picker.appendChild(b);
    });
    next.addEventListener('click', function () {
      select((cur + 1) % PROJECTS.length, 0);
      var top = root.getBoundingClientRect().top + window.scrollY - 76;
      try { window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, top); }
    });

    function select(i, v, first) {
      cleanups.forEach(function (f) { f(); }); cleanups = []; tip.hide();
      cur = i; curView = v || 0;
      var p = PROJECTS[i];
      [].forEach.call(picker.children, function (b, j) { b.setAttribute('aria-selected', String(j === i)); b.setAttribute('tabindex', j === i ? '0' : '-1'); });
      body.setAttribute('aria-labelledby', 'al-tab-' + p.key);

      // 1. brief: what the project is, stack, links
      brief.innerHTML = '';
      var L = LINKS[p.key] || {}, links = h('div', { class: 'al-links' });
      if (L.live) links.appendChild(h('a', { class: 'al-btn pri', href: L.live, target: '_blank', rel: 'noopener', html: (p.key === 'pbi' ? 'Open live report' : 'Open notebook') + ' <span>↗</span>' }));
      if (L.repo) links.appendChild(h('a', { class: 'al-btn', href: L.repo, target: '_blank', rel: 'noopener', html: 'View code on GitHub <span>↗</span>' }));
      brief.appendChild(h('div', { class: 'al-brief-main' }, [
        h('span', { class: 'al-tool', style: '--c:' + p.color, html: '<b></b>' + p.tool }),
        h('h3', { class: 'al-brief-t', text: p.title }),
        h('p', { class: 'al-brief-s', text: p.summary }),
        h('div', { class: 'al-stack' }, p.stack.map(function (x) { return h('span', { text: x }); }))
      ]));
      if (links.children.length) brief.appendChild(links);

      // 2. case study
      caseEl.innerHTML = '';
      Object.keys(p.case).forEach(function (k, j) { caseEl.appendChild(h('div', {}, [h('div', { class: 'k', html: '<span>0' + (j + 1) + '</span>' + k }), h('p', { html: p.case[k] })])); });

      // 3. live demo
      demoL.innerHTML = '<span class="t"><i></i>Live demo</span><span class="s">' + (touch ? 'tap or drag on any chart to see values' : 'hover any chart · click to filter') + '</span>';
      bar.innerHTML = '';
      bar.appendChild(h('div', { class: 'al-file', style: '--c:' + p.color, html: '<b></b>' + p.file }));
      var views = h('div', { class: 'al-views', role: 'tablist', 'aria-label': 'Views' });
      p.views.forEach(function (vw, j) {
        var vb = h('button', { class: 'al-view', role: 'tab', 'aria-selected': j === curView, text: vw.k });
        vb.addEventListener('click', function () { if (j !== curView) select(cur, j); });
        views.appendChild(vb);
      });
      bar.appendChild(views);
      body.innerHTML = '';
      body.classList.remove('al-enter'); void body.offsetWidth; if (!first) body.classList.add('al-enter');
      body.appendChild(p.views[curView].b());
      source.innerHTML = '<span>' + p.source[0] + '</span><span>' + p.source[1] + '</span>';
      var np = PROJECTS[(i + 1) % PROJECTS.length];
      next.innerHTML = '<span class="l">Next project</span><span class="r">' + np.no + ' · ' + np.title + ' <b>→</b></span>';
    }

    [head, picker, brief, caseEl, demoL, stage, next, tipEl].forEach(function (x) { root.appendChild(x); });
    select(0, 0, true);
    window.addEventListener('scroll', tip.hide, { passive: true });
    document.addEventListener('pointerdown', function (e) { if (!(e.target.closest && e.target.closest('.al-chart'))) tip.hide(); });
  }

  function tryMount() {
    var root = document.querySelector('[data-al-root]');
    if (root && !root.getAttribute('data-al-mounted') && document.getElementById('pr-os')) { mount(root); }
  }
  // The page is rendered by a client-side runtime, so wait for the section to appear.
  function start() {
    tryMount();
    var mo = new MutationObserver(tryMount);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
