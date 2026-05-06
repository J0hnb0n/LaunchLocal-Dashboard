(() => {
  'use strict';

  /* ---------- Theme (light/dark) ---------- */
  const THEME_KEY = 'jdd-theme';
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');

  const getPreferredTheme = () => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (toggle) {
      toggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  applyTheme(getPreferredTheme());

  toggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const navEl = document.querySelector('.site-nav');
  const navMenu = document.getElementById('navMenu');

  navToggle?.addEventListener('click', () => {
    const open = navEl.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navMenu?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navEl.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Header chicken mascot: play once, replay on hover ---------- */
  const mascot = document.querySelector('.brand-video-header');
  if (mascot) {
    mascot.loop = false;
    const playOnce = () => {
      try {
        mascot.currentTime = 0;
        const p = mascot.play();
        if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay blocked — will play on hover */ });
      } catch (_) { /* no-op */ }
    };

    // First play: after the video can actually play.
    if (mascot.readyState >= 2) {
      playOnce();
    } else {
      mascot.addEventListener('loadeddata', playOnce, { once: true });
    }

    // Freeze on last frame when the one-shot finishes.
    mascot.addEventListener('ended', () => { mascot.pause(); });

    // Replay on hover / focus.
    const replay = () => {
      if (!mascot.paused && !mascot.ended) return;
      playOnce();
    };
    const parent = mascot.closest('.brand-mark-header') || mascot;
    parent.addEventListener('mouseenter', replay);
    parent.addEventListener('focus', replay);
    parent.addEventListener('touchstart', replay, { passive: true });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Open / closed indicator ---------- */
  const updateOpenStatus = () => {
    const now = new Date();
    const h = now.getHours();
    const isOpen = h >= 9 && h < 17;
    document.querySelectorAll('[data-open-status]').forEach((el) => {
      el.textContent = isOpen ? 'Open now' : 'Closed now';
      el.classList.toggle('is-open', isOpen);
    });
  };
  updateOpenStatus();

  /* ---------- Contact form (mailto-based MVP) ---------- */
  const form = document.querySelector('.contact-form');
  const note = document.getElementById('formNote');

  form?.addEventListener('submit', (e) => {
    const name = form.querySelector('#f-name');
    const message = form.querySelector('#f-message');
    let valid = true;

    [name, message].forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--color-primary)';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!valid) {
      e.preventDefault();
      if (note) {
        note.textContent = 'Please fill in your name and a short message.';
      }
      return;
    }

    if (note) {
      note.textContent = 'Opening your email app — we\'ll get back to you shortly.';
    }
  });

  /* ---------- Smooth-scroll offset for sticky header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = document.querySelector('.site-header')?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
