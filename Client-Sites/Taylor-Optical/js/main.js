/* ============================================================
   TAYLOR OPTICAL — main.js
   Handles: nav scroll state, mobile menu, scroll reveal,
            smooth scroll offset, form submission, active nav
   ============================================================ */

'use strict';

// ── DOM REFS ──────────────────────────────────────────────────
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
const bookForm  = document.getElementById('book-form');
const formSuccess = document.getElementById('form-success');
const dateInput = document.getElementById('pref-date');

// ── NAV: Scroll state ──────────────────────────────────────────
let ticking = false;

function onNavScroll() {
  if (window.scrollY > 55) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      onNavScroll();
      highlightActiveSection();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// Initialise on load
onNavScroll();

// ── NAV: Mobile hamburger ──────────────────────────────────────
hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen.toString());
  // Prevent body scroll when menu open
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close menu on nav link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Close menu on outside click
document.addEventListener('click', (e) => {
  if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !hamburger.contains(e.target)) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
});

// ── SCROLL REVEAL (IntersectionObserver) ──────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -48px 0px'
});

document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));

// ── SMOOTH SCROLL with nav offset ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
    const top  = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── ACTIVE NAV HIGHLIGHT ────────────────────────────────────────
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const pageSections = document.querySelectorAll('section[id]');

function highlightActiveSection() {
  const scrollPos = window.scrollY + 100;
  let current = '';

  pageSections.forEach(section => {
    if (section.offsetTop <= scrollPos) {
      current = section.getAttribute('id');
    }
  });

  navAnchors.forEach(a => {
    a.classList.remove('active');
    if (current && a.getAttribute('href') === `#${current}`) {
      a.classList.add('active');
    }
  });
}

// ── BOOKING FORM: Set min date to today ───────────────────────
if (dateInput) {
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  dateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);

  // Disable Sundays and Mondays in date input via datelist (lightweight approach)
  dateInput.addEventListener('input', () => {
    const chosen = new Date(dateInput.value + 'T00:00:00');
    const day = chosen.getDay(); // 0=Sun, 1=Mon
    if (day === 0 || day === 1) {
      dateInput.setCustomValidity('Taylor Optical is closed on Sundays and Mondays. Please choose another day.');
    } else {
      dateInput.setCustomValidity('');
    }
  });
}

// ── BOOKING FORM: Submission ───────────────────────────────────
if (bookForm) {
  bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = bookForm.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      field.classList.remove('error');
      if (!field.value.trim()) {
        field.classList.add('error');
        isValid = false;
      }
    });

    if (!isValid) {
      const firstError = bookForm.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }

    // Gather form data
    const formData = {
      firstName:   bookForm.querySelector('#first-name').value.trim(),
      lastName:    bookForm.querySelector('#last-name').value.trim(),
      email:       bookForm.querySelector('#email').value.trim(),
      phone:       bookForm.querySelector('#phone').value.trim(),
      service:     bookForm.querySelector('#service').value,
      prefDate:    bookForm.querySelector('#pref-date').value,
      prefTime:    bookForm.querySelector('#pref-time').value,
      notes:       bookForm.querySelector('#notes').value.trim(),
      submittedAt: new Date().toISOString(),
    };

    // Show loading state
    const submitBtn = bookForm.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    /*
     * ══════════════════════════════════════════════════════════
     * TODO: Replace the setTimeout simulation below with a real
     * backend integration. Choose one of:
     *
     * ── OPTION A: Firebase Firestore (Recommended) ────────────
     *   1. Create Firebase project "taylor-optical" at console.firebase.google.com
     *   2. Enable Firestore in test mode
     *   3. Add Firebase SDK via CDN (add to index.html <head>):
     *      <script src="https://www.gstatic.com/firebasejs/10.x/firebase-app-compat.js"></script>
     *      <script src="https://www.gstatic.com/firebasejs/10.x/firebase-firestore-compat.js"></script>
     *   4. Initialize and use:
     *
     *   const app = firebase.initializeApp({ /* firebaseConfig from console * / });
     *   const db  = firebase.firestore();
     *   await db.collection('appointments').add(formData);
     *
     * ── OPTION B: EmailJS (no backend needed) ─────────────────
     *   1. Create account at emailjs.com
     *   2. Add EmailJS SDK: <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
     *   3. Replace simulation with:
     *
     *   await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', formData, 'YOUR_PUBLIC_KEY');
     *
     * ── OPTION C: Calendly Embed ───────────────────────────────
     *   Replace the entire #book section form with:
     *   <div class="calendly-inline-widget"
     *        data-url="https://calendly.com/tayloroptical/eye-exam"
     *        style="min-width:320px;height:700px;">
     *   </div>
     *   <script src="https://assets.calendly.com/assets/external/widget.js"></script>
     * ══════════════════════════════════════════════════════════
     */

    // SIMULATION (remove when real integration is added)
    await new Promise(resolve => setTimeout(resolve, 1100));

    console.log('Appointment request:', formData);

    // Show success state
    bookForm.hidden = true;
    formSuccess.hidden = false;
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Reset button (in case user navigates back)
    submitBtn.textContent = originalLabel;
    submitBtn.disabled = false;
  });

  // Clear error on input
  bookForm.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => field.classList.remove('error'));
  });
}

// ── BRANDS MARQUEE: Reduced motion ────────────────────────────
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const track = document.querySelector('.marquee-track');
  if (track) track.style.animationPlayState = 'paused';
}

// ── BRANDS MARQUEE: Pause on focus (accessibility) ────────────
const marqueeTrack = document.getElementById('marquee-track');
if (marqueeTrack) {
  marqueeTrack.querySelectorAll('img').forEach(img => {
    img.addEventListener('focus', () => {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    img.addEventListener('blur', () => {
      marqueeTrack.style.animationPlayState = 'running';
    });
  });
}

// ── KEYBOARD NAVIGATION: Escape closes mobile nav ─────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  }
});

console.log('%cTaylor Optical — Site by Woodley Creative', `
  background: #0d1b2a;
  color: #c9a84c;
  padding: 8px 16px;
  font-size: 13px;
  font-family: Georgia, serif;
`);
