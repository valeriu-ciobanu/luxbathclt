/* LuxBath Charlotte — site script */
(function () {
  document.documentElement.classList.remove('no-js');

  /* Mobile navigation */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Google Analytics events */
  function track(name, params) {
    if (typeof window.gtag === 'function') {
      params = params || {};
      params.transport_type = 'beacon';
      window.gtag('event', name, params);
    }
  }
  function where(el) {
    if (el.closest('.site-header')) return 'header';
    if (el.closest('.site-footer, footer')) return 'footer';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.cta-band')) return 'cta_band';
    var s = el.closest('section');
    return s && s.id ? s.id : 'body';
  }
  /* Every button that leads to the consultation/contact page */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.btn[href]');
    if (!a || !/(^|\/)contact(\/|\.html)?(#.*)?$/.test(a.getAttribute('href'))) return;
    track('consultation_click', {
      button_text: a.textContent.trim().replace(/\s+/g, ' '),
      button_location: where(a),
      page_path: location.pathname
    });
  });

  /* Year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Gallery filters + lightbox */
  var gallery = document.querySelector('.gallery');
  if (gallery) {
    var items = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-item'));
    var chips = document.querySelectorAll('.chip[data-filter]');
    var subs = document.querySelectorAll('.chip[data-sub]');
    var subRow = document.querySelector('.filters-sub');
    var group = 'all', sub = 'all';
    function applyFilter() {
      items.forEach(function (it) {
        var g = it.getAttribute('data-group'), c = it.getAttribute('data-cat');
        it.hidden = !((group === 'all' || g === group) && (group !== 'bath' || sub === 'all' || c === sub));
      });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === group ? 'true' : 'false'); });
      subs.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-sub') === sub ? 'true' : 'false'); });
      if (subRow) subRow.hidden = group !== 'bath';
    }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        group = chip.getAttribute('data-filter'); sub = 'all'; applyFilter();
        var hash = { all: '', bath: 'bathrooms', kitchen: 'kitchens', builtin: 'built-ins', flooring: 'flooring', outdoor: 'outdoor', process: 'behind-the-tile' }[group];
        if (history.replaceState) history.replaceState(null, '', hash ? '#' + hash : location.pathname + location.search);
      });
    });
    subs.forEach(function (chip) {
      chip.addEventListener('click', function () { sub = chip.getAttribute('data-sub'); applyFilter(); });
    });
    /* Deep links: our-work/#kitchens, #built-ins, #flooring, #bathrooms */
    var fromHash = { bathrooms: 'bath', kitchens: 'kitchen', 'built-ins': 'builtin', flooring: 'flooring', stairs: 'flooring', outdoor: 'outdoor', 'behind-the-tile': 'process' }[location.hash.slice(1)];
    if (fromHash) {
      group = fromHash; applyFilter();
      var filters = document.querySelector('.filters');
      if (filters) setTimeout(function () { filters.scrollIntoView({ block: 'start' }); }, 50);
    }

    var lb = document.querySelector('.lightbox');
    var lbImg = lb.querySelector('.lb-stage img');
    var lbCap = lb.querySelector('.lb-caption');
    var lbCount = lb.querySelector('.lb-count');
    var current = 0;
    function visible() { return items.filter(function (it) { return !it.hidden; }); }
    function show(i) {
      var list = visible();
      current = (i + list.length) % list.length;
      var btn = list[current].querySelector('button');
      lbImg.src = btn.getAttribute('data-full');
      lbImg.alt = btn.querySelector('img').alt;
      lbCap.textContent = btn.querySelector('img').alt;
      lbCount.textContent = (current + 1) + ' / ' + list.length;
    }
    items.forEach(function (it) {
      it.querySelector('button').addEventListener('click', function () {
        show(visible().indexOf(it));
        if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
      });
    });
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) lb.close(); });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* Estimate form
     To receive submissions directly, set data-endpoint on the form to a form service URL
     (for example a Formspree endpoint). Without one, the form opens the visitor's email app
     with everything pre-filled, addressed to the business. */
  var form = document.querySelector('.estimate-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('.hp input').value) return;
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (inp) {
        var f = inp.closest('.field');
        var valid = inp.checkValidity() && inp.value.trim() !== '';
        f.classList.toggle('invalid', !valid);
        if (!valid && ok) { inp.focus(); ok = false; }
      });
      if (!ok) return;

      var data = new FormData(form);
      track('generate_lead', {
        form_name: 'estimate_request',
        project_type: data.get('Project') || '',
        timeline: data.get('Timeline') || '',
        method: form.getAttribute('data-endpoint') ? 'form_service' : 'email_app'
      });
      var endpoint = form.getAttribute('data-endpoint');
      var success = document.querySelector('.form-success');
      function done() { form.hidden = true; success.classList.add('show'); success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

      if (endpoint) {
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Sending…';
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(); done(); })
          .catch(function () {
            btn.disabled = false; btn.textContent = 'Request My Free Estimate';
            alert('Sorry, something went wrong. Please email us at luxbathclt@gmail.com.');
          });
      } else {
        var lines = [];
        data.forEach(function (v, k) { if (k !== 'company' && v) lines.push(k + ': ' + v); });
        var subject = 'Free estimate request — ' + (data.get('Name') || '');
        window.location.href = 'mailto:luxbathclt@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
        done();
      }
    });
    form.querySelectorAll('[required]').forEach(function (inp) {
      inp.addEventListener('input', function () { inp.closest('.field').classList.remove('invalid'); });
    });
  }
})();

/* Local preview: when a page is opened straight from disk (file://), browsers show a folder
   listing for links like "services/". Point them at the matching page file instead.
   Has no effect once the site is hosted. */
(function () {
  if (location.protocol !== 'file:') return;
  var atRoot = !/\/(our-work|services|contact|gallery|about)\/(index\.html)?$/.test(location.pathname);
  document.querySelectorAll('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    var m = h.match(/^(\.\.\/|\.\/)?(about|our-work|services|contact)?\/?(#.*)?$/);
    if (!m || /^[a-z]+:/i.test(h) || h.charAt(0) === '#') return;
    var page = m[2], hash = m[3] || '';
    if (!page && !m[1]) return;
    var prefix = atRoot ? '' : '../';
    a.setAttribute('href', prefix + (page ? page + '.html' : 'index.html') + hash);
  });
})();
