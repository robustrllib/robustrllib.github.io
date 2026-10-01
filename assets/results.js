/* The result charts of the project page: the library-wide grid, the channel
   leaderboard and the compound scenarios. Plain SVG, no dependency. The numbers come
   from the JSON that sync_landing.py writes into the page from data/results/*.csv,
   and every chart has a table twin. */
(function () {
  "use strict";
  var node = document.getElementById("results-data");
  if (!node) { return; }
  var DATA;
  try { DATA = JSON.parse(node.textContent); } catch (e) { return; }

  // ---- colours: the families in the tints of the paper's figures (its base colours
  //      blended 22 % towards white); pale, so every bar also carries its family in
  //      text, its value beside it, and a table twin. Text never wears a data colour.
  var FAMILY_COLOR = { standard: "#b7b7b7", learner_on: "#bcd6eb", data_on: "#b3e1da",
                       learner_off: "#d5c8ed", data_off: "#cde4be", generative: "#eb8787" };
  // the cells of the compound scenarios: the same pale key, one tint per shift
  var CELL_COLOR = { nominal: "#b7b7b7", theta_p: "#6aa0e2", theta_a: "#f08e67", theta_tau: "#76cfaf",
                     theta_o: "#f2b840", theta_z: "#ee9cbb", compound: "#897fc6" };
  var GRAY = "#b7b7b7", INK = "#141413", MUTED = "#5e5d59", FAINT = "#87867f",
      GRID = "#e8e6dc", AXIS = "#c2c0b6", SURFACE = "#faf9f5";
  var NS = "http://www.w3.org/2000/svg";

  // ---- small helpers
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") { n.textContent = attrs[k]; }
      else if (k === "class") { n.className = attrs[k]; }
      else { n.setAttribute(k, attrs[k]); }
    });
    (children || []).forEach(function (c) { if (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); } });
    return n;
  }
  function sv(tag, attrs, children) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") { n.textContent = attrs[k]; } else { n.setAttribute(k, attrs[k]); }
    });
    (children || []).forEach(function (c) { if (c) { n.appendChild(c); } });
    return n;
  }
  function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function fmt(v, d) { return (v === null || v === undefined || isNaN(v)) ? "—" : v.toFixed(d === undefined ? 1 : d); }
  function select(label, options, value, onchange) {
    var s = el("select", { "aria-label": label });
    options.forEach(function (o) {
      var opt = el("option", { value: o.value, text: o.label });
      if (o.value === value) { opt.selected = true; }
      s.appendChild(opt);
    });
    s.addEventListener("change", function () { onchange(s.value); });
    return el("label", { class: "viz-filter" }, [el("span", { text: label }), s]);
  }
  function niceStep(span) {
    var raw = span / 5, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * mag;
  }
  function ticks(lo, hi) {
    var step = niceStep(hi - lo), out = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) { out.push(Math.round(v * 1000) / 1000); }
    return out;
  }
  function familyOf(m) { return DATA.library.families.filter(function (f) { return f.key === m.family; })[0] || { label: m.family }; }
  // the family beside a method name: short, without the regime the chart already separates
  var FAMILY_SHORT = { standard: "Standard", learner_on: "Learner-centric", data_on: "Environment-centric",
                       learner_off: "Learner-centric", data_off: "Data-centric", generative: "Generative" };
  var FAMILY_TAG = { standard: "standard", learner_on: "learner", data_on: "environment", learner_off: "learner", data_off: "data", generative: "generative" };
  function familyText(m) { return FAMILY_SHORT[m.family] + " (" + m.regime + ")"; }
  function pageOf(m) { return m.page ? "docs/algorithms/" + m.page + "/" : null; }

  // ---- one tooltip for every chart
  var tip = el("div", { class: "viz-tip", role: "tooltip" });
  tip.hidden = true;
  document.body.appendChild(tip);
  function showTip(rows, x, y) {
    tip.replaceChildren();
    rows.forEach(function (r) {
      var line = el("div", { class: "viz-tip-row" + (r.strong ? " is-strong" : "") });
      if (r.color) { line.appendChild(el("i", { class: "viz-tip-key", style: "background:" + r.color })); }
      line.appendChild(el("span", { text: r.text }));
      tip.appendChild(line);
    });
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(window.innerWidth - w - 8, x + 14), top = y - h - 12;
    if (top < 8) { top = y + 16; }
    tip.style.left = left + "px"; tip.style.top = (top + window.scrollY) + "px";
  }
  function hideTip() { tip.hidden = true; }
  function hoverable(target, rows) {
    target.setAttribute("tabindex", "0");
    target.addEventListener("pointermove", function (e) { showTip(rows(), e.clientX, e.clientY); });
    target.addEventListener("pointerleave", hideTip);
    target.addEventListener("focus", function () { var b = target.getBoundingClientRect(); showTip(rows(), b.right, b.top); });
    target.addEventListener("blur", hideTip);
  }

  // ---- a horizontal bar chart: one row per entry, bars from the zero line
  //      entries: [{name, sub, value, sd, nominal, color, rows()}]
  function barChart(entries, opts) {
    var W = 960, rowH = 26, left = 248, right = 56, top = 26, bottom = 8;
    var H = top + entries.length * rowH + bottom;
    var values = entries.map(function (e) { return e.value; }).concat(entries.map(function (e) { return e.nominal; }).filter(function (v) { return v !== undefined && v !== null; }));
    var lo = Math.min(0, Math.min.apply(null, values)), hi = Math.max(10, Math.max.apply(null, values));
    lo = Math.floor(lo / 10) * 10; hi = Math.ceil(hi / 10) * 10;
    var x = function (v) { return left + (v - lo) / (hi - lo) * (W - left - right); };
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, class: "viz-svg", role: "img", "aria-label": opts.title });
    svg.appendChild(sv("title", { text: opts.title }));
    ticks(lo, hi).forEach(function (t) {
      svg.appendChild(sv("line", { x1: x(t), x2: x(t), y1: top - 6, y2: H - bottom, stroke: t === 0 ? AXIS : GRID, "stroke-width": 1 }));
      svg.appendChild(sv("text", { x: x(t), y: top - 10, "text-anchor": "middle", class: "viz-tick", text: String(t) }));
    });
    entries.forEach(function (e, i) {
      var y = top + i * rowH, h = 16, y0 = y + (rowH - h) / 2;
      var g = sv("g", { class: "viz-bar-row" });
      g.appendChild(sv("rect", { x: 0, y: y, width: W, height: rowH, fill: "transparent" }));
      var label = sv("text", { x: left - 12, y: y + rowH / 2 + 4, "text-anchor": "end", class: "viz-label" });
      label.appendChild(sv("tspan", { text: e.name }));
      if (e.sub) { label.appendChild(sv("tspan", { class: "viz-sub", text: "  " + e.sub })); }
      g.appendChild(label);
      var x0 = x(Math.min(0, e.value)), x1 = x(Math.max(0, e.value)), w = Math.max(0, x1 - x0);
      // a rounded data end, square at the zero line
      var r = 4, d;
      if (e.value >= 0) {
        d = "M" + x0 + " " + y0 + "h" + Math.max(0, w - r) + "a" + r + " " + r + " 0 0 1 " + r + " " + r + "v" + (h - 2 * r) + "a" + r + " " + r + " 0 0 1 -" + r + " " + r + "h-" + Math.max(0, w - r) + "z";
      } else {
        d = "M" + x1 + " " + y0 + "h-" + Math.max(0, w - r) + "a" + r + " " + r + " 0 0 0 -" + r + " " + r + "v" + (h - 2 * r) + "a" + r + " " + r + " 0 0 0 " + r + " " + r + "h" + Math.max(0, w - r) + "z";
      }
      g.appendChild(sv("path", { d: d, fill: e.color, class: "viz-fill" }));
      if (e.sd) {
        g.appendChild(sv("line", { x1: x(e.value - e.sd), x2: x(e.value + e.sd), y1: y0 + h / 2, y2: y0 + h / 2, stroke: INK, "stroke-opacity": .45, "stroke-width": 1.5 }));
      }
      if (e.nominal !== undefined && e.nominal !== null) {
        g.appendChild(sv("line", { x1: x(e.nominal), x2: x(e.nominal), y1: y0 - 3, y2: y0 + h + 3, stroke: INK, "stroke-width": 2, class: "viz-nominal" }));
      }
      var lx = e.value >= 0 ? x1 + 6 : x0 - 6;
      g.appendChild(sv("text", { x: lx, y: y + rowH / 2 + 4, "text-anchor": e.value >= 0 ? "start" : "end", class: "viz-value", text: fmt(e.value) }));
      hoverable(g, e.rows);
      svg.appendChild(g);
    });
    return svg;
  }

  // ---- a grouped column chart: groups of columns, one series per cell
  function columnChart(groups, series, opts) {
    var W = 960, H = 340, left = 44, right = 10, top = 16, bottom = 62;
    var vals = [];
    groups.forEach(function (g) { series.forEach(function (s) { var v = g.values[s.key]; if (v) { vals.push(v.value + (v.sd || 0)); vals.push(v.value - (v.sd || 0)); if (v.mark !== undefined) { vals.push(v.mark); } } }); });
    var lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(10, Math.max.apply(null, vals));
    lo = Math.floor(lo / 10) * 10; hi = Math.ceil(hi / 10) * 10;
    var y = function (v) { return top + (hi - v) / (hi - lo) * (H - top - bottom); };
    var slot = (W - left - right) / groups.length, bars = series.length, gap = 2;
    var barW = Math.min(24, Math.floor((slot * 0.78 - gap * (bars - 1)) / bars));
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, class: "viz-svg", role: "img", "aria-label": opts.title });
    svg.appendChild(sv("title", { text: opts.title }));
    ticks(lo, hi).forEach(function (t) {
      svg.appendChild(sv("line", { x1: left, x2: W - right, y1: y(t), y2: y(t), stroke: t === 0 ? AXIS : GRID, "stroke-width": 1 }));
      svg.appendChild(sv("text", { x: left - 8, y: y(t) + 4, "text-anchor": "end", class: "viz-tick", text: String(t) }));
    });
    groups.forEach(function (g, gi) {
      var cx = left + slot * (gi + 0.5), x0 = cx - (bars * barW + gap * (bars - 1)) / 2;
      svg.appendChild(sv("text", { x: cx, y: H - bottom + 18, "text-anchor": "middle", class: "viz-label viz-small", text: g.name }));
      if (g.sub) { svg.appendChild(sv("text", { x: cx, y: H - bottom + 34, "text-anchor": "middle", class: "viz-sub", text: g.sub })); }
      series.forEach(function (s, si) {
        var v = g.values[s.key];
        if (!v) { return; }
        var x = x0 + si * (barW + gap), yb = y(Math.max(0, v.value)), h = Math.abs(y(v.value) - y(0)), r = Math.min(4, barW / 2);
        var grp = sv("g", { class: "viz-col" });
        grp.appendChild(sv("rect", { x: x - 1, y: top, width: barW + 2, height: H - top - bottom, fill: "transparent" }));
        var d = v.value >= 0
          ? "M" + x + " " + (yb + h) + "v-" + Math.max(0, h - r) + "a" + r + " " + r + " 0 0 1 " + r + " -" + r + "h" + (barW - 2 * r) + "a" + r + " " + r + " 0 0 1 " + r + " " + r + "v" + Math.max(0, h - r) + "z"
          : "M" + x + " " + yb + "v" + Math.max(0, h - r) + "a" + r + " " + r + " 0 0 0 " + r + " " + r + "h" + (barW - 2 * r) + "a" + r + " " + r + " 0 0 0 " + r + " -" + r + "v-" + Math.max(0, h - r) + "z";
        grp.appendChild(sv("path", { d: d, fill: s.color, class: "viz-fill" }));
        if (v.sd) {
          grp.appendChild(sv("line", { x1: x + barW / 2, x2: x + barW / 2, y1: y(v.value - v.sd), y2: y(v.value + v.sd), stroke: INK, "stroke-opacity": .45, "stroke-width": 1.5 }));
        }
        if (v.mark !== undefined) {   // the independence prediction, a tick across the compound column
          grp.appendChild(sv("line", { x1: x - 3, x2: x + barW + 3, y1: y(v.mark), y2: y(v.mark), stroke: INK, "stroke-width": 2 }));
        }
        hoverable(grp, v.rows);
        svg.appendChild(grp);
      });
    });
    return svg;
  }

  function legend(items) {
    var ul = el("ul", { class: "viz-legend" });
    items.forEach(function (it) {
      ul.appendChild(el("li", {}, [el("i", { class: "viz-key" + (it.tick ? " is-tick" : ""), style: it.color ? "background:" + it.color : "" }), el("span", { text: it.label })]));
    });
    return ul;
  }
  function table(head, body) {
    var t = el("table", { class: "data viz-table" });
    t.appendChild(el("thead", {}, [el("tr", {}, head.map(function (h, i) { return el("th", { class: i ? "c" : "", text: h }); }))]));
    var tb = el("tbody");
    body.forEach(function (row) { tb.appendChild(el("tr", {}, row.map(function (c, i) { return el("td", { class: i ? "c" : "", text: c }); }))); });
    t.appendChild(tb);
    return el("div", { class: "table-scroll viz-table-wrap" }, [t]);
  }
  function mount(host, controls, note, buildChart, buildTable) {
    host.replaceChildren();
    var showTable = host.getAttribute("data-view") === "table";
    var toggle = el("button", { type: "button", class: "viz-toggle", "aria-pressed": String(showTable), text: showTable ? "Chart" : "Table" });
    toggle.addEventListener("click", function () {
      host.setAttribute("data-view", showTable ? "chart" : "table");
      host.dispatchEvent(new CustomEvent("viz:render"));
    });
    var row = el("div", { class: "viz-filters" }, controls.concat([toggle]));
    host.appendChild(row);
    host.appendChild(el("div", { class: "viz-body" }, [showTable ? buildTable() : buildChart()]));
    if (note) { host.appendChild(el("p", { class: "viz-note", text: note })); }
  }

  // =================================================================== Part 1
  (function libraryChart() {
    var host = document.getElementById("viz-library");
    if (!host) { return; }
    var L = DATA.library, C = {};
    L.columns.forEach(function (c, i) { C[c] = i; });
    var state = { regime: "both", family: "all", task: "all", axis: "all", quartile: "all", order: "family" };
    var FAMILIES = ["Locomotion", "Manipulation", "Navigation", "Vehicle control"];

    function taskAllowed(ti) {
      var t = L.tasks[ti];
      return (state.regime === "both" || t.regime === state.regime) && (state.family === "all" || t.family === state.family)
          && (state.task === "all" || String(ti) === state.task);
    }
    function aggregate() {
      var cell = {}, nom = {};   // (m|t|a) -> [scores]
      L.rows.forEach(function (r) {
        if (!taskAllowed(r[C.task])) { return; }
        if (state.axis !== "all" && r[C.axis] !== state.axis) { return; }
        var k = r[C.method] + "|" + r[C.task] + "|" + r[C.axis];
        if (r[C.nominal]) { (nom[k] = nom[k] || []).push(r[C.score]); return; }
        if (state.quartile !== "all" && String(r[C.quartile]) !== state.quartile) { return; }
        (cell[k] = cell[k] || []).push(r[C.score]);
      });
      function roll(map) {
        var task = {}, method = {};
        Object.keys(map).forEach(function (k) {
          var p = k.split("|"), mk = p[0] + "|" + p[1];
          (task[mk] = task[mk] || []).push(mean(map[k]));
        });
        Object.keys(task).forEach(function (k) { var m = k.split("|")[0]; (method[m] = method[m] || []).push(mean(task[k])); });
        return { method: method, task: task };
      }
      var s = roll(cell), n = roll(nom), counts = {};
      Object.keys(cell).forEach(function (k) { var m = k.split("|")[0]; counts[m] = (counts[m] || 0) + cell[k].length; });
      return Object.keys(s.method).map(function (m) {
        var rec = L.methods[+m], tasksOf = Object.keys(s.task).filter(function (k) { return k.split("|")[0] === m; });
        var nomVals = tasksOf.map(function (k) { return n.task[k]; }).filter(function (v) { return v !== undefined; }).map(mean);
        return { mi: +m, rec: rec, value: mean(s.method[m]), nominal: nomVals.length ? mean(nomVals) : null,
                 tasks: tasksOf.length, conditions: counts[m] };
      });
    }
    function render() {
      var entries = aggregate();
      var fo = {}; L.families.forEach(function (f, i) { fo[f.key] = i; });
      entries.sort(function (a, b) {
        if (state.order === "score") { return b.value - a.value; }
        return (fo[a.rec.family] - fo[b.rec.family]) || (a.rec.regime > b.rec.regime ? 1 : a.rec.regime < b.rec.regime ? -1 : 0) || (b.value - a.value);
      });
      var taskOptions = [{ value: "all", label: "All tasks" }].concat(L.tasks.map(function (t, i) { return { value: String(i), label: t.name + " (" + t.regime + ")" }; })
        .filter(function (o) { return o.value === "all" || (function (t) { return (state.regime === "both" || t.regime === state.regime) && (state.family === "all" || t.family === state.family); })(L.tasks[+o.value]); }));
      if (!taskOptions.some(function (o) { return o.value === state.task; })) { state.task = "all"; }
      var axes = {}; L.rows.forEach(function (r) { if (taskAllowed(r[C.task])) { axes[r[C.axis]] = true; } });
      var axisOptions = [{ value: "all", label: "All shift axes" }].concat(Object.keys(axes).sort().map(function (a) { return { value: a, label: L.axes[a] || a }; }));
      if (!axes[state.axis]) { state.axis = "all"; }
      var controls = [
        select("Regime", [{ value: "both", label: "Online and offline" }, { value: "online", label: "Online" }, { value: "offline", label: "Offline" }], state.regime, function (v) { state.regime = v; render(); }),
        select("Task family", [{ value: "all", label: "All task families" }].concat(FAMILIES.map(function (f) { return { value: f, label: f }; })), state.family, function (v) { state.family = v; render(); }),
        select("Task", taskOptions, state.task, function (v) { state.task = v; render(); }),
        select("Shift axis", axisOptions, state.axis, function (v) { state.axis = v; render(); }),
        select("Severity", [{ value: "all", label: "All severities" }, { value: "1", label: "Q1 · mildest" }, { value: "2", label: "Q2" }, { value: "3", label: "Q3" }, { value: "4", label: "Q4 · harshest" }], state.quartile, function (v) { state.quartile = v; render(); }),
        select("Order", [{ value: "family", label: "Order by family" }, { value: "score", label: "Order by score" }], state.order, function (v) { state.order = v; render(); }),
      ];
      var note = "Normalized score, 0 = a policy that does not solve the task and 100 = competent performance, unclipped. "
        + "Conditions average within a shift axis, axes within a task, tasks with equal weight; five training seeds and twenty paired episodes per condition. "
        + "The tick is the same method under no shift.";
      mount(host, controls, note, function () {
        var wrap = el("div", { class: "viz-chart" });
        wrap.appendChild(legend(L.families.map(function (f) { return { color: FAMILY_COLOR[f.key], label: f.label }; }).concat([{ tick: true, label: "Nominal (no shift)" }])));
        if (!entries.length) { wrap.appendChild(el("p", { class: "viz-empty", text: "No condition matches this selection." })); return wrap; }
        wrap.appendChild(barChart(entries.map(function (e) {
          return { name: e.rec.name, sub: familyText(e.rec), value: e.value, nominal: e.nominal,
                   color: FAMILY_COLOR[e.rec.family],
                   rows: function () { return [{ text: e.rec.name + " · " + familyOf(e.rec).label + " · " + e.rec.regime, strong: true },
                                               { text: "Score " + fmt(e.value) + " under shift", color: FAMILY_COLOR[e.rec.family] },
                                               { text: "Score " + fmt(e.nominal) + " at nominal" },
                                               { text: e.conditions + " conditions on " + e.tasks + " task" + (e.tasks === 1 ? "" : "s") }]; } };
        }), { title: "Library-wide results: normalized score per method under the selected shifts" }));
        return wrap;
      }, function () {
        return table(["Method", "Family", "Regime", "Score under shift", "Score at nominal", "Tasks", "Conditions"],
          entries.map(function (e) { return [e.rec.name, familyOf(e.rec).label, e.rec.regime, fmt(e.value), fmt(e.nominal), String(e.tasks), String(e.conditions)]; }));
      });
    }
    host.addEventListener("viz:render", render);
    render();
  }());

  // =================================================================== Part 2
  (function channelChart() {
    var host = document.getElementById("viz-channels");
    if (!host) { return; }
    var P = DATA.channels, C = {};
    P.columns.forEach(function (c, i) { C[c] = i; });
    var state = { channel: "theta_o", view: "paper:theta_o", regime: "both", standard: "show" };
    var byView = {};
    P.rows.forEach(function (r) { (byView[r[C.view]] = byView[r[C.view]] || []).push(r); });

    function viewsFor(channel) {
      var kind = P.channels.filter(function (c) { return c.key === channel; })[0].kind, out = [];
      if (kind === "frozen") {
        out.push({ value: "paper:" + channel, label: "Channel score — the five configurations, equally weighted" });
        P.cells.forEach(function (c, i) {
          if (c.channel === channel) { out.push({ value: "cell:" + i, label: c.gridlabel + ": " + c.label }); }
        });
      } else if (kind === "training") {
        out.push({ value: "paper:" + channel, label: "Channel score — trained under the shift, evaluated at nominal" });
      } else {
        out.push({ value: "paper:" + channel, label: "Shifted binding score — the source paper's normalization" });
      }
      return out;
    }
    function describe(view) {
      var p = view.split(":"), kind = p[0], id = p[1];
      if (kind === "paper") {
        var ch = P.channels.filter(function (c) { return c.key === id; })[0];
        if (ch.kind === "frozen") { return "The paper's channel score: the five configurations of the " + ch.label.toLowerCase() + " on Hopper-v5, equally weighted per seed, averaged over five training seeds and twenty episodes per configuration. Both ATLA rows rest on three observation configurations: the adversarial arm cannot run on a recurrent policy."; }
        if (ch.kind === "training") { return "One configuration of the paper's grid: trained under the shift (three reward corruptions, or reward delays of 4 to 64 steps), then evaluated at nominal; the mean over that ladder. Only the methods that were retrained appear."; }
        return "The door task with the scene rebound (robosuite DoorCausal), evaluated online only: the shifted binding score divided by the SAC nominal, the source paper's own normalization, over seeds 0, 1, 42, 2024 and 3407, collapsed runs left out; the semantic panel of the paper's figure.";
      }
      if (kind === "cell") { var c = P.cells[+id]; return c.gridlabel + ", " + c.label + ": one of the paper's 22 configurations per regime, averaged over five seeds and twenty episodes."; }
      return "";
    }
    function render() {
      var views = viewsFor(state.channel);
      if (!views.some(function (v) { return v.value === state.view; })) { state.view = views[0].value; }
      var rows = (byView[state.view] || []).map(function (r) { return { rec: P.methods[r[C.method]], mi: r[C.method], value: r[C.mean], sd: r[C.sd], n: r[C.n] }; })
        .filter(function (e) { return (state.regime === "both" || e.rec.regime === state.regime) && (state.standard === "show" || e.rec.family !== "standard"); });
      rows.sort(function (a, b) { return b.value - a.value; });
      var controls = [
        select("Shift", P.channels.map(function (c) { return { value: c.key, label: c.label }; }), state.channel, function (v) { state.channel = v; state.view = "paper:" + v; render(); }),
        select("View", views, state.view, function (v) { state.view = v; render(); }),
        select("Regime", [{ value: "both", label: "Online and offline" }, { value: "online", label: "Online" }, { value: "offline", label: "Offline" }], state.regime, function (v) { state.regime = v; render(); }),
        select("Standard references", [{ value: "show", label: "With standard references" }, { value: "hide", label: "Robust methods only" }], state.standard, function (v) { state.standard = v; render(); }),
      ];
      var semantic = state.view === "paper:theta_z";   // another task, another normalization: no Hopper nominal
      mount(host, controls, describe(state.view), function () {
        var wrap = el("div", { class: "viz-chart" });
        var present = DATA.library.families.filter(function (f) { return rows.some(function (e) { return e.rec.family === f.key; }); });
        wrap.appendChild(legend(present.map(function (f) { return { color: FAMILY_COLOR[f.key], label: f.label }; }).concat(semantic ? [] : [{ tick: true, label: "Nominal (no shift)" }])));
        if (!rows.length) { wrap.appendChild(el("p", { class: "viz-empty", text: "No method has a value here." })); return wrap; }
        wrap.appendChild(barChart(rows.map(function (e) {
          var nom = !semantic && P.nominal[e.mi] ? P.nominal[e.mi][0] : null;
          return { name: e.rec.name, sub: familyText(e.rec), value: e.value, nominal: nom,
                   color: FAMILY_COLOR[e.rec.family],
                   rows: function () { return [{ text: e.rec.name + " · " + familyOf(e.rec).label, strong: true },
                                               { text: "Score " + fmt(e.value) + " (n = " + e.n + ")", color: FAMILY_COLOR[e.rec.family] },
                                               nom === null ? null : { text: "Score " + fmt(nom) + " at nominal" }].filter(Boolean); } };
        }), { title: "Channel leaderboard: normalized score per method" }));
        return wrap;
      }, function () {
        return table(["Method", "Family", "Regime", "Score", "n", "Score at nominal"],
          rows.map(function (e) { var nom = semantic ? null : P.nominal[e.mi]; return [e.rec.name, familyOf(e.rec).label, e.rec.regime, fmt(e.value), String(e.n), nom ? fmt(nom[0]) : "—"]; }));
      });
    }
    host.addEventListener("viz:render", render);
    render();
  }());

  // =================================================================== Part 3
  (function compoundChart() {
    var host = document.getElementById("viz-compound");
    if (!host) { return; }
    var K = DATA.compound, C = {};
    K.columns.forEach(function (c, i) { C[c] = i; });
    var state = { block: K.blocks[0].key, measure: "score" };
    function render() {
      var block = K.blocks.filter(function (b) { return b.key === state.block; })[0], bi = K.blocks.indexOf(block);
      var byMethod = {};
      K.rows.forEach(function (r) {
        if (r[C.block] !== bi) { return; }
        var m = r[C.method];
        byMethod[m] = byMethod[m] || {};
        byMethod[m][r[C.cell]] = { score: r[C.score], sd: r[C.sd], n: r[C.n], retention: r[C.retention] };
      });
      var fo = {}; DATA.library.families.forEach(function (f, i) { fo[f.key] = i; });
      var methods = Object.keys(byMethod).map(Number).sort(function (a, b) { return (fo[K.methods[a].family] - fo[K.methods[b].family]) || (a - b); });
      var cells = block.cells.filter(function (c) { return c !== "pred"; });
      var series = cells.map(function (c) { return { key: c, label: K.cells[c], color: CELL_COLOR[c] }; });
      var groups = methods.map(function (m) {
        var rec = K.methods[m], vals = {};
        cells.forEach(function (c) {
          var v = byMethod[m][c];
          if (!v) { return; }
          var value = state.measure === "score" ? v.score : v.retention, sd = state.measure === "score" ? v.sd : null;
          var pred = c === "compound" && byMethod[m].pred ? (state.measure === "score" ? byMethod[m].pred.score : byMethod[m].pred.retention) : undefined;
          vals[c] = { value: value, sd: sd, mark: pred, rows: function () {
            return [{ text: rec.name + " · " + K.cells[c], strong: true },
                    { text: (state.measure === "score" ? "Score " : "Retention ") + fmt(value) + (sd ? " ± " + fmt(sd) : "") + (state.measure === "score" ? "" : " %") + " (n = " + v.n + ")", color: CELL_COLOR[c] },
                    { text: state.measure === "score" ? "Retention " + fmt(v.retention) + " % of nominal" : "Score " + fmt(v.score) },
                    pred === undefined ? null : { text: "Independence prediction " + fmt(pred) + (state.measure === "score" ? "" : " %") }].filter(Boolean); } };
        });
        return { name: rec.name, sub: FAMILY_TAG[rec.family] + " · " + rec.regime, values: vals };
      });
      var controls = [
        select("Scenario", K.blocks.map(function (b) { return { value: b.key, label: b.label }; }), state.block, function (v) { state.block = v; render(); }),
        select("Measure", [{ value: "score", label: "Normalized score" }, { value: "retention", label: "Retention, % of nominal" }], state.measure, function (v) { state.measure = v; render(); }),
      ];
      var note = "Every method that was run on this scenario, " + block.note + ". Each isolated shift is one factor at the severity of the compound cell; the tick on the compound column is the independence prediction, "
        + "nominal × Π (shift / nominal): the compound score if the shifts acted independently. Mean ± sd across seeds.";
      mount(host, controls, note, function () {
        var wrap = el("div", { class: "viz-chart" });
        wrap.appendChild(legend(series.map(function (s) { return { color: s.color, label: s.label }; }).concat([{ tick: true, label: "Independence prediction" }])));
        wrap.appendChild(columnChart(groups, series, { title: "Isolated and compound shifts on " + block.label }));
        return wrap;
      }, function () {
        var head = ["Method", "Family"].concat(block.cells.map(function (c) { return K.cells[c]; }));
        return table(head, methods.map(function (m) {
          var rec = K.methods[m];
          return [rec.name, familyOf(rec).label].concat(block.cells.map(function (c) {
            var v = byMethod[m][c]; if (!v) { return "—"; }
            return state.measure === "score" ? fmt(v.score) + " ± " + fmt(v.sd) : fmt(v.retention) + " %";
          }));
        }));
      });
    }
    host.addEventListener("viz:render", render);
    render();
  }());
}());
