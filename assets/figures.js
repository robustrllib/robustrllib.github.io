/* The two result figures of the project page that are drawn in the page rather than
   embedded as images: the mechanism-family gains with the decay curves, and the Isaac
   Lab scatters with the VLA retention ladders. Plain SVG from the JSON that
   sync_landing.py writes into the page from data/figures/*.json. Each figure draws
   itself in once it scrolls into view: columns grow from the baseline, lines run from
   left to right, markers settle in. Colours and layout follow the paper's figures. */
(function () {
  "use strict";
  var node = document.getElementById("figures-data");
  if (!node) { return; }
  var DATA;
  try { DATA = JSON.parse(node.textContent); } catch (e) { return; }
  var NS = "http://www.w3.org/2000/svg";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif";

  function sv(tag, attrs, children) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") { n.textContent = attrs[k]; } else { n.setAttribute(k, attrs[k]); }
    });
    (children || []).forEach(function (c) { if (c) { n.appendChild(c); } });
    return n;
  }
  function text(x, y, s, attrs) {
    var a = { x: x, y: y, text: s, "font-family": FONT, "font-size": 12, fill: "#202428" };
    Object.keys(attrs || {}).forEach(function (k) { a[k] = attrs[k]; });
    return sv("text", a);
  }
  function fmt(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
  function scale(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
  function delay(el, s) { el.style.transitionDelay = s + "s"; el.style.animationDelay = s + "s"; return el; }
  function ticks(lo, hi, step) { var out = []; for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) { out.push(Math.round(v * 1e6) / 1e6); } return out; }
  function marker(kind, cx, cy, r) {
    var pts, k;
    if (kind === "s") { return sv("rect", { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r }); }
    if (kind === "o") { return sv("circle", { cx: cx, cy: cy, r: r }); }
    if (kind === "^") { pts = [[cx, cy - r * 1.15], [cx - r * 1.1, cy + r * 0.8], [cx + r * 1.1, cy + r * 0.8]]; }
    else if (kind === "D") { pts = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]; }
    else if (kind === "p") { pts = []; for (k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * 2 * Math.PI / 5; pts.push([cx + r * 1.05 * Math.cos(a), cy + r * 1.05 * Math.sin(a)]); } }
    else { pts = []; for (k = 0; k < 10; k++) { var b = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.5 : r * 1.25; pts.push([cx + rr * Math.cos(b), cy + rr * Math.sin(b)]); } }
    return sv("polygon", { points: pts.map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" ") });
  }
  function frameAxes(g, x0, x1, y0, y1, color) {
    g.appendChild(sv("line", { x1: x0, y1: y0, x2: x0, y2: y1, stroke: color, "stroke-width": 1.1 }));
    g.appendChild(sv("line", { x1: x0, y1: y1, x2: x1, y2: y1, stroke: color, "stroke-width": 1.1 }));
  }
  function arm(root, id, draw, fallback) {
    var host = document.getElementById(id);
    if (!host) { return; }
    var svg = draw();
    svg.classList.add("fig-svg");
    host.replaceChildren(svg);
    if (reduced || !window.IntersectionObserver) { svg.classList.add("is-on"); return; }
    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { svg.classList.add("is-on"); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(svg);
  }

  // ================================================== gains by family, decay by magnitude
  function gainDecay() {
    var D = DATA.gain_decay, C = D.colors, W = 1000, H = 440;
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Mechanism family gains, and robustness across shift magnitude." });
    // ---- left: the paired gains
    var L = { x0: 70, x1: 480, y0: 46, y1: 330 };
    var fams = D.families, n = fams.length;
    var lo = Math.min.apply(null, fams.map(function (f) { return Math.min(f.paired[1], f.gain[1]); })) - 1.4;
    var hi = Math.max.apply(null, fams.map(function (f) { return Math.max(f.paired[2], f.gain[2]); })) * 1.06;
    var yL = scale(lo, hi, L.y1, L.y0), xL = scale(-0.62, n - 0.38, L.x0, L.x1);
    var gl = sv("g");
    ticks(Math.ceil(lo / 2) * 2, hi, 2).forEach(function (t) {
      gl.appendChild(sv("line", { x1: L.x0, y1: yL(t), x2: L.x1, y2: yL(t), stroke: "#E1E5E8", "stroke-width": 0.8 }));
      gl.appendChild(text(L.x0 - 8, yL(t) + 4, String(t), { "text-anchor": "end", "font-size": 11.5, fill: C.ink }));
    });
    gl.appendChild(sv("line", { x1: L.x0, y1: yL(0), x2: L.x1, y2: yL(0), stroke: C.frame, "stroke-width": 0.9 }));
    frameAxes(gl, L.x0, L.x1, L.y0, L.y1, C.frame);
    var nOn = fams.filter(function (f) { return f.regime === "Online"; }).length;
    gl.appendChild(sv("line", { x1: xL(nOn - 0.5), y1: L.y0, x2: xL(nOn - 0.5), y2: L.y1, stroke: C.muted, "stroke-width": 1.1, "stroke-dasharray": "4 3" }));
    gl.appendChild(text((xL(-0.62) + xL(nOn - 0.5)) / 2, L.y1 + 24, "Online", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: C.muted }));
    gl.appendChild(text((xL(nOn - 0.5) + xL(n - 0.38)) / 2, L.y1 + 24, "Offline", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: C.muted }));
    gl.appendChild(text(22, (L.y0 + L.y1) / 2, "Gain", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: C.ink, transform: "rotate(-90 22 " + (L.y0 + L.y1) / 2 + ")" }));
    gl.appendChild(text((L.x0 + L.x1) / 2, 24, "Robust RL outperforms Standard RL", { "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: C.ink }));
    var width = 0.37, order = 0;
    fams.forEach(function (f, i) {
      [["paired", -0.5, f.dark], ["gain", 0.5, f.light]].forEach(function (p) {
        var v = f[p[0]], pos = xL(i + p[1] * width), w = (xL(1) - xL(0)) * width * 0.94;
        var top = yL(Math.max(v[0], 0)), h = Math.abs(yL(v[0]) - yL(0));
        var rect = sv("rect", { x: pos - w / 2, y: top, width: w, height: Math.max(h, 0.01), fill: p[2], class: "fig-bar" });
        rect.style.transformOrigin = pos + "px " + yL(0) + "px";
        gl.appendChild(delay(rect, 0.04 * order));
        var rule = sv("line", { x1: pos, y1: yL(v[1]), x2: pos, y2: yL(v[2]), stroke: f.rule, "stroke-width": 1, opacity: 0.5, class: "fig-late" });
        gl.appendChild(delay(rule, 0.04 * order + 0.25));
        var ly = v[0] >= 0 ? yL(v[0]) - 6 : yL(v[0]) + 13;
        var label = text(pos, ly, (v[0] >= 0 ? "+" : "") + fmt(v[0], 1), { "text-anchor": "middle", "font-size": 11.5, "font-weight": 700, fill: C.ink, class: "fig-late" });
        gl.appendChild(delay(label, 0.04 * order + 0.28));
        order += 1;
      });
    });
    svg.appendChild(gl);
    // the legend: one two-shade swatch per family
    var lg = sv("g", { class: "fig-late" }), lx = 60;
    fams.forEach(function (f) {
      lg.appendChild(sv("rect", { x: lx, y: 390, width: 12, height: 12, fill: f.dark }));
      lg.appendChild(sv("rect", { x: lx + 12, y: 390, width: 12, height: 12, fill: f.light }));
      var t = text(lx + 30, 401, f.label, { "font-size": 12, fill: C.ink });
      lg.appendChild(t);
      lx += 30 + f.label.length * 6.6 + 28;
    });
    lg.setAttribute("transform", "translate(" + Math.max(0, (W - lx) / 2 - 40) + " 0)");
    svg.appendChild(delay(lg, 0.35));
    // ---- right: the decay curves
    var R = { x0: 590, x1: 960, y0: 46, y1: 330 };
    var cs = D.curves, qs = cs.standard.length;
    var ylo = Math.min.apply(null, cs.standard) - 4, yhi = Math.max.apply(null, cs.robust) + 4;
    var yR = scale(ylo, yhi, R.y1, R.y0), xR = scale(-0.25, qs - 0.75, R.x0, R.x1);
    var gr = sv("g");
    ticks(Math.ceil(ylo / 10) * 10, yhi, 10).forEach(function (t) {
      gr.appendChild(sv("line", { x1: R.x0, y1: yR(t), x2: R.x1, y2: yR(t), stroke: "#E1E5E8", "stroke-width": 0.8 }));
      gr.appendChild(text(R.x0 - 8, yR(t) + 4, String(t), { "text-anchor": "end", "font-size": 11.5, fill: C.ink }));
    });
    frameAxes(gr, R.x0, R.x1, R.y0, R.y1, C.frame);
    for (var q = 0; q < qs; q++) { gr.appendChild(text(xR(q), R.y1 + 18, "Q" + (q + 1), { "text-anchor": "middle", "font-size": 12, fill: C.ink })); }
    gr.appendChild(text((R.x0 + R.x1) / 2, R.y1 + 40, "Shift magnitude", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: C.ink }));
    gr.appendChild(text(542, (R.y0 + R.y1) / 2, "Normalized score", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: C.ink, transform: "rotate(-90 542 " + (R.y0 + R.y1) / 2 + ")" }));
    gr.appendChild(text((R.x0 + R.x1) / 2, 24, "Robustness Decay", { "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: C.ink }));
    // the curves, their band and their markers extend together from Q1 to Q4 through one clip
    var clipR = sv("rect", { x: R.x0 - 6, y: R.y0 - 10, width: R.x1 - R.x0 + 12, height: R.y1 - R.y0 + 20, class: "fig-wipe" });
    clipR.style.transformOrigin = (R.x0 - 6) + "px 0px";
    gr.appendChild(sv("clipPath", { id: "fig-clip-decay" }, [clipR]));
    var sweep = sv("g", { "clip-path": "url(#fig-clip-decay)" });
    var band = [], k;
    for (k = 0; k < qs; k++) { band.push(xR(k).toFixed(1) + "," + yR(cs.robust[k]).toFixed(1)); }
    for (k = qs - 1; k >= 0; k--) { band.push(xR(k).toFixed(1) + "," + yR(cs.standard[k]).toFixed(1)); }
    sweep.appendChild(sv("polygon", { points: band.join(" "), fill: C.robust, "fill-opacity": 0.09 }));
    [["standard", C.standard, "Standard RL"], ["robust", C.robust, "Robust RL"]].forEach(function (s) {
      var d = cs[s[0]].map(function (v, i) { return (i ? "L" : "M") + xR(i).toFixed(1) + " " + yR(v).toFixed(1); }).join(" ");
      sweep.appendChild(sv("path", { d: d, fill: "none", stroke: s[1], "stroke-width": 2.6, "stroke-linejoin": "round" }));
      cs[s[0]].forEach(function (v, i) { sweep.appendChild(sv("circle", { cx: xR(i), cy: yR(v), r: 4.2, fill: s[1] })); });
    });
    gr.appendChild(sweep);
    [[0, "+", 44, -10], [qs - 1, "+", -42, 12]].forEach(function (g) {
      var i = g[0], gap = cs.robust[i] - cs.standard[i];
      var lab = text(xR(i) + g[2], (yR(cs.robust[i]) + yR(cs.standard[i])) / 2 + g[3], g[1] + fmt(gap, 1), { "text-anchor": "middle", "font-size": 15, "font-weight": 700, fill: C.robust, class: "fig-late" });
      gr.appendChild(delay(lab, i === 0 ? 0.32 : 1.0));
    });
    var leg = sv("g", { class: "fig-late" });
    [["Standard RL", C.standard], ["Robust RL", C.robust]].forEach(function (s, i) {
      var y = R.y0 + 14 + i * 18;
      leg.appendChild(sv("line", { x1: R.x1 - 118, y1: y, x2: R.x1 - 92, y2: y, stroke: s[1], "stroke-width": 2.6 }));
      leg.appendChild(sv("circle", { cx: R.x1 - 105, cy: y, r: 3.6, fill: s[1] }));
      leg.appendChild(text(R.x1 - 84, y + 4, s[0], { "font-size": 12, fill: C.ink }));
    });
    gr.appendChild(delay(leg, 0.07));
    svg.appendChild(gr);
    return svg;
  }

  // ================================================== Isaac Lab scatters and the VLA ladders
  function part4() {
    var D = DATA.part4, C = D.colors, W = 1040, H = 360;
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Performance against safety success rate on the Isaac Lab tasks, and the retention of a VLA policy along eight shift axes." });
    var SIZE = { "s": 6.5, "^": 7.5, "o": 7, "p": 7.5, "*": 9.5 };
    function scatter(panel, key, title, px0) {
      var P = { x0: px0, x1: px0 + 170, y0: 62, y1: 250 };
      var x = scale(D.lims[0][0], D.lims[0][1], P.x0, P.x1), y = scale(D.lims[1][0], D.lims[1][1], P.y1, P.y0);
      var g = sv("g");
      [0, 25, 50, 75, 100].forEach(function (t) {
        g.appendChild(sv("line", { x1: x(t), y1: P.y0, x2: x(t), y2: P.y1, stroke: C.grid, "stroke-width": 0.8 }));
        g.appendChild(sv("line", { x1: P.x0, y1: y(t), x2: P.x1, y2: y(t), stroke: C.grid, "stroke-width": 0.8 }));
        g.appendChild(text(x(t), P.y1 + 15, String(t), { "text-anchor": "middle", "font-size": 10.5, fill: C.ink }));
      });
      [0, 20, 40, 60, 80, 100].forEach(function (t) { g.appendChild(text(P.x0 - 6, y(t) + 3.5, String(t), { "text-anchor": "end", "font-size": 10.5, fill: C.ink })); });
      frameAxes(g, P.x0, P.x1, P.y0, P.y1, C.ink);
      g.appendChild(text((P.x0 + P.x1) / 2, P.y1 + 33, "Success rate (%)", { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: C.ink }));
      g.appendChild(text(P.x0 - 32, (P.y0 + P.y1) / 2, "Performance", { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: C.ink, transform: "rotate(-90 " + (P.x0 - 32) + " " + (P.y0 + P.y1) / 2 + ")" }));
      g.appendChild(text((P.x0 + P.x1) / 2, P.y0 - 12, title, { "text-anchor": "middle", "font-size": 13.5, "font-weight": 700, fill: C.ink }));
      var ms = D.methods.slice().sort(function (a, b) { return SIZE[b.marker] - SIZE[a.marker]; });
      ms.forEach(function (m, i) {
        var v = D[key][m.key], cx = x(v.x[0]), cy = y(v.y[0]);
        var bars = sv("g", { stroke: m.edge, "stroke-width": 1.1, class: "fig-late" }, [
          sv("line", { x1: x(v.x[0] - v.x[1]), y1: cy, x2: x(v.x[0] + v.x[1]), y2: cy }),
          sv("line", { x1: cx, y1: y(v.y[0] - v.y[1]), x2: cx, y2: y(v.y[0] + v.y[1]) })]);
        g.appendChild(delay(bars, 0.24 + i * 0.05));
        var mk = marker(m.marker, cx, cy, SIZE[m.marker]);
        mk.setAttribute("fill", m.color); mk.setAttribute("stroke", m.edge); mk.setAttribute("stroke-width", 1.1); mk.setAttribute("class", "fig-pop");
        mk.style.transformOrigin = cx + "px " + cy + "px";
        g.appendChild(delay(mk, 0.06 + i * 0.05));
      });
      panel.appendChild(g);
    }
    var left = sv("g");
    left.appendChild(text(265, 26, "Humanoid control tasks", { "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: C.ink }));
    scatter(left, "g1", "Locomotion · G1", 60);
    scatter(left, "drawer", "Manipulation · Drawer", 320);
    var ml = sv("g", { class: "fig-late" }), mx = 0, items = [];
    D.methods.forEach(function (m) {
      var mk = marker(m.marker, mx + 8, 322, 6); mk.setAttribute("fill", m.color); mk.setAttribute("stroke", m.edge); mk.setAttribute("stroke-width", 1);
      ml.appendChild(mk); ml.appendChild(text(mx + 20, 326, m.label, { "font-size": 11.5, fill: C.ink }));
      mx += 20 + m.label.length * 6.4 + 16;
    });
    ml.setAttribute("transform", "translate(" + (265 - mx / 2) + " 0)");
    left.appendChild(delay(ml, 0.36));
    svg.appendChild(left);
    svg.appendChild(sv("line", { x1: 548, y1: 14, x2: 548, y2: 346, stroke: C.ink, "stroke-width": 1 }));
    // ---- the VLA ladders
    var V = { x0: 620, x1: 900, y0: 62, y1: 250 };
    var yv = scale(0.25, 1.13, V.y1, V.y0), xv = scale(-0.03, 1.03, V.x0, V.x1);
    var gv = sv("g");
    gv.appendChild(text((V.x0 + V.x1) / 2 + 40, 26, "VLA robotic tasks", { "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: C.ink }));
    gv.appendChild(text((V.x0 + V.x1) / 2, V.y0 - 12, "Performance degradation under shifts", { "text-anchor": "middle", "font-size": 13.5, "font-weight": 700, fill: C.ink }));
    [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1].forEach(function (t) {
      gv.appendChild(sv("line", { x1: V.x0, y1: yv(t), x2: V.x1, y2: yv(t), stroke: C.grid, "stroke-width": 0.7 }));
      gv.appendChild(text(V.x0 - 6, yv(t) + 3.5, t.toFixed(1), { "text-anchor": "end", "font-size": 10.5, fill: C.ink }));
    });
    frameAxes(gv, V.x0, V.x1, V.y0, V.y1, C.frame);
    [0, 1, 2, 3].forEach(function (q) { gv.appendChild(text(xv(q / 3), V.y1 + 15, "Q" + (q + 1), { "text-anchor": "middle", "font-size": 10.5, fill: C.ink })); });
    gv.appendChild(text((V.x0 + V.x1) / 2, V.y1 + 33, "Magnitude quartile of the axis' own ladder", { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: C.ink }));
    gv.appendChild(text(V.x0 - 36, (V.y0 + V.y1) / 2, "Retention (1.0 = nominal)", { "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: C.ink, transform: "rotate(-90 " + (V.x0 - 36) + " " + (V.y0 + V.y1) / 2 + ")" }));
    gv.appendChild(sv("line", { x1: V.x0, y1: yv(1), x2: V.x1, y2: yv(1), stroke: C.muted, "stroke-width": 0.9, "stroke-dasharray": "3 2" }));
    gv.appendChild(text(V.x0 + 4, yv(1) - 4, "nominal", { "font-size": 10, fill: C.muted }));
    var ends = [];
    D.vla.forEach(function (a) {
      var n = a.rungs.length, pts = a.rungs.map(function (r, i) { return [xv(i / (n - 1)), yv(r.retention), yv(r.retention - r.sd), yv(r.retention + r.sd)]; });
      var bandPts = pts.map(function (p) { return p[0].toFixed(1) + "," + p[3].toFixed(1); }).concat(pts.slice().reverse().map(function (p) { return p[0].toFixed(1) + "," + p[2].toFixed(1); }));
      gv.appendChild(delay(sv("polygon", { points: bandPts.join(" "), fill: a.color, "fill-opacity": 0.13, class: "fig-late" }), 0.88));
      var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
      var attrs = { d: d, fill: "none", stroke: a.color, "stroke-width": 2.6, "stroke-linejoin": "round", class: "fig-line" };
      var path = sv("path", attrs);
      if (a.dash) {
        path.setAttribute("stroke-dasharray", a.dash.join(" "));
        path.setAttribute("class", "");
        var cid = "fig-clip-" + a.label.replace(/[^a-z]/gi, "").toLowerCase();
        var clipRect = sv("rect", { x: V.x0 - 4, y: V.y0 - 20, width: V.x1 - V.x0 + 8, height: V.y1 - V.y0 + 30, class: "fig-wipe" });
        clipRect.style.transformOrigin = (V.x0 - 4) + "px 0px";
        gv.appendChild(sv("clipPath", { id: cid }, [clipRect]));
        path.setAttribute("clip-path", "url(#" + cid + ")");
      }
      gv.appendChild(path);
      pts.forEach(function (p, i) {
        var m = sv("circle", { cx: p[0], cy: p[1], r: 3.2, fill: a.color, stroke: C.ink, "stroke-width": 0.6, class: "fig-pop" });
        m.style.transformOrigin = p[0] + "px " + p[1] + "px";
        gv.appendChild(delay(m, 0.16 + (i / (n - 1)) * 0.76));
      });
      if (a.hardware) {
        var j = a.rungs.map(function (r) { return r.name; }).indexOf(a.hardware);
        var dm = marker("D", pts[j][0], pts[j][1], 5.2); dm.setAttribute("fill", a.color); dm.setAttribute("stroke", C.ink); dm.setAttribute("stroke-width", 0.8); dm.setAttribute("class", "fig-pop");
        dm.style.transformOrigin = pts[j][0] + "px " + pts[j][1] + "px";
        gv.appendChild(delay(dm, 0.92));
      }
      ends.push([pts[n - 1][1], a.label, a.color, a.rungs[n - 1].retention]);
    });
    ends.sort(function (a, b) { return a[0] - b[0]; });   // from the top of the panel down
    var placed = [];
    ends.forEach(function (e) {
      var yText = e[0];
      while (placed.length && yText - placed[placed.length - 1] < 12.5) { yText = placed[placed.length - 1] + 12.5; }
      placed.push(yText);
      var lab = sv("g", { class: "fig-late" }, [
        Math.abs(yText - e[0]) > 0.5 ? sv("line", { x1: V.x1 + 2, y1: e[0], x2: V.x1 + 10, y2: yText, stroke: e[2], "stroke-width": 0.7 }) : null,
        text(V.x1 + 13, yText + 3.5, e[1] + "  " + fmt(e[3], 2), { "font-size": 10.5, "font-weight": 700, fill: C.ink })]);
      gv.appendChild(delay(lab, 1.0));
    });
    var cl = sv("g", { class: "fig-late" }), seen = {}, cx0 = V.x0 - 10, row = 0, col = 0;
    D.vla.forEach(function (a) {
      if (seen[a.channel]) { return; }
      seen[a.channel] = true;
      var xx = cx0 + col * 112, yy = 318 + row * 16;
      cl.appendChild(sv("line", { x1: xx, y1: yy, x2: xx + 22, y2: yy, stroke: a.color, "stroke-width": 2.6 }));
      cl.appendChild(text(xx + 28, yy + 4, a.channel, { "font-size": 11, fill: C.ink }));
      col += 1; if (col === 3) { col = 0; row += 1; }
    });
    var dx = cx0 + col * 112, dy = 318 + row * 16;
    var dd = marker("D", dx + 11, dy, 5); dd.setAttribute("fill", "#fff"); dd.setAttribute("stroke", C.ink); dd.setAttribute("stroke-width", 0.9);
    cl.appendChild(dd); cl.appendChild(text(dx + 28, dy + 4, "real-robot operating point", { "font-size": 11, fill: C.ink }));
    gv.appendChild(delay(cl, 0.4));
    svg.appendChild(gv);
    return svg;
  }

  arm(document, "fig-gain-decay", gainDecay);
  arm(document, "fig-part4", part4);
  // the drawn-in lines need their length once they are in the document
  Array.prototype.forEach.call(document.querySelectorAll(".fig-svg .fig-line"), function (p) {
    var len = Math.ceil(p.getTotalLength());
    p.style.strokeDasharray = len + "px";
    p.style.strokeDashoffset = len + "px";
  });
}());
