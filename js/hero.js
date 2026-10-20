/* 一筆跑 Hero 動畫：愛心路線一筆畫出，經過的六角格依序點亮。
   三個方向共用；程序化素材（T0），不依賴任何圖片。 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var css = document.createElement('style');
  css.textContent =
    '.ha-path{stroke-dasharray:1;stroke-dashoffset:1}' +
    '.ha-run .ha-path{animation:ha-draw var(--dur) cubic-bezier(.5,0,.25,1) forwards}' +
    '@keyframes ha-draw{to{stroke-dashoffset:0}}' +
    '.ha-lit{opacity:0}' +
    '.ha-run .ha-lit{animation:ha-on .55s ease forwards;animation-delay:var(--d)}' +
    '@keyframes ha-on{0%{opacity:0}60%{opacity:1}100%{opacity:var(--o,.9)}}' +
    '.ha-pin{opacity:0}.ha-run .ha-pin{animation:ha-pin .3s ease forwards;animation-delay:var(--dur)}' +
    '@keyframes ha-pin{to{opacity:1}}' +
    '.ha-fade .ha-path,.ha-fade .ha-lit,.ha-fade .ha-pin{transition:opacity .8s ease;opacity:0!important;animation:none!important}' +
    '@media (prefers-reduced-motion:reduce){.ha-path{stroke-dashoffset:0!important;animation:none!important}.ha-lit{opacity:var(--o,.9)!important;animation:none!important}.ha-pin{opacity:1!important;animation:none!important}}';
  document.head.appendChild(css);

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // 愛心參數式；u 從底部尖端開始繞一圈
  function heart(cx, cy, s, n, wobble) {
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = Math.PI + (i / n) * Math.PI * 2;
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      var w = wobble ? Math.sin(i * 0.37) * wobble + Math.cos(i * 0.13) * wobble * 0.6 : 0;
      pts.push([cx + x * s + w, cy - y * s + w * 0.7]);
    }
    return pts;
  }
  function toD(pts) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
  }

  window.HeroArt = {
    init: function (o) {
      var svg = o.svg, W = o.w, H = o.h, R = o.hexR || 22, dur = o.duration || 4.2;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.classList.remove('ha-run', 'ha-fade');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.setProperty('--dur', dur + 's');
      var bg = el('g', {}, svg), lit = el('g', {}, svg);
      var route = heart(o.cx, o.cy, o.s, 360, o.wobble != null ? o.wobble : R * 0.28);
      var ideal = heart(o.cx, o.cy, o.s, 240, 0);
      var samples = route.filter(function (_, i) { return i % 2 === 0; });

      var dx = Math.sqrt(3) * R, dy = 1.5 * R, rows = Math.ceil(H / dy) + 2, cols = Math.ceil(W / dx) + 2;
      function hex(cx, cy, r) {
        var a = [];
        for (var k = 0; k < 6; k++) {
          var ang = Math.PI / 3 * k + Math.PI / 6;
          a.push((cx + r * Math.cos(ang)).toFixed(1) + ',' + (cy + r * Math.sin(ang)).toFixed(1));
        }
        return a.join(' ');
      }
      var litCount = 0, delays = [];
      for (var r = -1; r < rows; r++) {
        for (var c = -1; c < cols; c++) {
          var x = c * dx + (r & 1 ? dx / 2 : 0), y = r * dy;
          el('polygon', { points: hex(x, y, R - 0.8), fill: o.hexFill || 'none', stroke: o.hexStroke || '#1b222c', 'stroke-width': o.hexStrokeW || 1 }, bg);
          var best = 1e9, bi = 0;
          for (var i = 0; i < samples.length; i++) {
            var ddx = samples[i][0] - x, ddy = samples[i][1] - y, d = ddx * ddx + ddy * ddy;
            if (d < best) { best = d; bi = i; }
          }
          if (o.lit !== false && Math.sqrt(best) < R * 0.92) {
            var d0 = (bi / (samples.length - 1)) * dur * 0.97;
            var p = el('polygon', { points: hex(x, y, R - 0.8), class: 'ha-lit', fill: o.litColor || '#ffb547', stroke: o.litStroke || 'rgba(255,181,71,.6)', 'stroke-width': 1 }, lit);
            p.style.setProperty('--d', d0.toFixed(2) + 's');
            p.style.setProperty('--o', o.litOpacity || '.88');
            delays.push(d0); litCount++;
          }
        }
      }
      delays.sort(function (a, b) { return a - b; });
      if (o.showIdeal !== false) {
        el('path', { d: toD(ideal), fill: 'none', stroke: o.idealColor || '#d4ff3a', 'stroke-width': o.idealW || 2.2, 'stroke-dasharray': '7 7', 'stroke-linecap': 'round', opacity: o.idealOpacity || '.95' }, svg);
      }
      el('path', { d: toD(route), class: 'ha-path', pathLength: 1, fill: 'none', stroke: o.routeColor || '#ff6b2c', 'stroke-width': o.routeW || 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      var sp = route[0];
      var pin = el('g', { class: 'ha-pin' }, svg);
      el('circle', { cx: sp[0], cy: sp[1], r: 15, fill: '#ff6b2c', stroke: '#0b0e13', 'stroke-width': 3 }, pin);
      el('path', { d: 'M' + (sp[0] - 4) + ' ' + (sp[1] - 6) + 'v12M' + (sp[0] - 4) + ' ' + (sp[1] - 6) + 'h9l-2 3.5 2 3.5h-9', stroke: '#fff', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, pin);

      if (svg._ha) svg._ha();
      var timers = [], raf = 0, t0 = 0;
      svg._ha = function () { timers.forEach(clearTimeout); cancelAnimationFrame(raf); };
      function tick() {
        var n = 0, el_ = (performance.now() - t0) / 1000;
        while (n < delays.length && delays[n] <= el_) n++;
        if (o.onLit) o.onLit(n, litCount);
        if (n < delays.length) raf = requestAnimationFrame(tick);
      }
      function play() {
        timers.forEach(clearTimeout); timers = [];
        cancelAnimationFrame(raf);
        svg.classList.remove('ha-run', 'ha-fade');
        void svg.getBoundingClientRect();
        if (o.onLit) o.onLit(0, litCount);
        svg.classList.add('ha-run');
        t0 = performance.now(); raf = requestAnimationFrame(tick);
        if (o.loop !== false) {
          timers.push(setTimeout(function () { svg.classList.add('ha-fade'); }, (dur + 3.2) * 1000));
          timers.push(setTimeout(play, (dur + 4.2) * 1000));
        }
      }
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
      if (reduce) { if (o.onLit) o.onLit(litCount, litCount); svg.classList.add('ha-run'); }
      else play();
      return { total: litCount, replay: play };
    }
  };
})();
