document.addEventListener('DOMContentLoaded', () => {

  /* ---- Mobile hamburger ---- */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav  = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-nav a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---- Active nav link ---- */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-list > li > a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.closest('li').classList.add('active');
    }
  });

  /* ---- Counter animation on stats ---- */
  const counters = document.querySelectorAll('.stat-num[data-target], .sc-num[data-target]');
  if (counters.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const dur    = 1600;
        const step   = Math.ceil(dur / 60);
        let current  = 0;
        const inc    = Math.ceil(target / (dur / step));
        const timer  = setInterval(() => {
          current = Math.min(current + inc, target);
          el.textContent = current + suffix;
          if (current >= target) clearInterval(timer);
        }, step);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
  }

  /* ---- Sticky header shadow on scroll ---- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 4px 20px rgba(0,0,0,.13)' : '0 2px 12px rgba(0,0,0,.08)';
    }, { passive: true });
  }

  /* ---- Smooth reveal on scroll ---- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    reveals.forEach(r => ro.observe(r));
  }

  /* ---- Flip cards: tap su mobile ---- */
  document.querySelectorAll('.fc').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });

  /* ============================================================
     SCROLL STORY — video scrubbing
     ============================================================ */
  (function () {
    const section = document.querySelector('.scroll-story');
    if (!section) return;

    const video  = section.querySelector('.scrub-video');
    const panels = section.querySelectorAll('.story-panel');
    const dots   = section.querySelectorAll('.story-dot');

    // Panel timing as [startFraction, endFraction] of total scroll
    // Panel 3 intentionally wider (0.48-0.82 = 34%) vs ~27% for others
    const TIMINGS = [
      [0.00, 0.28],
      [0.25, 0.52],
      [0.48, 0.82],
      [0.78, 1.00],
    ];

    function getProgress() {
      const rect      = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      return Math.max(0, Math.min(1, -rect.top / scrollable));
    }

    function showPanel(p) {
      let active = -1;
      panels.forEach((panel, i) => {
        const on = p >= TIMINGS[i][0] && p <= TIMINGS[i][1];
        panel.classList.toggle('visible', on);
        if (on) active = i;
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === active));
    }

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (!isMobile) {
      /* ---------- DESKTOP: scrub on scroll ---------- */
      video.pause();
      let raf = false;

      function scrub() {
        const p = getProgress();
        if (video.readyState >= 2 && video.duration) {
          const t = p * video.duration;
          // fastSeek is Firefox-only; fallback to currentTime for Chrome/Safari
          try { video.fastSeek(t); } catch (_) { video.currentTime = t; }
        }
        showPanel(p);
        raf = false;
      }

      window.addEventListener('scroll', () => {
        if (raf) return;
        raf = true;
        requestAnimationFrame(scrub);
      }, { passive: true });

      video.addEventListener('loadedmetadata', () => showPanel(getProgress()));
      showPanel(0);

    } else {
      /* ---------- MOBILE: autoplay + timed panels ---------- */
      video.muted     = true;
      video.autoplay  = true;
      video.loop      = true;
      video.playsInline = true;

      // ms each panel stays visible (panel 3 = 4500ms, others = 2800ms)
      const DURATIONS = [2800, 2800, 4500, 2800];
      let current = 0;
      let timer   = null;

      function cycle() {
        panels.forEach(p => p.classList.remove('visible'));
        dots.forEach(d => d.classList.remove('active'));
        panels[current].classList.add('visible');
        dots[current].classList.add('active');
        timer = setTimeout(() => {
          current = (current + 1) % panels.length;
          cycle();
        }, DURATIONS[current]);
      }

      // Start cycling only when section enters viewport
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            video.play().catch(() => {});
            current = 0;
            cycle();
          } else {
            clearTimeout(timer);
            panels.forEach(p => p.classList.remove('visible'));
            dots.forEach(d => d.classList.remove('active'));
          }
        });
      }, { threshold: 0.25 });
      io.observe(section);
    }
  })();

  /* ---- Org avatar lightbox ---- */
  (function () {
    const avatarImgs = document.querySelectorAll('.org2-avatar img');
    if (!avatarImgs.length) return;

    // Build overlay once
    const overlay = document.createElement('div');
    overlay.id = 'org-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const bigImg = document.createElement('img');
    overlay.appendChild(bigImg);
    document.body.appendChild(overlay);

    function open(src, alt, pos) {
      bigImg.src = src;
      bigImg.alt = alt;
      bigImg.style.objectPosition = pos || 'center top';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    avatarImgs.forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        open(el.src, el.alt, el.style.objectPosition);
      });
    });

    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  })();
});
