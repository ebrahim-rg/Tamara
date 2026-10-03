(function () {
'use strict';
var C = window.CONTENT;
var MODS = [
  { id: 'vision', label: 'Vision & strategy', nav: 'Vision' },
  { id: 'analyse', label: 'Analyse', n: 1, job: 'What the brief says, what it means, what is missing.' },
  { id: 'prioritise', label: 'Prioritise', n: 2, job: 'Eight processes scored and ranked, with the working shown.' },
  { id: 'timeline', label: 'Timeline', n: 3, job: 'Months, money, the full year, risks.' },
  { id: 'execute', label: 'Execute', n: 4, job: 'The 90-day plan in detail.' },
  { id: 'after', label: 'After day 90', n: 5, job: 'How it scales to month 12.' },
  { id: 'govern', label: 'Govern', n: 6, job: 'Cadence, accountability, why it lasts.' },
  { id: 'appendix', label: 'Appendix', job: 'Assumptions, tools, glossary, sources.' }
];
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function num(s) { var n = parseFloat(String(s).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? null : n; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

/* ---------- tables ---------- */
function splitRow(l) { l = l.trim(); if (l[0] === '|') l = l.slice(1); if (l[l.length - 1] === '|') l = l.slice(0, -1); return l.split('|').map(function (s) { return s.trim(); }); }
function isT(l) { return /^\s*\|/.test(l); }
function parseT(lines) { return { head: splitRow(lines[0]), rows: lines.slice(2).map(splitRow) }; }
function allTables(src) {
  var L = src.split('\n'), res = [], i = 0;
  while (i < L.length) {
    if (isT(L[i])) { var j = i; while (j < L.length && isT(L[j])) j++; var t = parseT(L.slice(i, j)); t.start = i; t.end = j; res.push(t); i = j; } else i++;
  }
  return res;
}
function tableHtml(t, o) {
  o = o || {};
  var raci = t.head.indexOf('Head of People Ops') > -1;
  var h = '<div class="tw"><table' + (o.cls ? ' class="' + o.cls + '"' : '') + (o.id ? ' id="' + o.id + '"' : '') + '><thead><tr>';
  t.head.forEach(function (c, i) { h += '<th' + (o.sort ? ' data-sort="' + i + '"' : '') + '>' + inline(c) + '</th>'; });
  h += '</tr></thead><tbody>';
  t.rows.forEach(function (r) {
    h += '<tr>';
    for (var i = 0; i < t.head.length; i++) {
      var c = r[i] === undefined ? '' : r[i], inner;
      if (i === 0 && /^[A-H]\d{1,2}$/.test(c)) inner = '<span class="code">' + esc(c) + '</span>';
      else if (/^[RACI]$/.test(c) && raci) inner = '<span class="raci r-' + c + '">' + c + '</span>';
      else if (/^(High|Medium)$/.test(c)) inner = '<span class="chip2 ' + c + '">' + c + '</span>';
      else inner = inline(c);
      h += '<td>' + inner + '</td>';
    }
    h += '</tr>';
  });
  return h + '</tbody></table></div>';
}

/* ---------- inline + markdown ---------- */
var ASSUME = {};
function tag(k, prose) {
  var c = k === 'G' ? 'g' : k === 'D' ? 'd' : 'a';
  return prose ? '<span class="aref" tabindex="0" data-k="' + k + '">' + k + '</span>'
    : '<sup class="tag ' + c + '" tabindex="0" data-k="' + k + '">' + k + '</sup>';
}
function inline(s, o) {
  o = o || {};
  var ph = [];
  function keep(h) { ph.push(h); return '\u0001' + (ph.length - 1) + '\u0002'; }
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, function (m, c) { return /^(G|D|A\d+)$/.test(c) ? keep(tag(c)) : keep('<code>' + c + '</code>'); });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  if (!o.noA) s = s.replace(/\bA(1[0-9]|[1-9])\b/g, function (m) { return tag(m, true); });
  return s.replace(/\u0001(\d+)\u0002/g, function (m, n) { return ph[n]; });
}
function slug(s) { return s.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function heading(lv, text, id) {
  text = text.replace(' — the centrepiece of this page', '').replace('Extra content that belongs inside the Promotions playbook only', 'Promotions in detail');
  var m = text.match(/^(\d\.\d|[A-E]\.)\s+(.*)$/), lab = '';
  if (m) { lab = '<span class="hn">' + m[1].replace(/\.$/, '') + '</span>'; text = m[2]; }
  return '<h' + lv + (id ? ' id="' + id + '"' : '') + '>' + lab + '<span>' + inline(text) + '</span></h' + lv + '>';
}
function md(src, o) {
  o = o || {}; o._ti = 0;
  var L = src.split('\n'), h = '', i = 0, m;
  while (i < L.length) {
    var l = L[i];
    if (!l.trim()) { i++; continue; }
    if (isT(l)) {
      var j = i; while (j < L.length && isT(L[j])) j++;
      var t = parseT(L.slice(i, j)), idx = o._ti++;
      h += (o.tbl && o.tbl[idx]) ? o.tbl[idx](t) : tableHtml(t);
      i = j; continue;
    }
    if ((m = l.match(/^(#{1,4}) (.*)$/))) { h += heading(m[1].length, m[2]); i++; continue; }
    if (/^---+$/.test(l.trim())) { i++; continue; }
    if (l[0] === '>') {
      var paras = [], cur = [];
      while (i < L.length && L[i][0] === '>') { var tx = L[i].replace(/^>\s?/, ''); if (!tx.trim()) { if (cur.length) paras.push(cur.join(' ')); cur = []; } else cur.push(tx); i++; }
      if (cur.length) paras.push(cur.join(' '));
      var cite = '';
      if (paras.length > 1 && paras[paras.length - 1].indexOf('—') === 0) cite = '<cite>' + inline(paras.pop()) + '</cite>';
      h += '<blockquote>' + paras.map(function (p) { return '<p>' + inline(p) + '</p>'; }).join('') + cite + '</blockquote>';
      continue;
    }
    if (/^- /.test(l)) {
      var items = []; while (i < L.length && /^- /.test(L[i])) { items.push(L[i].slice(2)); i++; }
      h += '<ul>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>'; continue;
    }
    if (l.indexOf('!! ') === 0) { h += '<aside class="callout">' + inline(l.slice(3)) + '</aside>'; i++; continue; }
    if (l.indexOf('~ ') === 0) { h += '<p class="quiet">' + inline(l.slice(2)) + '</p>'; i++; continue; }
    var buf = [l]; i++;
    while (i < L.length && L[i].trim() && !/^(#|>|- |\||!! |~ )/.test(L[i])) { buf.push(L[i]); i++; }
    h += '<p>' + buf.map(function (x, k) { return inline(x.replace(/\s+$/, '')) + (k < buf.length - 1 && / {2}$/.test(buf[k]) ? '<br>' : (k < buf.length - 1 ? ' ' : '')); }).join('') + '</p>';
  }
  return h;
}

/* ---------- blocks ---------- */
function splitBlocks(src) {
  var L = src.split('\n'), blocks = [], cur = { key: null, lines: [] };
  L.forEach(function (l) {
    if (/^### /.test(l)) {
      blocks.push(cur);
      var t = l.replace(/^### /, ''), m = t.match(/^(\d\.\d|[A-E]\.)\s/);
      cur = { key: m ? m[1].replace(/\.$/, '') : t.replace(/`.*$/, '').trim(), title: t, lines: [l] };
    } else cur.lines.push(l);
  });
  blocks.push(cur);
  return blocks.filter(function (b) { return b.lines.join('').trim(); }).map(function (b) {
    var id = b.key ? (/^(\d\.\d|[A-E])$/.test(b.key) ? 's-' + b.key.replace('.', '-') : 's-' + slug(b.key)) : null;
    return { key: b.key, title: b.title, id: id, text: b.lines.join('\n') };
  });
}
function hd(b) { return b.title ? heading(3, b.title, b.id) : ''; }
function afterHead(b) { return b.text.split('\n').slice(1).join('\n'); }
var BLOCKS = {};
function getBlock(mod, key) { return (BLOCKS[mod] || []).filter(function (b) { return b.key === key; })[0]; }

/* ---------- svg helpers ---------- */
function svg(w, h, inner, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '">' + inner + '</svg>'; }
function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
function pcol(n) { return 'var(--p' + n + ')'; }

/* ---------- hooks ---------- */
var HOOKS = {};
function H(mod, key, fn) { (HOOKS[mod] = HOOKS[mod] || {})[key] = fn; }

H('vision', 'Five pillars', function (b) {
  return hd(b) + md(afterHead(b), { tbl: { 0: function (t) {
    return '<div class="cards">' + t.rows.map(function (r) {
      return '<div class="card pill" style="--pc:' + pcol(r[0]) + '"><div class="big">' + r[0] + '</div><h5>' + inline(r[1]) + '</h5><p>' + inline(r[2]) + '</p></div>';
    }).join('') + '</div>'; } } });
});
H('vision', 'The numbers', function (b) {
  return hd(b) + md(afterHead(b), { tbl: { 0: function (t) {
    return '<div class="num3">' + t.rows.map(function (r) {
      return '<div class="card"><h5>' + inline(r[0]) + '</h5><div class="row"><span>' + t.head[1] + '</span><b>' + inline(r[1]) + '</b></div><div class="row"><span>' + t.head[2] + '</span><b>' + inline(r[2]) + '</b></div><div class="row"><span>' + t.head[3] + '</span><b>' + inline(r[3]) + '</b></div></div>';
    }).join('') + '</div>'; } } });
});

/* 1.1 sortable + filter */
H('analyse', '1.1', function (b) {
  var t = allTables(b.text)[0];
  return hd(b) + '<div class="btnrow" data-filter-for="t11">' +
    [['all', 'All eight'], ['lt70', 'SLA below 70%'], ['ge70', 'SLA 70% or more'], ['none', 'No SLA']].map(function (f, i) {
      return '<button class="btn' + (i ? '' : ' on') + '" data-act="filter" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') +
    '</div>' + tableHtml(t, { sort: true, id: 't11' });
});
/* 1.2 pareto */
H('analyse', '1.2', function (b) {
  var t = allTables(b.text)[0], rows = t.rows, W = 760, Hh = 360, pl = 46, pr = 46, pt = 20, pb = 110, iw = W - pl - pr, ih = Hh - pt - pb;
  var max = 200, bw = iw / rows.length, s = '';
  [0, 50, 100, 150, 200].forEach(function (v) { var y = pt + ih - v / max * ih; s += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>'; });
  [0, 25, 50, 75, 100].forEach(function (v) { var y = pt + ih - v / 100 * ih; s += '<text x="' + (W - pr + 6) + '" y="' + (y + 4) + '">' + v + '%</text>'; });
  var pts = [];
  rows.forEach(function (r, i) {
    var v = num(r[1]), x = pl + i * bw + bw * .18, w = bw * .64, y = pt + ih - v / max * ih;
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (pt + ih - y) + '" rx="2" fill="var(--p2)"><title>' + esc(r[0]) + ': ' + r[1] + ' late a month, ' + r[2] + ' of all late</title></rect>';
    s += '<text class="ink" x="' + (x + w / 2) + '" y="' + (y - 5) + '" text-anchor="middle" font-weight="600">' + v + '</text>';
    s += '<text x="' + (x + w / 2) + '" y="' + (pt + ih + 14) + '" text-anchor="end" transform="rotate(-35 ' + (x + w / 2) + ' ' + (pt + ih + 14) + ')">' + esc(r[0]) + '</text>';
    pts.push([x + w / 2, pt + ih - num(r[3]) / 100 * ih, r[3]]);
  });
  s += '<polyline fill="none" stroke="var(--p1)" stroke-width="2.5" points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '"/>';
  pts.forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="var(--p1)"/><text x="' + p[0] + '" y="' + (p[1] - 9) + '" text-anchor="middle" style="fill:var(--p1);font-weight:600">' + p[2] + '</text>'; });
  s += '<text x="' + pl + '" y="12">Late requests a month</text><text x="' + (W - pr) + '" y="12" text-anchor="end">Cumulative share</text>';
  var chart = '<div class="chart">' + svg(W, Hh, s, 'Late requests a month by process, ranked, with cumulative share') + '<div class="legend"><span><i style="background:var(--p2)"></i>Late requests a month</span><span><i style="background:var(--p1)"></i>Cumulative share of all late</span></div></div>';
  return hd(b) + chart + md(afterHead(b));
});
H('analyse', '1.3', function (b) {
  return hd(b) + md(afterHead(b), { tbl: { 0: function (t) {
    return '<div class="tiles">' + t.rows.map(function (r) { return '<div class="tile"><b>' + esc(r[1]) + '</b><span>' + esc(r[0]) + '</span></div>'; }).join('') + '</div>'; } } });
});
H('analyse', '1.4', function (b) {
  return hd(b) + md(afterHead(b), { tbl: { 0: function (t) {
    return '<div class="cards">' + t.rows.map(function (r) { return '<div class="card"><h5>' + inline(r[0]) + '</h5><p>' + inline(r[1]) + '</p></div>'; }).join('') + '</div>'; } } });
});

/* 1.5 chain */
var CH = null;
function chainSetup(b) {
  var tb = allTables(b.text);
  var F = tb[0].rows.map(function (r) { return { id: r[0], f: r[1], src: r[2], cause: r[3], pillar: r[4], fix: r[5] }; });
  var CA = tb[1].rows.map(function (r) { return { n: r[0], name: r[1], why: r[2] }; });
  var P = [1, 2, 3, 4, 5].map(function (n, i) {
    var name = F.filter(function (f) { return f.pillar[0] == n; })[0];
    return { n: n, name: name ? name.pillar.replace(/^\d /, '') : '', builds: tb[2 + i] ? tb[2 + i].rows : [] };
  });
  var m = b.text.match(/\*\*Source counts for the note line:\*\* (.*)/);
  CH = { F: F, CA: CA, P: P, counts: m ? m[1] : '', view: 1, sel: 'F01' };
}
function chainHtml() {
  var v = CH.view, sel = CH.F.filter(function (f) { return f.id === CH.sel; })[0], h = '';
  var steps = [['1', 'What was found', '31 findings, by source'], ['2', 'Why it happens', '6 causes'], ['3', 'What fixes it', '5 pillars, built once']];
  h += '<div class="steps">' + steps.map(function (s, i) { return (i ? '<span class="ar" aria-hidden="true">→</span>' : '') + '<button data-act="cview" data-v="' + s[0] + '" class="' + (v == s[0] ? 'on' : '') + '"><b>' + s[0] + ' ' + s[1] + '</b><span>' + s[2] + '</span></button>'; }).join('') + '</div>';
  function chip(f) {
    return '<button class="chip' + (f.id === CH.sel ? ' sel' : (sel && f.cause === sel.cause ? ' rel' : '')) + '" style="--pc:' + pcol(f.pillar[0]) + '" data-act="chip" data-id="' + f.id + '" aria-pressed="' + (f.id === CH.sel) + '"><b>' + f.id + '</b>' + esc(f.f) + '</button>';
  }
  var cols = '';
  if (v == 1) {
    var seen = []; CH.F.forEach(function (f) { if (seen.indexOf(f.src) < 0) seen.push(f.src); });
    seen.forEach(function (s) { var fs = CH.F.filter(function (f) { return f.src === s; }); cols += '<div class="col"><h5>' + esc(s) + ' <span class="code">(' + fs.length + ')</span></h5>' + fs.map(chip).join('') + '</div>'; });
  } else if (v == 2) {
    CH.CA.forEach(function (c) { var fs = CH.F.filter(function (f) { return f.cause[0] === c.n; }); cols += '<div class="col"><h5>' + c.n + ' ' + esc(c.name) + ' <span class="code">(' + fs.length + ')</span></h5><p class="why">' + esc(c.why) + '</p>' + fs.map(chip).join('') + '</div>'; });
  } else {
    CH.P.forEach(function (p) { var fs = CH.F.filter(function (f) { return f.pillar[0] == p.n; }); cols += '<div class="col" style="border-top:4px solid ' + pcol(p.n) + '"><h5>' + p.n + ' ' + esc(p.name) + ' <span class="code">(' + fs.length + ')</span></h5><p class="why">Builds once:</p><ul class="b">' + p.builds.map(function (r) { return '<li><strong>' + esc(r[0]) + '</strong>. ' + esc(r[1]) + '</li>'; }).join('') + '</ul>' + fs.map(chip).join('') + '</div>'; });
  }
  h += '<div class="cols">' + cols + '</div>';
  if (sel) {
    var ca = CH.CA.filter(function (c) { return c.n === sel.cause[0]; })[0];
    h += '<div class="detail"><div><small>Found · ' + esc(sel.id) + '</small><b>' + esc(sel.f) + '</b>' + esc(sel.src) + '</div><div><small>Why</small><b>' + esc(sel.cause) + '</b>' + esc(ca ? ca.why : '') + '</div><div style="border-top:4px solid ' + pcol(sel.pillar[0]) + '"><small>Fixed by · ' + esc(sel.pillar) + '</small><b>' + esc(sel.fix) + '</b></div></div>';
  }
  return h + '<p class="quiet">Source counts: ' + esc(CH.counts.replace(/\.$/, '')) + '. Tap a finding to follow it through the chain. The stripe on each finding is its pillar.</p>';
}
H('analyse', '1.5', function (b) {
  chainSetup(b);
  return hd(b) + '<p>31 findings from the brief reduce to 6 causes, which map to 5 pillars. Every later decision traces back to one of them.</p><div class="chain" id="chain">' + chainHtml() + '</div>';
});

/* 2.1 criteria + why */
H('prioritise', '2.1', function (b) {
  var lines = b.text.split('\n'), tabs = allTables(b.text);
  var whyI = lines.findIndex(function (l) { return l.indexOf('**Why these weights') === 0; });
  var head = lines.slice(0, tabs[1].start).join('\n');
  var why = lines.slice(whyI).join('\n').replace(/\*\*Robustness line:\*\*.*/, '');
  var intro = lines.slice(tabs[0].end, tabs[1].start).join('\n');
  return md(head) + '<details><summary>Why these weights</summary>' + md(why.replace('**Why these weights (expandable panel):**', '')) + '</details>';
});
/* 2.2 live matrix */
var PR = null;
function prioSetup() {
  var b21 = getBlock('prioritise', '2.1'), b22 = getBlock('prioritise', '2.2');
  var pres = allTables(b21.text)[1], sc = allTables(b22.text)[0];
  PR = {
    crit: sc.head.slice(2, 10),
    presets: pres.rows.map(function (r) { return { name: r[0], w: r.slice(1, 9).map(Number), desc: r[9] }; }),
    procs: sc.rows.map(function (r, i) { return { name: r[1], s: r.slice(2, 10).map(Number), i: i }; }),
    active: 0
  };
  PR.w = PR.presets[0].w.slice();
}
function prioScores(w) {
  var sum = w.reduce(function (a, c) { return a + c; }, 0);
  return PR.procs.map(function (p) { var t = 0; p.s.forEach(function (s, k) { t += s * w[k]; }); return { p: p, v: sum ? t / sum : 0 }; });
}
function prioRank(w) { return prioScores(w).sort(function (a, c) { return c.v - a.v || a.p.i - c.p.i; }); }
function prioMatrix() {
  var r = prioRank(PR.w), base = prioRank(PR.presets[0].w).map(function (x) { return x.p.name; });
  var h = '<div class="tw"><table class="heat"><thead><tr><th>Rank</th><th>Process</th>' + PR.crit.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '<th>Score /5</th></tr></thead><tbody>';
  r.forEach(function (x, i) {
    var d = base.indexOf(x.p.name) - i, dl = d ? '<span class="delta ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + Math.abs(d) + '</span>' : '';
    h += '<tr data-act="wkrow" data-name="' + esc(x.p.name) + '"><td>' + (i + 1) + dl + '</td><td>' + esc(x.p.name) + '</td>' + x.p.s.map(function (s) { return '<td class="h" style="--s:' + s + '">' + s + '</td>'; }).join('') + '<td><strong>' + x.v.toFixed(2) + '</strong></td></tr>';
  });
  h += '</tbody></table></div>';
  var tops = PR.presets.map(function (p) { return prioRank(p.w)[0].p.name; }), k = tops.filter(function (n) { return n === tops[0]; }).length;
  h += '<p><strong>' + esc(tops[0]) + '</strong> ranks first under ' + k + ' of ' + tops.length + ' weightings tested.</p>';
  return h;
}
function prioSum() { var s = PR.w.reduce(function (a, c) { return a + c; }, 0); return 'Weights total ' + fmt(s) + (Math.abs(s - 100) > .05 ? ' (scores are normalised to 5)' : '') + '. ' + esc(PR.presets[PR.active] ? PR.presets[PR.active].desc : ''); }
H('prioritise', '2.2', function (b) {
  prioSetup();
  var h = hd(b) + '<p>Click a row to open its working. Change the weights to test the order.</p><div class="btnrow" id="presets">' +
    PR.presets.map(function (p, i) { return '<button class="btn' + (i ? '' : ' on') + '" data-act="preset" data-i="' + i + '">' + esc(p.name) + '</button>'; }).join('') + '</div>' +
    '<div class="sl" id="sliders">' + PR.crit.map(function (c, i) { return '<label>' + '<span>' + esc(c) + '<b id="wv' + i + '">' + fmt(PR.w[i]) + '</b></span><input type="range" min="0" max="40" step="0.5" value="' + PR.w[i] + '" data-w="' + i + '" aria-label="Weight for ' + esc(c) + '"></label>'; }).join('') + '</div>' +
    '<p class="quiet" id="wsum">' + prioSum() + '</p><div id="matrix">' + prioMatrix() + '</div>';
  return h;
});
/* 2.3 working tabs */
H('prioritise', '2.3', function (b) {
  var L = b.text.split('\n'), segs = [], cur = null;
  L.forEach(function (l, i) { if (/^\*\*\d\. .* — [\d.]+\*\*$/.test(l)) { cur = { title: l.replace(/\*\*/g, ''), lines: [] }; segs.push(cur); } else if (cur) cur.lines.push(l); });
  var pre = L.slice(1, L.findIndex(function (l) { return /^\*\*\d\. /.test(l); })).join('\n');
  return hd(b) + md(pre) + '<div data-tabs id="wk"><div class="tabbar">' + segs.map(function (s, i) { return '<button data-act="tab" data-i="' + i + '" class="' + (i ? '' : 'on') + '">' + esc(s.title) + '</button>'; }).join('') + '</div>' +
    segs.map(function (s, i) { return '<div class="tabpanel' + (i ? '' : ' on') + '" data-name="' + esc(s.title.replace(/^\d\. /, '').replace(/ — .*$/, '')) + '"><h4>' + esc(s.title) + '</h4>' + md(s.lines.join('\n')) + '</div>'; }).join('') + '</div>';
});
/* 2.4 scatter */
H('prioritise', '2.4', function (b) {
  var t = allTables(b.text)[0], W = 640, Hh = 460, pl = 54, pb = 46, pt = 16, pr = 20, iw = W - pl - pr, ih = Hh - pt - pb;
  function X(e) { return pl + (e - 1) / 4.4 * iw; } function Y(v) { return pt + ih - (v - 1.8) / 3.2 * ih; }
  var s = '<rect x="' + X(3) + '" y="' + pt + '" width="' + (W - pr - X(3)) + '" height="' + (Y(3.5) - pt) + '" fill="var(--soft)"/><text x="' + (X(3) + 8) + '" y="' + (pt + 16) + '" style="fill:var(--accent);font-weight:600">Start here: high value, easy</text>';
  [2, 3, 4, 5].forEach(function (v) { s += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (pl - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; });
  [1, 2, 3, 4, 5].forEach(function (e) { s += '<line class="grid" y1="' + pt + '" y2="' + (pt + ih) + '" x1="' + X(e) + '" x2="' + X(e) + '"/><text x="' + X(e) + '" y="' + (pt + ih + 18) + '" text-anchor="middle">' + e + '</text>'; });
  s += '<text x="' + (pl + iw / 2) + '" y="' + (Hh - 6) + '" text-anchor="middle">Ease (digital potential + feasibility)</text><text transform="rotate(-90 14 ' + (pt + ih / 2) + ')" x="14" y="' + (pt + ih / 2) + '" text-anchor="middle">Value</text>';
  t.rows.forEach(function (r, i) {
    var e = num(r[2]), v = num(r[1]), cx = X(e), cy = Y(v), left = e > 4.5;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="' + (i === 0 ? 'var(--p2)' : 'var(--p1)') + '" opacity=".9"><title>' + esc(r[0]) + ': value ' + r[1] + ', ease ' + r[2] + '</title></circle><text class="ink" x="' + (left ? cx - 12 : cx + 12) + '" y="' + (cy + 4) + '" text-anchor="' + (left ? 'end' : 'start') + '">' + esc(r[0]) + '</text>';
  });
  return hd(b) + '<div class="chart small">' + svg(W, Hh, s, 'Scatter of value versus ease for eight processes') + '</div>' + md(afterHead(b));
});

/* 3.1 periods */
H('timeline', '3.1', function (b) {
  var L = b.text.split('\n'), tabs = allTables(b.text), per = tabs[0].rows;
  var idx = []; L.forEach(function (l, i) { if (/ — what the money buys\*\*$/.test(l)) idx.push(i); });
  var total = L.filter(function (l) { return l.indexOf('**Total check:**') === 0; })[0];
  var cards = per.map(function (r, i) {
    return '<button data-act="tab" data-i="' + i + '" class="' + (i ? '' : 'on') + '"><span class="k">' + esc(r[1]) + '</span><span class="m">' + esc(r[3]) + '</span><span class="t"><strong>' + esc(r[0]) + '</strong> · ' + esc(r[2]) + '</span></button>';
  }).join('');
  var panels = per.map(function (r, i) {
    var st = idx[i], tb = tabs.filter(function (t) { return t.start > st && (i + 1 >= idx.length || t.start < idx[i + 1]); })[0];
    return '<div class="tabpanel' + (i ? '' : ' on') + '"><h4>' + esc(r[0]) + ' · ' + esc(r[1]) + ': what the money buys</h4><p><strong>Goal.</strong> ' + inline(r[4]) + '</p>' + (tb ? tableHtml(tb) : '') + '</div>';
  }).join('');
  return hd(b) + '<p>Select a period to see what its money buys.</p><div data-tabs><div class="tabbar cards">' + cards + '</div>' + panels + '</div>' + (total ? md(total) : '');
});
/* 3.3 gantt */
H('timeline', '3.3', function (b) {
  var t = allTables(b.text)[0], W = 52, mk = [], re = /([A-Z]\d+(?: reserve release)?) \(week (\d+)\)/g, m;
  while ((m = re.exec(b.text))) mk.push({ l: m[1], full: m[0], w: +m[2], c: 'var(--r' + (mk.length + 1) + ')' });
  function rng(s) { var x = s.match(/(\d+)\s*[–-]\s*(\d+)/); return x ? [+x[1], +x[2]] : null; }
  function marks(head) { return mk.map(function (k, i) { var left = (k.w / W * 100).toFixed(3); return head ? '<span class="mkl' + '" style="left:' + left + '%;--c:' + k.c + ';top:' + (i % 2 ? 22 : 4) + 'px" title="' + esc(k.full) + '">' + esc(k.l.replace(' reserve release', '')) + '</span>' : '<i class="mk" style="left:' + left + '%;--c:' + k.c + '"></i>'; }).join(''); }
  var h = '<div class="chart"><div class="gantt"><div class="g-row g-head"><div class="g-label"></div><div class="g-track">' + marks(true) + '</div></div>';
  t.rows.forEach(function (r) {
    var seg = '';
    [[1, 'd', 'design or diagnose'], [2, 'b', 'build and pilot'], [3, 'l', 'live and run']].forEach(function (s) {
      var g = rng(r[s[0]]); if (g) seg += '<span class="seg ' + s[1] + '" style="left:' + ((g[0] - 1) / W * 100).toFixed(3) + '%;width:' + ((g[1] - g[0] + 1) / W * 100).toFixed(3) + '%" title="' + esc(r[0]) + ': ' + s[2] + ', weeks ' + g[0] + '–' + g[1] + '"></span>';
    });
    (r[4].match(/W(\d+)/g) || []).forEach(function (w) { var n = +w.slice(1); seg += '<span class="cyc" style="left:' + ((n - .5) / W * 100).toFixed(3) + '%" title="Promotion cycle announced, week ' + n + '"></span>'; });
    h += '<div class="g-row"><div class="g-label">' + inline(r[0]) + '</div><div class="g-track">' + marks(false) + seg + '</div></div>';
  });
  h += '</div><div class="legend"><span><i style="background:repeating-linear-gradient(45deg,var(--line) 0 3px,transparent 3px 6px);border:1px solid var(--mut)"></i>Design or diagnose</span><span><i style="background:var(--p2)"></i>Build and pilot</span><span><i style="background:var(--p1)"></i>Live and run</span><span><i style="background:var(--p4);transform:rotate(45deg) scale(.8)"></i>Promotion cycle announced</span>' + mk.map(function (k) { return '<span><i style="background:' + k.c + ';width:3px"></i>' + esc(k.full) + '</span>'; }).join('') + '</div></div>';
  var pre = afterHead(b).split('\n'), cut = pre.findIndex(isT);
  return hd(b) + md(pre.slice(0, cut).join('\n')) + h + '<details><summary>The data behind the chart</summary>' + tableHtml(t) + '</details>';
});
/* 3.4 money */
H('timeline', '3.4', function (b) {
  var tabs = allTables(b.text), t = tabs.filter(function (x) { return x.rows[0] && x.head[0] === 'Pillar' && x.head.length > 10; })[0];
  var W = 760, Hh = 320, pl = 40, pb = 30, pt = 24, pr = 10, iw = W - pl - pr, ih = Hh - pt - pb, max = 8, n = 13, bw = iw / n, s = '';
  [0, 2, 4, 6, 8].forEach(function (v) { var y = pt + ih - v / max * ih; s += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>'; });
  var order = [0, 1, 2, 3, 4];
  for (var w = 0; w < n; w++) {
    var acc = 0, x = pl + w * bw + bw * .15;
    t.rows.forEach(function (r) { var v = +r[w + 1], pn = +r[0][0]; if (!v) return; var y1 = pt + ih - (acc + v) / max * ih, hh = v / max * ih; s += '<rect x="' + x + '" y="' + y1 + '" width="' + bw * .7 + '" height="' + hh + '" fill="' + pcol(pn) + '"><title>W' + (w + 1) + ' · ' + esc(r[0]) + ': $' + v + 'K</title></rect>'; acc += v; });
    s += '<text class="ink" x="' + (x + bw * .35) + '" y="' + (pt + ih - acc / max * ih - 5) + '" text-anchor="middle" font-weight="600">' + acc + '</text><text x="' + (x + bw * .35) + '" y="' + (pt + ih + 16) + '" text-anchor="middle">W' + (w + 1) + '</text>';
  }
  s += '<text x="' + pl + '" y="12">$K a week</text>';
  var names = {}; t.rows.forEach(function (r) { names[r[0][0]] = r[0]; });
  var leg = '<div class="legend">' + Object.keys(names).sort().map(function (k) { return '<span><i style="background:' + pcol(k) + '"></i>' + esc(names[k]) + '</span>'; }).join('') + '</div>';
  var body = afterHead(b).split('\n').filter(function (l) { return l.indexOf('**Weekly spend') !== 0; });
  var tb = allTables(body.join('\n'));
  var skip = body.slice(0); // remove the weekly stacked table from the printed tables
  var wt = tb.filter(function (x) { return x.head.length > 10; })[0];
  if (wt) skip.splice(wt.start, wt.end - wt.start);
  return hd(b) + '<div class="chart">' + svg(W, Hh, s, 'Weekly spend by pillar, weeks 1 to 13, in thousands of dollars') + leg + '</div>' + md(skip.join('\n').replace('Per pillar per week ($K):', ''));
});

/* 4.1 week by week */
function checkTable(t, prefix) {
  var h = '<div class="tw"><table class="chk"><thead><tr><th>Done</th>' + t.head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
  t.rows.forEach(function (r, i) {
    var key = 'pops:' + prefix + i, on = store(key) === '1';
    h += '<tr class="' + (on ? 'done' : '') + '"><td><input type="checkbox" data-act="chk" data-k="' + key + '" aria-label="Mark done"' + (on ? ' checked' : '') + '></td>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
  });
  return h + '</tbody></table></div>';
}
H('execute', '4.1', function (b) {
  var L = b.text.split('\n'), si = L.findIndex(function (l) { return l.indexOf('**Stream ') === 0; }), ni = L.findIndex(function (l) { return l.indexOf('**Note under the plan') === 0; });
  var headTxt = L.slice(1, si).join('\n'), tb = allTables(headTxt);
  var cut = headTxt.split('\n'), gi = cut.findIndex(function (l) { return l.indexOf('**Gates:**') === 0; });
  var pre = cut.slice(0, gi).join('\n');
  var out = hd(b) + md(pre) + '<h4>Gates</h4>' + checkTable(tb[0], 'gate') + '<h4>Milestones</h4>' + checkTable(tb[1], 'ms') + '<p class="quiet">Tick as you go. Ticks stay in this browser.</p><h4>The eight streams and every task</h4>';
  var segs = [], cur = null;
  L.slice(si, ni).forEach(function (l) { if (l.indexOf('**Stream ') === 0) { cur = { head: l, lines: [] }; segs.push(cur); } else if (cur) cur.lines.push(l); });
  segs.forEach(function (s, i) {
    var m = s.head.match(/^\*\*(.+?)\*\*\s*·\s*(.*?)\s*$/);
    out += '<details class="stream"' + (i < 2 ? ' open' : '') + '><summary>' + inline(m[1]) + '<small>' + inline(m[2]) + '</small></summary>' + md(s.lines.join('\n')) + '</details>';
  });
  return out + md(L.slice(ni).join('\n'));
});
/* 4.3 playbooks */
H('execute', '4.3', function (b) {
  var L = b.text.split('\n'), segs = [], cur = null, pre = [];
  L.slice(1).forEach(function (l) { if (/^#### /.test(l)) { cur = { title: l.replace(/^#### /, ''), lines: [] }; segs.push(cur); } else if (cur) cur.lines.push(l); else pre.push(l); });
  var extra = segs.pop(), note = '';
  var last = segs[segs.length - 1], ni = last.lines.findIndex(function (l) { return l.indexOf('**Note under every targets table') === 0; });
  if (ni > -1) { note = last.lines.slice(ni).join('\n'); last.lines = last.lines.slice(0, ni); }
  var ex = extra.lines.join('\n').replace(' Toggle between the two.', '');
  var h = hd(b) + md(pre.join('\n')) + '<div data-tabs id="pb"><div class="tabbar">' + segs.map(function (s, i) { return '<button data-act="tab" data-i="' + i + '" class="' + (i ? '' : 'on') + '">' + esc(s.title) + '</button>'; }).join('') + '</div>';
  segs.forEach(function (s, i) {
    h += '<div class="tabpanel' + (i ? '' : ' on') + '"><h4>' + esc(s.title) + '</h4>' + md(s.lines.join('\n')) + (s.title === 'Promotions' ? '<h4>Promotions in detail</h4>' + md(ex) : '') + '</div>';
  });
  return h + '</div>' + md(note);
});
/* 4.5 KPIs */
function spark(name, labels, vals) {
  var W = 320, Hh = 170, pl = 34, pr = 26, pt = 22, pb = 28, iw = W - pl - pr, ih = Hh - pt - pb;
  var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), pad = (mx - mn) * .15 || 1; mn = Math.floor(mn - pad); mx = Math.ceil(mx + pad); if (mn < 0 && Math.min.apply(null, vals) >= 0) mn = 0;
  function X(i) { return pl + i / (vals.length - 1) * iw; } function Y(v) { return pt + ih - (v - mn) / (mx - mn) * ih; }
  var s = '';
  [mn, (mn + mx) / 2, mx].forEach(function (v) { s += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (pl - 5) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + fmt(v) + '</text>'; });
  s += '<polyline fill="none" stroke="var(--p1)" stroke-width="2.2" stroke-dasharray="2 5" stroke-linecap="round" points="' + vals.map(function (v, i) { return X(i) + ',' + Y(v); }).join(' ') + '"/>';
  vals.forEach(function (v, i) {
    var key = i >= 3;
    s += '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="' + (key ? 5 : 3) + '" fill="' + (key ? 'var(--p1)' : 'var(--surface)') + '" stroke="var(--p1)" stroke-width="1.5"><title>' + esc(labels[i]) + ': ' + v + '</title></circle>';
    if (i === 0 || key) s += '<text class="ink" x="' + X(i) + '" y="' + (Y(v) - 9) + '" text-anchor="middle" font-weight="600">' + v + '</text>';
    s += '<text x="' + X(i) + '" y="' + (Hh - 8) + '" text-anchor="middle">' + esc(labels[i].replace('Day ', 'D').replace('Month ', 'M')) + '</text>';
  });
  return svg(W, Hh, s, name + ' from today to month 12');
}
H('execute', '4.5', function (b) {
  var L = b.text.split('\n'), cards = '', rest = [], i = 1;
  while (i < L.length) {
    var m = L[i].match(/^\*\*(.+?)\*\* \((\w+), source `(\w)`\) — (.*)$/);
    if (m) {
      var j = i + 1; while (j < L.length && !isT(L[j])) j++;
      var k = j; while (k < L.length && isT(L[k])) k++;
      var t = parseT(L.slice(j, k)), vals = t.rows[0].map(Number);
      cards += '<div class="kcard"><p class="kt">' + m[2] + ' · source ' + tag(m[3]) + '</p><h5>' + inline(m[1]) + '</h5>' + spark(m[1], t.head, vals) + '<p class="kd">' + inline(m[4]) + '</p></div>';
      i = k;
    } else { rest.push(L[i]); i++; }
  }
  var r = rest.join('\n'), first = r.split('\n').findIndex(function (l) { return l.trim(); });
  return hd(b) + md(r.split('\n').slice(first, first + 1).join('\n')) + '<div class="kgrid">' + cards + '</div>' + md(r.split('\n').slice(first + 1).join('\n'));
});

/* 5.3 capacity */
H('after', '5.3', function (b) {
  var tabs = allTables(b.text), t = tabs[1], plan = t.rows[0].slice(1).map(function (x) { return num(x); }), low = t.rows[1].slice(1).map(function (x) { return num(x); });
  var W = 700, Hh = 340, pl = 44, pr = 60, pt = 20, pb = 36, iw = W - pl - pr, ih = Hh - pt - pb, max = 30;
  function X(m) { return pl + (m - 1) / 11 * iw; } function Y(v) { return pt + ih - v / max * ih; }
  var s = '';
  [0, 10, 20, 30].forEach(function (v) { s += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (pl - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '%</text>'; });
  var up = plan.map(function (v, i) { return X(i + 1) + ',' + Y(v); }), dn = low.map(function (v, i) { return X(i + 1) + ',' + Y(v); }).reverse();
  s += '<polygon points="' + up.concat(dn).join(' ') + '" fill="var(--p1)" opacity=".15"/>';
  s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(25.9) + '" y2="' + Y(25.9) + '" stroke="var(--p2)" stroke-width="2" stroke-dasharray="6 4"/><text x="' + (W - pr + 4) + '" y="' + (Y(25.9) + 4) + '" style="fill:var(--p2);font-weight:600">Need 25.9%</text>';
  s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(12) + '" y2="' + Y(12) + '" stroke="var(--p4)" stroke-width="1.5" stroke-dasharray="2 4"/><text x="' + (W - pr + 4) + '" y="' + (Y(12) + 4) + '" style="fill:var(--p4);font-weight:600">Review 12%</text>';
  s += '<polyline fill="none" stroke="var(--p1)" stroke-width="2.5" points="' + up.join(' ') + '"/><polyline fill="none" stroke="var(--p1)" stroke-width="2" stroke-dasharray="6 4" points="' + dn.slice().reverse().join(' ') + '"/>';
  [3, 6, 12].forEach(function (m) {
    s += '<circle cx="' + X(m) + '" cy="' + Y(plan[m - 1]) + '" r="5" fill="var(--p1)"/><text class="ink" x="' + X(m) + '" y="' + (Y(plan[m - 1]) - 9) + '" text-anchor="middle" font-weight="600">' + plan[m - 1] + '%</text>';
    s += '<circle cx="' + X(m) + '" cy="' + Y(low[m - 1]) + '" r="5" fill="var(--surface)" stroke="var(--p1)" stroke-width="2"/><text class="ink" x="' + X(m) + '" y="' + (Y(low[m - 1]) + 18) + '" text-anchor="middle" font-weight="600">' + low[m - 1] + '%</text>';
  });
  for (var m = 1; m <= 12; m++) s += '<text x="' + X(m) + '" y="' + (Hh - 10) + '" text-anchor="middle">M' + m + '</text>';
  var chart = '<div class="chart">' + svg(W, Hh, s, 'Capacity released: plan case and low case against growth need') + '<div class="legend"><span><i style="background:var(--p1)"></i>Plan case</span><span><i style="background:var(--p1);opacity:.4"></i>Low case (dashed)</span><span><i style="background:var(--p2)"></i>Growth need</span><span><i style="background:var(--p4)"></i>Review threshold</span></div></div>';
  return hd(b) + chart + md(afterHead(b));
});

/* ---------- build ---------- */
function buildAssume() {
  var t = allTables(C.appendix)[0];
  t.rows.forEach(function (r) { ASSUME[r[0]] = { topic: r[1], text: r[2] }; });
}
function renderModule(mod, idx) {
  var blocks = splitBlocks(C[mod.id]); BLOCKS[mod.id] = blocks;
  return blocks;
}
function buildModule(mod, idx) {
  var blocks = BLOCKS[mod.id], hooks = HOOKS[mod.id] || {}, tail = '', h = '';
  var subs = blocks.filter(function (b) { return b.id; }).map(function (b) { var t = b.title.replace(/`.*$/, '').replace(' — the centrepiece of this page', '').replace(/\s*\(three working principles\)/, '').trim(); return '<a href="#' + mod.id + '/' + b.id.slice(2) + '">' + esc(t) + '</a>'; }).join('');
  h += '<header class="mh"><p class="eyebrow">' + (mod.n ? 'Module ' + mod.n : mod.label) + '</p>';
  if (mod.id !== 'vision') h += '<h1>' + esc(mod.label) + '</h1><p class="lede">' + esc(mod.job) + '</p>';
  h += (subs ? '<nav class="subnav" aria-label="In this module">' + subs + '</nav>' : '') + '</header>';
  blocks.forEach(function (b) {
    var out;
    if (b.key && hooks[b.key]) out = hooks[b.key](b);
    else out = md(b.text);
    if (mod.id === 'govern' && b.key === '6.4') {
      var q = out.match(/<blockquote>[\s\S]*<\/blockquote>/);
      if (q) { tail = q[0]; out = out.replace(q[0], ''); }
    }
    if (b.id && !hooks[b.key] && !/id=/.test(out.slice(0, 40))) out = out.replace(/^<h3/, '<h3 id="' + b.id + '"');
    h += '<section class="sec">' + out + '</section>';
    if (mod.id === 'vision' && !b.key) h += '<p class="legend"><span><strong>G</strong> given in the brief</span><span><strong>D</strong> derived by arithmetic</span><span><strong>A1–A19</strong> numbered assumption: hover or tap any marker</span></p>';
  });
  h += tail;
  var p = MODS[idx - 1], n = MODS[idx + 1];
  h += '<nav class="pn" aria-label="Previous and next">' + (p ? '<a href="#' + p.id + '"><small>Previous</small><b>← ' + esc(p.label) + '</b></a>' : '<span></span>') + (n ? '<a class="nx" href="#' + n.id + '"><small>Next</small><b>' + esc(n.label) + ' →</b></a>' : '') + '</nav>';
  return '<section class="mod" id="mod-' + mod.id + '" hidden>' + h + '</section>';
}

/* ---------- interaction ---------- */
var tip;
function showTip(el) {
  var k = el.getAttribute('data-k'), t;
  if (k === 'G') t = '<strong>G</strong> · Given in the brief, unchanged.';
  else if (k === 'D') t = '<strong>D</strong> · Derived from given data by arithmetic shown in the appendix.';
  else { var a = ASSUME[k]; t = a ? '<strong>' + k + ' · ' + esc(a.topic) + '</strong><br>' + inline(a.text, { noA: true }) : k; }
  tip.innerHTML = t; tip.hidden = false;
  var r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  var x = Math.max(8, Math.min(r.left, window.innerWidth - tw - 8)), y = r.bottom + 8;
  if (y + th > window.innerHeight - 8) y = Math.max(8, r.top - th - 8);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { tip.hidden = true; }
function selectWorking(name) {
  var w = $('#wk'); if (!w) return;
  var ps = $$(':scope > .tabpanel', w), i = ps.findIndex(function (p) { return p.getAttribute('data-name') === name; });
  if (i < 0) return;
  setTab(w, i);
  w.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function setTab(c, i) {
  $$(':scope > .tabbar > button', c).forEach(function (b, k) { b.classList.toggle('on', k === i); });
  $$(':scope > .tabpanel', c).forEach(function (p, k) { p.classList.toggle('on', k === i); });
}
function sortTable(th) {
  var table = th.closest('table'), i = +th.getAttribute('data-sort'), asc = th.getAttribute('data-dir') !== 'asc';
  $$('th', table).forEach(function (x) { x.removeAttribute('data-dir'); }); th.setAttribute('data-dir', asc ? 'asc' : 'desc');
  var body = $('tbody', table), rows = $$('tr', body);
  function val(r) { var c = r.children[i].textContent; var n = num(c); return (n === null || /not reported/i.test(c)) ? (/not reported/i.test(c) ? -1 : c.toLowerCase()) : n; }
  rows.sort(function (a, b) { var x = val(a), y = val(b); var d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y)); return asc ? d : -d; });
  rows.forEach(function (r) { body.appendChild(r); });
}
function filterTable(btn) {
  var f = btn.getAttribute('data-f');
  $$('.btn', btn.parentNode).forEach(function (b) { b.classList.toggle('on', b === btn); });
  $$('#t11 tbody tr').forEach(function (r) {
    var c = r.children[3].textContent, n = /not reported/i.test(c) ? null : num(c);
    var show = f === 'all' || (f === 'lt70' && n !== null && n < 70) || (f === 'ge70' && n !== null && n >= 70) || (f === 'none' && n === null);
    r.hidden = !show;
  });
}
function setPreset(i) {
  PR.active = i; PR.w = PR.presets[i].w.slice();
  $$('#presets .btn').forEach(function (b, k) { b.classList.toggle('on', k === i); });
  $$('#sliders input').forEach(function (inp, k) { inp.value = PR.w[k]; $('#wv' + k).textContent = fmt(PR.w[k]); });
  refreshPrio();
}
function refreshPrio() { $('#matrix').innerHTML = prioMatrix(); $('#wsum').innerHTML = prioSum(); }

function onClick(e) {
  var t = e.target.closest('[data-act]');
  if (t) {
    var a = t.getAttribute('data-act');
    if (a === 'tab') setTab(t.closest('[data-tabs]'), +t.getAttribute('data-i'));
    else if (a === 'filter') filterTable(t);
    else if (a === 'cview') { CH.view = +t.getAttribute('data-v'); $('#chain').innerHTML = chainHtml(); }
    else if (a === 'chip') { CH.sel = t.getAttribute('data-id'); var sc = $('.cols', $('#chain')).scrollLeft; $('#chain').innerHTML = chainHtml(); $('.cols', $('#chain')).scrollLeft = sc; }
    else if (a === 'preset') setPreset(+t.getAttribute('data-i'));
    else if (a === 'wkrow') selectWorking(t.getAttribute('data-name'));
    return;
  }
  var th = e.target.closest('th[data-sort]'); if (th) { sortTable(th); return; }
  var k = e.target.closest('[data-k]');
  if (k) { if (tip.hidden || tip._for !== k) { showTip(k); tip._for = k; } else { hideTip(); tip._for = null; } }
  else { hideTip(); tip._for = null; }
}
function onInput(e) {
  var t = e.target;
  if (t.hasAttribute && t.hasAttribute('data-w')) {
    var i = +t.getAttribute('data-w'); PR.w[i] = +t.value; $('#wv' + i).textContent = fmt(PR.w[i]);
    $$('#presets .btn').forEach(function (b) { b.classList.remove('on'); }); PR.active = -1;
    refreshPrio();
  }
}
function onChange(e) {
  var t = e.target;
  if (t.getAttribute && t.getAttribute('data-act') === 'chk') { store(t.getAttribute('data-k'), t.checked ? '1' : '0'); t.closest('tr').classList.toggle('done', t.checked); }
}

/* ---------- routing, theme ---------- */
var current = null;
function show(id, sub) {
  MODS.forEach(function (m) { var el = $('#mod-' + m.id); if (el) el.hidden = m.id !== id; });
  $$('.tabs a').forEach(function (a) { if (a.getAttribute('data-id') === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  var m = MODS.filter(function (x) { return x.id === id; })[0];
  document.title = (id === 'vision' ? 'People Operations Excellence' : m.label + ' · People Operations Excellence') + ' · XYZ Company';
  if (sub && $('#s-' + sub)) $('#s-' + sub).scrollIntoView(); else if (current !== id || !sub) window.scrollTo(0, 0);
  current = id; hideTip();
}
function route() {
  var parts = location.hash.slice(1).split('/'), id = MODS.some(function (m) { return m.id === parts[0]; }) ? parts[0] : 'vision';
  show(id, parts[1]);
}
function setTheme(t) { document.documentElement.setAttribute('data-theme', t); var b = $('#theme'); if (b) b.textContent = t === 'dark' ? 'Light' : 'Dark'; }

function init() {
  buildAssume();
  MODS.forEach(renderModule);
  var nav = MODS.map(function (m) { return '<a href="#' + m.id + '" data-id="' + m.id + '">' + (m.n ? '<span class="n">' + m.n + '</span>' : '') + esc(m.nav || m.label) + '</a>'; }).join('');
  var html = '<div class="top"><div class="top-in"><a class="brand" href="#vision">Qadr Arslan <span>· People Operations Excellence · XYZ Company</span></a><nav class="tabs" aria-label="Modules">' + nav + '</nav><button id="theme" type="button" aria-label="Toggle light and dark theme">Dark</button></div></div><main>' +
    MODS.map(function (m, i) { return buildModule(m, i); }).join('') + '</main><footer>Qadr Arslan · People Operations Excellence · XYZ Company. Every figure is tagged: <strong>G</strong> given in the brief, <strong>D</strong> derived, <strong>A1–A19</strong> a numbered assumption. Tools named in the appendix are examples only.</footer><div id="tip" role="tooltip" hidden></div>';
  document.getElementById('app').innerHTML = html;
  tip = $('#tip');
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('mouseover', function (e) { var k = e.target.closest && e.target.closest('[data-k]'); if (k) { showTip(k); tip._for = k; } });
  document.addEventListener('mouseout', function (e) { var k = e.target.closest && e.target.closest('[data-k]'); if (k) { hideTip(); tip._for = null; } });
  document.addEventListener('focusin', function (e) { var k = e.target.closest && e.target.closest('[data-k]'); if (k) showTip(k); });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
  $('#theme').addEventListener('click', function () { var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; setTheme(t); store('pops:theme', t); });
  var saved = store('pops:theme'), mq = window.matchMedia('(prefers-color-scheme: dark)');
  setTheme(saved || (mq.matches ? 'dark' : 'light'));
  if (mq.addEventListener) mq.addEventListener('change', function (e) { if (!store('pops:theme')) setTheme(e.matches ? 'dark' : 'light'); });
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeprint', function () { $$('.mod').forEach(function (m) { m.hidden = false; }); $$('details').forEach(function (d) { d.setAttribute('open', ''); }); });
  window.addEventListener('afterprint', route);
  route();
}
init();
})();
