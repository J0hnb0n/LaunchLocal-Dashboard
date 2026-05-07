/* Lily's Tacos — interactivity
   - Theme toggle (persists to localStorage)
   - Mobile nav drawer
   - "Open now" indicator on home hero
   - Reservation form mailto handoff with client-side validation
*/

(function () {
  'use strict';

  /* ---------- Theme toggle ---------- */
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    const updateLabel = () => {
      const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      themeToggle.setAttribute(
        'aria-label',
        current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
      themeToggle.setAttribute('aria-pressed', current === 'dark' ? 'true' : 'false');
    };
    updateLabel();

    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (_) { /* private mode */ }
      updateLabel();
    });
  }

  /* ---------- Mobile nav ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuToggle && mobileNav) {
    const closeNav = () => {
      mobileNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };
    menuToggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileNav.addEventListener('click', (e) => {
      if (e.target.matches('a')) closeNav();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------- Open-now indicator ----------
     Hours per operator brief: Mon–Sun 9:00 AM – 5:00 PM.
     If the client confirms different hours, update this map and the
     hours-list/JSON-LD in markup. */
  const HOURS = {
    0: { open: 9, close: 17 }, // Sun
    1: { open: 9, close: 17 }, // Mon
    2: { open: 9, close: 17 }, // Tue
    3: { open: 9, close: 17 }, // Wed
    4: { open: 9, close: 17 }, // Thu
    5: { open: 9, close: 17 }, // Fri
    6: { open: 9, close: 17 }  // Sat
  };
  const openNow = document.querySelector('[data-open-now]');
  if (openNow) {
    const now = new Date();
    const today = HOURS[now.getDay()];
    const hour = now.getHours() + now.getMinutes() / 60;
    const isOpen = today && hour >= today.open && hour < today.close;
    openNow.textContent = isOpen ? 'Open now' : 'Closed — opens 9:00 AM';
    openNow.dataset.state = isOpen ? 'open' : 'closed';
  }

  /* ---------- Reservation / contact form ---------- */
  const form = document.querySelector('form[data-form="reservation"]');
  if (form) {
    const feedback = form.querySelector('.form__feedback');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const phone = (data.get('phone') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const date = (data.get('date') || '').toString().trim();
      const time = (data.get('time') || '').toString().trim();
      const party = (data.get('party') || '').toString().trim();
      const notes = (data.get('notes') || '').toString().trim();

      if (!name || !phone || !date || !time || !party) {
        if (feedback) {
          feedback.textContent = 'Please fill in name, phone, date, time, and party size so we can confirm your table.';
          feedback.className = 'form__feedback';
          feedback.style.display = 'block';
          feedback.style.background = 'rgba(184, 71, 42, 0.10)';
          feedback.style.color = 'var(--color-primary)';
          feedback.style.border = '1px solid var(--color-primary)';
        }
        return;
      }

      const subject = encodeURIComponent(`Reservation request — ${name} (${party})`);
      const body = encodeURIComponent(
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Email: ${email || '(none provided)'}\n` +
        `Date: ${date}\n` +
        `Time: ${time}\n` +
        `Party size: ${party}\n` +
        `Notes: ${notes || '(none)'}\n\n` +
        `— Sent from lilystacos.com reservation form`
      );

      const recipient = form.dataset.recipient || 'reservations@lilystacos.com';
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;

      if (feedback) {
        feedback.textContent = 'Opening your email app to send the reservation request. If nothing happens, please call (519) 428-3097 directly.';
        feedback.className = 'form__feedback is-success';
      }
    });
  }
})();
