/* The shift table: a button per source opens a row with the nominal and shifted clips and
   the code. The clips are fetched only when their row is first opened. */
(function () {
  "use strict";
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".demo-toggle"));
  buttons.forEach(function (b) {
    var row = document.getElementById(b.getAttribute("aria-controls"));
    if (!row) { return; }
    var body = row.querySelector(".demo-body");
    var panel = document.createElement("div");
    panel.className = "demo-panel";
    body.parentNode.insertBefore(panel, body);
    panel.appendChild(body);
    var animation = null;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var videos = Array.prototype.slice.call(row.querySelectorAll("video"));
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      var height = row.hidden ? 0 : panel.getBoundingClientRect().height;
      var opacity = row.hidden ? 0 : Number(window.getComputedStyle(panel).opacity);
      if (animation) { animation.cancel(); animation = null; }
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.setAttribute("aria-label", b.getAttribute("aria-label").replace(/^(Show|Hide)/, open ? "Hide" : "Show"));
      row.hidden = false;
      row.inert = !open;
      if (!reducedMotion.matches && panel.animate) {
        animation = panel.animate([
          { height: height + "px", opacity: opacity },
          { height: (open ? panel.scrollHeight : 0) + "px", opacity: open ? 1 : 0 }
        ], { duration: 280, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" });
        animation.onfinish = function () {
          row.hidden = !open;
          animation.cancel();
          animation = null;
        };
      } else { row.hidden = !open; }
      videos.forEach(function (v) {
        if (open) {
          if (!v.getAttribute("src")) { v.setAttribute("src", v.getAttribute("data-src")); }
          v.muted = true;
          var p = v.play(); if (p && p.catch) { p.catch(function () {}); }
        } else { v.pause(); }
      });
    });
  });
}());
