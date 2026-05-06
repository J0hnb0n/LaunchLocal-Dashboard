(() => {
  'use strict';

  // --- Mobile nav toggle ---------------------------------------------------
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // --- Open/closed indicator ----------------------------------------------
  // Hours are identical every day: 9:00 AM – 11:00 PM local time.
  const openEl = document.getElementById('openStatus');
  if (openEl) {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const nowMinutes = hour * 60 + minutes;
    const openAt = 9 * 60;
    const closeAt = 23 * 60;
    if (nowMinutes >= openAt && nowMinutes < closeAt) {
      openEl.textContent = 'Open now';
    } else {
      openEl.textContent = 'Closed now';
    }
  }

  // --- Footer year ---------------------------------------------------------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Contact form: client-side validation + friendly mailto fallback -----
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');

  if (form && note) {
    form.addEventListener('submit', (e) => {
      const name = form.querySelector('#cf-name');
      const email = form.querySelector('#cf-email');

      let valid = true;
      note.classList.remove('error');
      note.textContent = '';

      if (!name.value.trim()) {
        valid = false;
        note.textContent = 'Please add your name so we know who to reply to.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        valid = false;
        note.textContent = 'That email address doesn\u2019t look quite right \u2014 could you double-check?';
      }

      if (!valid) {
        e.preventDefault();
        note.classList.add('error');
      } else {
        note.textContent = 'Opening your email app to send the enquiry\u2026';
      }
    });
  }
})();
