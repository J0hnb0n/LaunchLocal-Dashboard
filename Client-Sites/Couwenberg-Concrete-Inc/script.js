/* Couwenberg Concrete — script.js
   Mobile nav, smooth-scroll close on tap, FAQ single-open behaviour, form validation. */

(() => {
  'use strict';

  // ---------- Year in footer ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Mobile nav ----------
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    const close = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('is-open');
      isOpen ? close() : open();
    });

    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    const mql = window.matchMedia('(min-width: 768px)');
    mql.addEventListener('change', (e) => { if (e.matches) close(); });
  }

  // ---------- FAQ: close siblings when one opens ----------
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  // ---------- Quote form validation ----------
  const form = document.getElementById('quoteForm');
  const note = document.getElementById('formNote');

  if (form && note) {
    const setNote = (msg, state) => {
      note.textContent = msg;
      note.classList.remove('is-success', 'is-error');
      if (state) note.classList.add(`is-${state}`);
    };

    const isPhone = (v) => /[0-9]{3}[^0-9]*[0-9]{3}[^0-9]*[0-9]{4}/.test(v);
    const isEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    form.addEventListener('submit', (e) => {
      const name  = form.elements.name;
      const phone = form.elements.phone;
      const email = form.elements.email;

      let ok = true;
      [name, phone, email].forEach(el => el.setAttribute('aria-invalid', 'false'));

      if (!name.value.trim()) {
        name.setAttribute('aria-invalid', 'true'); ok = false;
      }
      if (!isPhone(phone.value)) {
        phone.setAttribute('aria-invalid', 'true'); ok = false;
      }
      if (!isEmail(email.value.trim())) {
        email.setAttribute('aria-invalid', 'true'); ok = false;
      }

      if (!ok) {
        e.preventDefault();
        setNote('Please check the highlighted fields and try again.', 'error');
        const first = form.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        return;
      }

      setNote('Opening your email app — thanks, talk soon.', 'success');
    });
  }

  // ---------- Header shadow on scroll ----------
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.style.boxShadow = window.scrollY > 4 ? '0 2px 12px rgba(0,0,0,.08)' : 'none';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
