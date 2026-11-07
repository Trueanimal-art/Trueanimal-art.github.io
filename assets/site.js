/* OneTap Garage / LAST ORBIT site — vanilla JS, no dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- language ---------------- */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var langHooks = [];
  function setLang(l, save) {
    if (l !== 'ru' && l !== 'en') l = 'ru';
    root.lang = l;
    if (save) store('lo-lang', l);
    var t = root.getAttribute('data-title-' + l); if (t) document.title = t;
    var d = root.getAttribute('data-desc-' + l), md = document.querySelector('meta[name="description"]');
    if (d && md) md.setAttribute('content', d);
    document.querySelectorAll('[data-alt-' + l + ']').forEach(function (el) { el.setAttribute('alt', el.getAttribute('data-alt-' + l)); });
    document.querySelectorAll('[data-label-' + l + ']').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-label-' + l)); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)); });
    langHooks.forEach(function (f) { f(l); });
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* per-language images (screenshots): data-src="…/{l}/…" */
  langHooks.push(function (l) {
    document.querySelectorAll('img[data-src]').forEach(function (im) { var src = im.getAttribute('data-src').replace('{l}', l); if (im.getAttribute('src') !== src) im.src = src; });
  });

  /* ---------------- top bar ---------------- */
  var top = document.querySelector('.top');
  function onScrollTop() { if (top) top.classList.toggle('scrolled', scrollY > 30); }
  addEventListener('scroll', onScrollTop, { passive: true }); onScrollTop();

  /* ---------------- starfield (fixed canvas behind everything) ---------------- */
  var cv = document.getElementById('stars');
  if (cv && cv.getContext) (function () {
    var ctx = cv.getContext('2d'), W, H, dpr, stars = [], t0 = performance.now(), last = t0, running = true;
    var COLORS = ['#ffffff', '#cfefff', '#7ff6ff', '#b9a6ff', '#ffd9a0'];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(420, Math.round(W * H / 3600));
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), tw: Math.random() * 6.28, c: COLORS[(Math.random() * COLORS.length) | 0] });
      if (reduce) draw(0, 0);
    }
    function draw(now, dt) {
      var warp = reduce ? 0 : Math.max(0, 1 - (now - t0) / 1500);   // hyperspace arrival on load
      warp = warp * warp;
      var sy = scrollY, cx = W / 2, cy = H * 0.42;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], depth = 0.25 + s.z * 0.75;
        s.y += dt * (6 + 22 * s.z) / 1000;                            // slow drift
        if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
        var y = (s.y - sy * depth * 0.18) % (H + 8); if (y < -4) y += H + 8;
        var r = 0.35 + s.z * 1.25, a = 0.35 + 0.65 * s.z * (0.75 + 0.25 * Math.sin(now / 700 + s.tw));
        ctx.globalAlpha = a; ctx.fillStyle = s.c;
        if (warp > 0.01) {
          var dx = s.x - cx, dy = y - cy, L = warp * 0.55 * depth;
          ctx.strokeStyle = s.c; ctx.lineWidth = r; ctx.beginPath(); ctx.moveTo(s.x, y); ctx.lineTo(s.x - dx * L, y - dy * L); ctx.stroke();
        } else if (r > 1.1) {
          ctx.beginPath(); ctx.arc(s.x, y, r, 0, 6.283); ctx.fill();
        } else ctx.fillRect(s.x, y, r * 1.6, r * 1.6);
      }
      ctx.globalAlpha = 1;
    }
    function loop(now) {
      if (!running) return;
      var dt = Math.min(64, now - last); last = now;
      draw(now, dt);
      requestAnimationFrame(loop);
    }
    resize(); addEventListener('resize', resize);
    if (!reduce) {
      requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', function () {
        running = !document.hidden;
        if (running) { last = performance.now(); requestAnimationFrame(loop); }
      });
    } else addEventListener('scroll', function () { draw(0, 0); }, { passive: true });
  })();

  /* ---------------- hero: pointer + scroll parallax, embers ---------------- */
  var hero = document.querySelector('.hero');
  if (hero && !reduce) {
    var art = hero.querySelector('.hero-art');
    addEventListener('scroll', function () { if (scrollY < innerHeight * 1.2) art.style.setProperty('--sy', scrollY.toFixed(1)); }, { passive: true });
    if (matchMedia('(hover: hover)').matches) hero.addEventListener('pointermove', function (e) {
      art.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
      art.style.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
    });
    var ec = hero.querySelector('.embers');
    if (ec && ec.getContext) (function () {
      var c = ec.getContext('2d'), w, h, d, P = [], vis = true, lastT = performance.now();
      function rs() { d = Math.min(devicePixelRatio || 1, 2); w = ec.clientWidth; h = ec.clientHeight; ec.width = w * d; ec.height = h * d; c.setTransform(d, 0, 0, d, 0, 0); }
      function spawn(init) {
        return { x: w * (0.35 + Math.random() * 0.65), y: init ? Math.random() * h : h * (0.45 + Math.random() * 0.6), v: 18 + Math.random() * 46, s: 0.6 + Math.random() * 2.2,
          life: 0, max: 3 + Math.random() * 5, wob: Math.random() * 6.28, hue: 18 + Math.random() * 30 };
      }
      rs(); addEventListener('resize', rs);
      var N = Math.min(70, Math.round(w / 14));
      for (var i = 0; i < N; i++) P.push(spawn(true));
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) { lastT = performance.now(); requestAnimationFrame(tick); } }).observe(hero);
      function tick(now) {
        if (!vis || document.hidden) return;
        var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
        c.clearRect(0, 0, w, h); c.globalCompositeOperation = 'lighter';
        for (var i = 0; i < P.length; i++) {
          var p = P[i]; p.life += dt; p.y -= p.v * dt; p.x += Math.sin(p.wob + p.life * 2) * 12 * dt;
          if (p.life > p.max || p.y < -10) { P[i] = spawn(false); continue; }
          var a = Math.sin(Math.PI * p.life / p.max);
          c.fillStyle = 'hsla(' + p.hue + ',100%,62%,' + (a * 0.85).toFixed(3) + ')';
          c.beginPath(); c.arc(p.x, p.y, p.s, 0, 6.283); c.fill();
          c.fillStyle = 'hsla(' + p.hue + ',100%,55%,' + (a * 0.12).toFixed(3) + ')';
          c.beginPath(); c.arc(p.x, p.y, p.s * 4, 0, 6.283); c.fill();
        }
        c.globalCompositeOperation = 'source-over';
        requestAnimationFrame(tick);
      }
    })();
  }

  /* ---------------- reveal on scroll + counters ---------------- */
  function count(el) {
    var to = +el.getAttribute('data-count'); if (reduce) { el.textContent = to; return; }
    var t0 = performance.now(), dur = 900;
    (function step(now) { var k = Math.min(1, (now - t0) / dur); k = 1 - Math.pow(1 - k, 3); el.textContent = Math.max(1, Math.round(to * k)); if (k < 1) requestAnimationFrame(step); })(t0);
    setTimeout(function () { el.textContent = to; }, dur + 200);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(count);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });

  /* ---------------- trailer: poster first, YouTube only on click ---------------- */
  var vid = document.querySelector('.video');
  if (vid) {
    var vbtn = vid.querySelector('button'), poster = vid.querySelector('img');
    langHooks.push(function (l) {
      poster.src = poster.getAttribute('data-src-' + l);
      var old = vid.querySelector('iframe'); if (old) { old.remove(); vbtn.hidden = false; }
    });
    vbtn.addEventListener('click', function () {
      var id = vid.getAttribute('data-yt-' + root.lang);
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1&modestbranding=1&hl=' + root.lang;
      f.title = root.lang === 'ru' ? 'Трейлер Last Orbit' : 'Last Orbit trailer';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin';
      vid.appendChild(f); vbtn.hidden = true;
      if (music && !music.paused) toggleMusic();
    });
  }

  /* ---------------- screenshot carousel ---------------- */
  var car = document.querySelector('.car');
  if (car) {
    var track = car.querySelector('.car-track'), slides = [].slice.call(track.children), dots = car.querySelector('.dots'), cur = -1, raf = 0;
    slides.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', String(i + 1));
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
    });
    function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); var s = slides[i]; track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); }
    function upd() {
      raf = 0;
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
      slides.forEach(function (s, i) {
        var c = s.offsetLeft + s.offsetWidth / 2, d = (c - mid) / (s.offsetWidth + 20);
        var cd = Math.max(-1.6, Math.min(1.6, d));
        s.style.setProperty('--d', cd.toFixed(3)); s.style.setProperty('--ad', Math.min(1, Math.abs(cd)).toFixed(3));
        if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
      });
      if (best !== cur) { cur = best; [].forEach.call(dots.children, function (b, i) { b.setAttribute('aria-current', String(i === cur)); }); }
    }
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    addEventListener('resize', upd);
    car.querySelector('.prev').addEventListener('click', function () { go(cur - 1); });
    car.querySelector('.next').addEventListener('click', function () { go(cur + 1); });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } });
    upd();
    requestAnimationFrame(function () { var i0 = innerWidth >= 900 ? 1 : 0; var s0 = slides[i0]; track.scrollLeft = s0.offsetLeft - (track.clientWidth - s0.offsetWidth) / 2; upd(); });
  }

  /* ---------------- boss marquee: duplicate the row for a seamless loop ---------------- */
  document.querySelectorAll('.mq-track').forEach(function (tr) {
    [].slice.call(tr.children).forEach(function (n) { var c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); tr.appendChild(c); });
  });

  /* ---------------- final menu replica: layered parallax ---------------- */
  var menu = document.querySelector('.menu');
  if (menu && !reduce) addEventListener('scroll', function () {
    var r = menu.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    menu.style.setProperty('--p', ((r.top + r.height / 2 - innerHeight / 2) / innerHeight).toFixed(3));
  }, { passive: true });

  /* ---------------- music (muted by default, loads only on first tap) ---------------- */
  var snd = document.querySelector('.snd'), music = null;
  function toggleMusic() {
    if (!music) { music = new Audio(snd.getAttribute('data-src')); music.loop = true; music.volume = 0.45; }
    if (music.paused) { music.play().then(function () { snd.setAttribute('aria-pressed', 'true'); }).catch(function () {}); }
    else { music.pause(); snd.setAttribute('aria-pressed', 'false'); }
  }
  if (snd) snd.addEventListener('click', toggleMusic);

  setLang(root.lang, false);
})();
