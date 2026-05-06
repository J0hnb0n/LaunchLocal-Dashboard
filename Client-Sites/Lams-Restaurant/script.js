/* ============================================================
   Lam's Restaurant — script.js
   ============================================================ */

'use strict';

/* ---- FOOTER YEAR ---- */
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---- MOBILE NAV TOGGLE ---- */
const navToggle = document.getElementById('nav-toggle');
const mainNav   = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close nav when a link is clicked
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation menu');
      document.body.style.overflow = '';
    });
  });

  // Close nav on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      navToggle.focus();
    }
  });
}

/* ---- MENU TABS ---- */
const menuTabs   = document.querySelectorAll('.menu-tab');
const menuPanels = document.querySelectorAll('.menu-panel');

menuTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = 'panel-' + tab.dataset.panel;

    menuTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    menuPanels.forEach(p => p.classList.add('hidden'));

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    const panel = document.getElementById(targetId);
    if (panel) panel.classList.remove('hidden');
  });

  // Keyboard: arrow keys to navigate tabs
  tab.addEventListener('keydown', e => {
    const tabs = Array.from(menuTabs);
    const idx  = tabs.indexOf(tab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tabs[(idx + 1) % tabs.length].focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tabs[(idx - 1 + tabs.length) % tabs.length].focus();
    }
  });
});

/* ---- OPEN / CLOSED INDICATOR ---- */
// PLACEHOLDER: Update these hours to match confirmed restaurant hours.
// Format: { open: 24-hour open time, close: 24-hour close time }
// null = closed all day.
const RESTAURANT_HOURS = {
  0: { open: 12, close: 21 }, // Sunday
  1: null,                     // Monday — closed
  2: { open: 11, close: 21 }, // Tuesday
  3: { open: 11, close: 21 }, // Wednesday
  4: { open: 11, close: 21 }, // Thursday
  5: { open: 11, close: 22 }, // Friday
  6: { open: 11, close: 22 }, // Saturday
};

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getOpenStatus() {
  const now     = new Date();
  const day     = now.getDay();
  const hour    = now.getHours() + now.getMinutes() / 60;
  const todayH  = RESTAURANT_HOURS[day];

  if (!todayH) {
    return { open: false, label: 'Closed Today', sub: 'Monday hours: closed' };
  }

  if (hour >= todayH.open && hour < todayH.close) {
    // Find next closing time in readable format
    const closeHour = todayH.close;
    const closeStr  = closeHour === 12 ? '12:00 pm'
                    : closeHour < 12   ? `${closeHour}:00 am`
                    : closeHour === 24 ? '12:00 am'
                    : `${closeHour - 12}:00 pm`;
    return { open: true, label: 'Open Now', sub: `Closes at ${closeStr}` };
  }

  // Find next open day
  for (let i = 1; i <= 7; i++) {
    const nextDay = (day + i) % 7;
    const nextH   = RESTAURANT_HOURS[nextDay];
    if (nextH) {
      const openHour = nextH.open;
      const openStr  = openHour < 12  ? `${openHour}:00 am`
                     : openHour === 12 ? '12:00 pm'
                     : `${openHour - 12}:00 pm`;
      const label = i === 1 ? `Tomorrow ${openStr}` : `${DAY_NAMES[nextDay]} ${openStr}`;
      return { open: false, label: 'Closed', sub: `Opens ${label}` };
    }
  }

  return { open: false, label: 'Closed', sub: '' };
}

function updateOpenStatus() {
  const status = getOpenStatus();

  // Trust bar
  const trustStatus    = document.getElementById('trust-status');
  const trustStatusSub = document.getElementById('trust-status-sub');
  if (trustStatus) {
    trustStatus.textContent = status.label;
    trustStatus.classList.toggle('open',   status.open);
    trustStatus.classList.toggle('closed', !status.open);
  }
  if (trustStatusSub) trustStatusSub.textContent = status.sub;

  // Hours section card
  const hoursStatus = document.getElementById('hours-status');
  if (hoursStatus) hoursStatus.textContent = status.label;
}

updateOpenStatus();
// Refresh every minute so it stays current
setInterval(updateOpenStatus, 60 * 1000);

/* ---- CONTACT FORM VALIDATION ---- */
const contactForm = document.getElementById('contact-form');

if (contactForm) {
  function showError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + '-error');
    if (field) field.classList.add('error');
    if (error) error.textContent = msg;
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + '-error');
    if (field) field.classList.remove('error');
    if (error) error.textContent = '';
  }

  // Live clear errors on input
  ['name', 'phone', 'email', 'message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearError(id));
  });

  contactForm.addEventListener('submit', e => {
    let valid = true;

    const name    = document.getElementById('name');
    const phone   = document.getElementById('phone');
    const email   = document.getElementById('email');
    const message = document.getElementById('message');
    const status  = document.getElementById('form-status');

    clearError('name');
    clearError('phone');
    clearError('email');
    clearError('message');

    if (!name || name.value.trim().length < 2) {
      showError('name', 'Please enter your name.');
      valid = false;
    }
    if (!phone || phone.value.trim().length < 7) {
      showError('phone', 'Please enter a valid phone number.');
      valid = false;
    }
    if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showError('email', 'Please enter a valid email address.');
      valid = false;
    }
    if (!message || message.value.trim().length < 5) {
      showError('message', 'Please enter a message.');
      valid = false;
    }

    if (!valid) {
      e.preventDefault();
      if (status) {
        status.textContent = 'Please fix the errors above.';
        status.className = 'form-status error';
      }
      // Focus the first invalid field
      const firstError = contactForm.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    // Form is valid — mailto will open.
    // If using Formspree: prevent default, submit via fetch, show success message.
    if (status) {
      status.textContent = 'Opening your email client...';
      status.className = 'form-status success';
    }
  });
}

/* ---- STICKY HEADER SHADOW ON SCROLL ---- */
const siteHeader = document.getElementById('site-header');
if (siteHeader) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      siteHeader.style.boxShadow = entry.isIntersecting
        ? 'var(--shadow-sm)'
        : 'var(--shadow-md)';
    },
    { rootMargin: `-${getComputedStyle(document.documentElement)
        .getPropertyValue('--header-h').trim()} 0px 0px 0px` }
  );
  // Observe first section below header
  const hero = document.getElementById('home');
  if (hero) observer.observe(hero);
}
