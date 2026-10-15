/* The shift table: a button per source opens a row with the nominal and shifted clips and
   the code. The clips are fetched only when their row is first opened. */
(function () {
  "use strict";
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".demo-toggle"));
  buttons.forEach(function (b) {
    var row = document.getElementById(b.getAttribute("aria-controls"));
    if (!row) { return; }
    var videos = Array.prototype.slice.call(row.querySelectorAll("video"));
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      row.hidden = !open;
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
