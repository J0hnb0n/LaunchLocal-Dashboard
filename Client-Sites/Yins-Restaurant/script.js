/* Yin's Restaurant — site interactivity */

(() => {
  'use strict';

  // -------- Mobile nav toggle --------
  const nav = document.querySelector('.primary-nav');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  if (toggle && nav && menu) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Close on link click (mobile)
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // -------- Open / Closed indicator --------
  // Hours: every day 9:00 AM – 5:00 PM, local time of the visitor.
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (statusDot && statusText) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const openMinutes = 9 * 60;       // 9:00 AM
    const closeMinutes = 17 * 60;     // 5:00 PM

    const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    if (isOpen) {
      statusDot.classList.remove('closed');
      statusText.innerHTML = 'Open now &middot; closes at 5:00 PM';
    } else {
      statusDot.classList.add('closed');
      const opensSoon = currentMinutes < openMinutes;
      statusText.innerHTML = opensSoon
        ? 'Closed now &middot; opens at 9:00 AM'
        : 'Closed now &middot; opens tomorrow at 9:00 AM';
    }
  }

  // -------- Copyright year --------
  const copyYear = document.getElementById('copyYear');
  if (copyYear) {
    copyYear.textContent = String(new Date().getFullYear());
  }

  // -------- Contact form --------
  // Uses a mailto: action by default. Document upgrade path to Formspree/Netlify
  // Forms in README.md when client provides an inbox.
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (form && status) {
    form.addEventListener('submit', (e) => {
      const name = form.querySelector('#name');
      const phone = form.querySelector('#phone');

      // Simple client-side validation
      if (!name.value.trim() || !phone.value.trim()) {
        e.preventDefault();
        status.textContent = 'Please fill in your name and phone number so we can get back to you.';
        status.className = 'form-status error';
        return;
      }

      // Confirm to user — mailto will open their email client
      status.textContent = 'Opening your email app to send the request…';
      status.className = 'form-status success';
    });
  }

})();
