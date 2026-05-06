// Winston Fibres Co. — site scripts
// Mobile nav, contact form handling, and sale-page inline editor.

(() => {
  'use strict';

  /* -------- Mobile nav toggle -------- */
  const toggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      const open = navList.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    navList.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* -------- Contact form (mailto fallback + inline status) -------- */
  const form = document.querySelector('form[data-contact]');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();
      if (!name || !email || !message) {
        if (status) { status.textContent = 'Please fill in all required fields.'; status.className = 'form-status err'; }
        return;
      }
      const subject = encodeURIComponent(`New inquiry from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${data.get('phone') || '—'}\nTopic: ${data.get('topic') || '—'}\n\n${message}`
      );
      window.location.href = `mailto:hello@winstonfibresco.com?subject=${subject}&body=${body}`;
      if (status) {
        status.textContent = 'Opening your email app — thank you! If nothing happens, email us directly.';
        status.className = 'form-status ok';
      }
      form.reset();
    });
  }

  /* -------- Sale page editor --------
     Owner toggles "Edit mode" to tweak text inline; changes persist to
     localStorage so she can preview before sending updates for a real
     publish. Not a replacement for a CMS — see README.
  */
  const STORAGE_KEY = 'wfc-sale-content-v1';
  const editToggle = document.getElementById('edit-mode-toggle');
  const saleRoot = document.getElementById('sale-items');
  const saveStatus = document.getElementById('save-status');
  const resetBtn = document.getElementById('reset-edits');

  if (editToggle && saleRoot) {
    // Restore saved edits.
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      saleRoot.querySelectorAll('[data-field]').forEach(el => {
        const key = el.getAttribute('data-field');
        if (key && typeof saved[key] === 'string') el.textContent = saved[key];
      });
    } catch { /* corrupt storage — ignore */ }

    const setEditable = (on) => {
      document.body.classList.toggle('edit-mode', on);
      saleRoot.querySelectorAll('[data-field]').forEach(el => {
        if (on) {
          el.setAttribute('contenteditable', 'true');
          el.setAttribute('spellcheck', 'true');
        } else {
          el.removeAttribute('contenteditable');
        }
      });
    };

    editToggle.addEventListener('change', () => setEditable(editToggle.checked));

    let saveTimer;
    saleRoot.addEventListener('input', (e) => {
      const el = e.target.closest('[data-field]');
      if (!el) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const payload = {};
        saleRoot.querySelectorAll('[data-field]').forEach(node => {
          payload[node.getAttribute('data-field')] = node.textContent.trim();
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
          if (saveStatus) {
            saveStatus.textContent = 'Saved locally ✓';
            setTimeout(() => { if (saveStatus) saveStatus.textContent = ''; }, 1800);
          }
        } catch {
          if (saveStatus) saveStatus.textContent = 'Could not save — storage full?';
        }
      }, 400);
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!confirm('Reset all sale-page edits to the original text?')) return;
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      });
    }
  }

  /* -------- Current year in footer -------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  /* -------- Theme toggle (dark / light) --------
     - Reads prefers-color-scheme on first load
     - Persists choice to localStorage
     - Applies via data-theme on <html>
  */
  const THEME_KEY = 'wfc-theme';
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', initialTheme);

  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    const sync = () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    sync();
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
      sync();
    });
  });

  /* -------- Scroll-in reveal animation --------
     Adds `.in-view` to `.reveal` elements when they scroll into view.
  */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* -------- Horizontal scroll-row arrow controls -------- */
  document.querySelectorAll('[data-scroll-row]').forEach(row => {
    const prev = document.querySelector(`[data-scroll-prev="${row.dataset.scrollRow}"]`);
    const next = document.querySelector(`[data-scroll-next="${row.dataset.scrollRow}"]`);
    if (prev || next) {
      const step = () => Math.max(260, row.clientWidth * 0.8);
      prev && prev.addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
      next && next.addEventListener('click', () => row.scrollBy({ left:  step(), behavior: 'smooth' }));
    }
  });

  /* -------- Auto-scrolling looping carousel --------
     For any [data-scroll-auto] row: duplicates its children once so the
     scroll loops seamlessly, then advances scrollLeft on rAF — content
     slides leftward (new items enter from the right). Pauses on hover,
     touch, focus, wheel, or arrow-button click; resumes when the user
     leaves.
  */
  document.querySelectorAll('[data-scroll-auto]').forEach(row => {
    const speed = parseFloat(row.dataset.scrollSpeed) || 1.2; // px per frame (~72 px/s at 60fps)

    // Duplicate children once so the loop seam is invisible.
    const originals = Array.from(row.children);
    originals.forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      clone.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
      row.appendChild(clone);
    });

    let paused = false;
    let resumeTimer;
    const pause = (ms) => {
      paused = true;
      if (ms) {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => { paused = false; }, ms);
      }
    };
    const resume = () => { clearTimeout(resumeTimer); paused = false; };

    row.addEventListener('mouseenter', () => paused = true);
    row.addEventListener('mouseleave', resume);
    row.addEventListener('focusin', () => paused = true);
    row.addEventListener('focusout', resume);
    row.addEventListener('touchstart', () => pause(2500), { passive: true });
    row.addEventListener('wheel', () => pause(2500), { passive: true });

    // Pause when arrow buttons are clicked, then resume after the smooth-scroll settles.
    const id = row.dataset.scrollRow;
    if (id) {
      document.querySelectorAll(`[data-scroll-prev="${id}"], [data-scroll-next="${id}"]`)
        .forEach(b => b.addEventListener('click', () => pause(2500)));
    }

    // Track position in JS so sub-pixel speeds accumulate correctly —
    // direct scrollLeft assignment quantizes to integers in most browsers.
    let pos = 0;
    const tick = () => {
      if (!paused && row.scrollWidth > row.clientWidth) {
        const half = row.scrollWidth / 2;
        pos += speed;
        if (pos >= half) pos -= half;
        row.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();

/* ============================================================
   Shop: product catalogue, detail modal, and cart drawer
   ============================================================ */
(() => {
  'use strict';

  /* Hand-dyed yarn bases — each named for a studio dog. Order = lightest -> heaviest.
     Editing this catalog updates the modal tooltips, the yarn-base guide table on the
     shop and FAQ pages, and the default offering for every standard colourway. */
  const YARNS = {
    'Bonnie': {
      weightClass: 'Lace',
      alsoCalled: 'Cobweb · light fingering',
      material: '70% Super Kid Mohair · 30% Silk · single ply',
      yardage: '437y / 400m · 50g',
      gauge: '32–40 sts / 10cm',
      needles: '1.5–2.25',
      bestFor: 'Held with another yarn, halo shawls, lightweight knits'
    },
    'Maisy': {
      weightClass: 'Fingering',
      alsoCalled: 'Sock · 4-ply',
      material: '100% Superwash Merino · single ply',
      yardage: '434y / 396m · 115g',
      gauge: '28–32 sts / 10cm',
      needles: '2.25–3.25',
      bestFor: 'Shawls, lightweight sweaters, colourway showcases'
    },
    'Giddeon': {
      weightClass: 'Fingering',
      alsoCalled: 'Classic sock · 3-ply',
      material: '75% Superwash Merino · 25% Nylon · 3 ply',
      yardage: '420y / 384m · 115g',
      gauge: '28–32 sts / 10cm',
      needles: '2.25–3.25',
      bestFor: 'Socks, shawls, hard-wearing accessories'
    },
    'Gertrude': {
      weightClass: 'Fingering',
      alsoCalled: 'Sock · 3-ply',
      material: '100% Eco-Processed Merino · 3 ply',
      yardage: 'Limited base',
      gauge: '28–32 sts / 10cm',
      needles: '2.25–3.25',
      bestFor: 'Special projects, soft hand, beautiful stitch definition'
    },
    'Piper': {
      weightClass: 'DK',
      alsoCalled: 'Light worsted · double knit',
      material: '75% Superwash Merino · 25% Nylon · 3 ply',
      yardage: '126y / 115m · 115g',
      gauge: '22–24 sts / 10cm',
      needles: '3.75–4.5',
      bestFor: 'Socks, sweaters, hats, mitts — the workhorse'
    },
    'Barley': {
      weightClass: 'Worsted',
      alsoCalled: 'Medium · afghan · aran',
      material: '100% Superwash Merino · 4 ply',
      yardage: '219y / 200m · 100g',
      gauge: '16–22 sts / 10cm',
      needles: '4.5–5.5',
      bestFor: 'Sweaters, blankets, mittens — your sweater yarn'
    },
    'Bindi': {
      weightClass: 'Bulky',
      alsoCalled: 'Chunky · luxe blend',
      material: '80% Merino · 10% Cashmere · 10% Silk · single ply',
      yardage: '140y / 128m · 115g',
      gauge: '12–16 sts / 10cm',
      needles: '5.5–8',
      bestFor: 'Cozy sweaters, statement scarves, indulgent gifts'
    },
    'Ellie': {
      weightClass: 'Super Bulky',
      alsoCalled: 'Super chunky · roving',
      material: '100% Superwash Merino · single ply',
      yardage: '126y / 115m · 115g',
      gauge: '7–11 sts / 10cm',
      needles: '8–12.75',
      bestFor: 'Quick projects, weekend throws, statement cowls'
    }
  };

  /* Default offering per colourway — every standard colourway gets all 8 yarns
     at these prices. Override per product via Manage Site -> Inventory. */
  const STANDARD_YARNS = [
    { name: 'Bonnie',   price: 28 },
    { name: 'Maisy',    price: 32 },
    { name: 'Giddeon',  price: 32 },
    { name: 'Gertrude', price: 32 },
    { name: 'Piper',    price: 32 },
    { name: 'Barley',   price: 34 },
    { name: 'Bindi',    price: 37 },
    { name: 'Ellie',    price: 37 }
  ];

  /* Migration: old weight-class names -> new dog names. Used to upgrade
     pre-existing localStorage data (cart entries, sizesOOS toggles, custom
     product weights). Entries with no mapping (Sport, Aran) are dropped. */
  const YARN_MIGRATION = {
    'Lace':             'Bonnie',
    'Fingering / Sock': 'Giddeon',
    'Sport':            null,
    'DK':               'Piper',
    'Worsted':          'Barley',
    'Aran':             null,
    'Bulky':            'Bindi'
  };
  const migrateYarnName = (name) => (
    Object.prototype.hasOwnProperty.call(YARN_MIGRATION, name) ? YARN_MIGRATION[name] : name
  );

  /* One-line tooltip for hovering a yarn name in the product modal. */
  const yarnTipText = (yarnName) => {
    const y = YARNS[yarnName];
    return y ? (y.weightClass + ' · ' + y.material + ' · ' + y.yardage) : '';
  };

  const PRODUCTS = {
    'potpourri': {
      name: 'Potpourri',
      tagline: 'Variegated · warm spice tones',
      description: 'Soft dusty rose pink with mossy green and chestnut brown speckles.',
      images: ['assets/products/potpourri.jpg', 'assets/products/potpourri-2.jpg'],
      weights: STANDARD_YARNS
    },
    'forest-floor': {
      name: 'Forest Floor',
      tagline: 'Speckled · earthy greens and browns',
      description: 'Mossy greens, soft browns, and golden tones reminiscent of woodland scenery.',
      images: ['assets/products/forest-floor.jpg', 'assets/products/forest-floor-2.jpg'],
      weights: STANDARD_YARNS
    },
    'birch-bark': {
      name: 'Birch Bark',
      tagline: 'Speckled · cream and rust',
      description: 'Soft greys and earthy browns capturing autumn woodland aesthetics.',
      images: ['assets/products/birch-bark.jpg', 'assets/products/birch-bark-2.jpg'],
      weights: STANDARD_YARNS
    },
    'little-mermaid': {
      name: 'The Little Mermaid',
      tagline: 'Variegated · teal and violet',
      description: 'Lavender purple base with teal and pink speckles, inspired by the Disney character.',
      images: ['assets/products/little-mermaid.jpg', 'assets/products/little-mermaid-2.jpg'],
      weights: STANDARD_YARNS
    },
    'broody-hen': {
      name: 'Broody Hen',
      tagline: 'Tonal · warm amber-brown',
      description: 'Dark-feathered colourway inspired by a farm chicken rescue.',
      images: ['assets/products/broody-hen.jpg', 'assets/products/broody-hen-2.jpg'],
      weights: STANDARD_YARNS
    },
    'robins-egg': {
      name: "Robin's Egg",
      tagline: 'Tonal · soft blue with sandy speckles',
      description: 'Soft sky blues with speckles of sandy brown — like twigs and fluff tucked around something precious.',
      images: ['assets/products/robins-egg.jpg', 'assets/products/robins-egg-2.jpg'],
      weights: STANDARD_YARNS
    },
    'rainbow-dash': {
      name: 'Rainbow Dash',
      tagline: 'Variegated · bright rainbow',
      description: 'Teal skies, hazy purples, a dash of green, and confetti speckles of pink, orange, and violet.',
      images: ['assets/products/rainbow-dash.jpg', 'assets/products/rainbow-dash-2.jpg'],
      weights: STANDARD_YARNS
    },
    'spring-peony': {
      name: 'Spring Peony',
      tagline: 'Speckled · cream with mauve, pink, and yellow',
      description: 'Cream base with speckles of mauve, pink, cherry, and sunny yellow that knit up without pooling. A bestselling colourway.',
      images: ['assets/products/spring-peony.jpg', 'assets/products/spring-peony-2.jpg'],
      weights: STANDARD_YARNS
    },
    'bulky-wool-mohair': {
      name: 'Bulky Wool / Mohair',
      tagline: 'Super Bulky · undyed natural cream',
      description: 'Single-ply bulky yarn (100g / 163y) made from 80% super kid mohair, 10% silk, and 10% eco-wool. Soft halo effect.',
      images: ['assets/products/bulky-wool-mohair.jpg', 'assets/products/bulky-wool-mohair-2.jpg'],
      weights: [{ name: 'Super Bulky · 100g / 163y', price: 33 }]
    },
    'single-sock-kit': {
      name: 'OG Single Sock Kit',
      tagline: 'The Sock Project · 1 full skein + 2 minis',
      description: 'One full-sized sock skein plus two coordinating minis, hand-dyed individually as part of the Sock Project. Pick the colour scheme you want me to dye toward.',
      images: ['assets/products/single-sock-kit.jpg'],
      weights: [
        { name: 'Pastels',   price: 44 },
        { name: 'Brights',       price: 44 },
        { name: 'Naturals',   price: 44 }
      ]
    },
    'double-sock-kit': {
      name: 'Double Sock Kit',
      tagline: 'The Sock Project · 2 full skeins + 4 minis',
      description: 'Two full sock skeins and four coordinating minis. Two pairs that work together, or one larger project with room for fades and contrast cuffs.',
      images: ['assets/products/double-sock-kit.jpg'],
      weights: [
        { name: 'Pastels',   price: 82 },
        { name: 'Brights',       price: 82 },
        { name: 'Naturals',   price: 82 }
      ]
    },
    'triple-sock-kit': {
      name: 'Triple Sock Kit',
      tagline: 'The Sock Project · 3 full skeins + 6 minis',
      description: 'Three full sock skeins, six coordinating minis. Gift sets, sock clubs, or a tonal shawl with real presence.',
      images: ['assets/products/triple-sock-kit.jpg'],
      weights: [
        { name: 'Pastels',   price: 120 },
        { name: 'Brights',       price: 120 },
        { name: 'Naturals',   price: 120 }
      ]
    },
    'quad-sock-pack': {
      name: 'Quad Sock Pack',
      tagline: 'The Sock Project · 4 full skeins + 8 minis',
      description: 'The full set — four full sock skeins and eight coordinating minis. Fade-friendly and ready for a sweater or blanket project.',
      images: ['assets/products/quad-sock-pack.jpg'],
      weights: [
        { name: 'Pastels',   price: 156 },
        { name: 'Brights',       price: 156 },
        { name: 'Naturals',   price: 156 }
      ]
    }
  };

  const CART_KEY = 'wfc-cart-v1';
  const fmt = (n) => `$${n.toFixed(2)} CAD`;

  /* -------- Cart state (localStorage) -------- */
  const loadCart = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
      // Migrate old weight-class names (Lace, Fingering / Sock, ...) to dog names.
      // Drop any entry whose old size has no equivalent (Sport, Aran).
      let mutated = false;
      const migrated = raw.reduce((acc, it) => {
        if (!it || typeof it.weight !== 'string') { acc.push(it); return acc; }
        if (Object.prototype.hasOwnProperty.call(YARN_MIGRATION, it.weight)) {
          mutated = true;
          const next = YARN_MIGRATION[it.weight];
          if (next) acc.push(Object.assign({}, it, { weight: next }));
        } else acc.push(it);
        return acc;
      }, []);
      if (mutated) {
        try { localStorage.setItem(CART_KEY, JSON.stringify(migrated)); } catch {}
      }
      return migrated;
    } catch { return []; }
  };
  let cart = loadCart();
  const saveCart = () => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
    refreshCount();
  };
  const totalCount = () => cart.reduce((s, it) => s + it.qty, 0);
  const subtotal   = () => cart.reduce((s, it) => s + it.price * it.qty, 0);

  const refreshCount = () => {
    const n = totalCount();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = n;
      if (n > 0) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  };

  /* -------- Inject cart drawer + product modal once -------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="cart-overlay" data-cart-overlay></div>
    <aside class="cart-drawer" role="dialog" aria-label="Shopping cart" aria-modal="true">
      <div class="cart-drawer-head">
        <h3>Your Cart</h3>
        <button class="cart-close" type="button" data-cart-close aria-label="Close cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="cart-items" data-cart-items></div>
      <div class="cart-foot" data-cart-foot></div>
    </aside>
    <div class="product-modal-overlay" data-product-modal>
      <div class="product-modal" role="dialog" aria-modal="true">
        <div class="product-modal-gallery">
          <div class="product-modal-main-img">
            <button class="product-modal-close" type="button" data-modal-close aria-label="Close">×</button>
            <img alt="" data-modal-img>
          </div>
          <div class="product-modal-thumbs" data-modal-thumbs></div>
        </div>
        <div class="product-modal-info">
          <h2 data-modal-name></h2>
          <div class="tag" data-modal-tag></div>
          <p class="desc" data-modal-desc></p>
          <div class="weight-list" data-modal-weights></div>
          <button class="btn btn-primary add-to-cart-btn" type="button" data-modal-add>Add to Cart</button>
        </div>
      </div>
    </div>
    <div class="sock-modal-overlay" data-sock-modal>
      <div class="sock-modal" role="dialog" aria-modal="true" aria-labelledby="sock-modal-name">
        <button class="sock-modal-close" type="button" data-sock-close aria-label="Close">×</button>
        <div class="sock-modal-img"><img alt="" data-sock-img></div>
        <div class="sock-modal-info">
          <h2 id="sock-modal-name" data-sock-name></h2>
          <div class="tag" data-sock-tag></div>
          <p class="desc" data-sock-desc></p>
          <p class="sock-modal-price" data-sock-price></p>
          <fieldset class="sock-scheme-picker">
            <legend>Choose a colour scheme</legend>
            <label><input type="radio" name="sock-scheme" value="0" checked><span data-sock-opt="0"></span></label>
            <label><input type="radio" name="sock-scheme" value="1"><span data-sock-opt="1"></span></label>
            <label><input type="radio" name="sock-scheme" value="2"><span data-sock-opt="2"></span></label>
          </fieldset>
          <button class="btn btn-primary add-to-cart-btn" type="button" data-sock-add>Add to Cart</button>
        </div>
      </div>
    </div>
  `);

  const overlay   = document.querySelector('[data-cart-overlay]');
  const drawer    = document.querySelector('.cart-drawer');
  const itemsBox  = drawer.querySelector('[data-cart-items]');
  const footBox   = drawer.querySelector('[data-cart-foot]');

  const renderCart = () => {
    if (!cart.length) {
      itemsBox.innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p><p style="margin-top:8px;">Add a colourway to get started.</p></div>`;
      footBox.innerHTML = '';
      return;
    }
    itemsBox.innerHTML = cart.map((it, idx) => {
      const p = PRODUCTS[it.productId];
      const lineTotal = it.price * it.qty;
      return `
        <div class="cart-item">
          <div class="cart-item-thumb"><img src="${p.images[0]}" alt=""></div>
          <div class="cart-item-info">
            <h4>${p.name}</h4>
            <div class="meta">${it.weight} · ${fmt(it.price)}</div>
            <div class="cart-item-controls">
              <div class="qty-stepper">
                <button type="button" data-cart-dec="${idx}" aria-label="Decrease">−</button>
                <input type="number" min="0" value="${it.qty}" data-cart-input="${idx}" aria-label="Quantity">
                <button type="button" data-cart-inc="${idx}" aria-label="Increase">+</button>
              </div>
            </div>
          </div>
          <div class="cart-item-end">
            <button class="cart-item-remove" type="button" data-cart-remove="${idx}" aria-label="Remove">×</button>
            <span class="cart-item-price">${fmt(lineTotal)}</span>
          </div>
        </div>`;
    }).join('');
    footBox.innerHTML = `
      <div class="cart-subtotal"><span>Subtotal</span><span>${fmt(subtotal())}</span></div>
      <button class="btn btn-primary cart-checkout" type="button" data-checkout>Checkout</button>
      <p class="cart-note">Stripe payments coming soon — your cart is saved here in the meantime.</p>
    `;
  };

  const openCart  = () => { renderCart(); overlay.classList.add('open'); drawer.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeCart = () => { overlay.classList.remove('open'); drawer.classList.remove('open'); if (!modalOverlay.classList.contains('open')) document.body.style.overflow = ''; };

  /* -------- Product modal -------- */
  const modalOverlay = document.querySelector('[data-product-modal]');
  const modalImg     = modalOverlay.querySelector('[data-modal-img]');
  const modalThumbs  = modalOverlay.querySelector('[data-modal-thumbs]');
  const modalName    = modalOverlay.querySelector('[data-modal-name]');
  const modalTag     = modalOverlay.querySelector('[data-modal-tag]');
  const modalDesc    = modalOverlay.querySelector('[data-modal-desc]');
  const modalWeights = modalOverlay.querySelector('[data-modal-weights]');
  const modalAdd     = modalOverlay.querySelector('[data-modal-add]');
  let activePid = null;

  const openProductModal = (pid) => {
    const p = PRODUCTS[pid];
    if (!p) return;
    activePid = pid;
    modalName.textContent = p.name;
    modalTag.textContent  = p.tagline;
    modalDesc.textContent = p.description;
    modalImg.src = p.images[0];
    modalImg.alt = `${p.name} — hand-dyed yarn`;
    modalThumbs.innerHTML = p.images.map((src, i) => `
      <button type="button" class="${i === 0 ? 'active' : ''}" data-thumb="${i}" aria-label="View image ${i + 1}">
        <img src="${src}" alt="">
      </button>`).join('');
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const renderWeightName = (name) => {
      const y = YARNS[name];
      if (!y) return `<span class="weight-name">${name}</span>`;
      const tip = escAttr(yarnTipText(name));
      const sub = y.weightClass + ' · ' + y.yardage;
      return (
        '<span class="weight-name-wrap">' +
          '<span class="weight-name has-tip" data-yarn-tip="' + tip + '" tabindex="0">' + name + '</span>' +
          '<span class="weight-sub">' + sub + '</span>' +
        '</span>'
      );
    };
    const weightRowsHTML = p.weights.map((w, i) => {
      if (isSizeOOS(activePid, w.name)) {
        return `
      <div class="weight-row weight-row--oos">
        ${renderWeightName(w.name)}
        <span class="weight-price weight-oos-label">Out of stock</span>
      </div>`;
      }
      return `
      <div class="weight-row">
        ${renderWeightName(w.name)}
        <span class="weight-price">${fmt(w.price)}</span>
        <div class="qty-stepper">
          <button type="button" data-w-dec="${i}" aria-label="Decrease ${w.name} quantity">−</button>
          <input type="number" min="0" value="0" data-w-qty="${i}" aria-label="${w.name} quantity">
          <button type="button" data-w-inc="${i}" aria-label="Increase ${w.name} quantity">+</button>
        </div>
      </div>`;
    }).join('');
    const hasNamedYarn = p.weights.some((w) => YARNS[w.name]);
    const guideLinkHTML = hasNamedYarn
      ? '<p class="weight-guide-link"><a href="shop.html#yarn-guide">View full yarn base guide \u2192</a></p>'
      : '';
    modalWeights.innerHTML = weightRowsHTML + guideLinkHTML;
    modalAdd.textContent = 'Add to Cart';
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeProductModal = () => {
    modalOverlay.classList.remove('open');
    activePid = null;
    if (!drawer.classList.contains('open')) document.body.style.overflow = '';
  };

  /* -------- Global click router -------- */
  document.addEventListener('click', (e) => {
    // open cart
    if (e.target.closest('[data-cart-toggle]')) { e.preventDefault(); openCart(); return; }
    // close cart
    if (e.target.closest('[data-cart-close]') || e.target === overlay) { closeCart(); return; }
    // cart line controls
    const inc = e.target.closest('[data-cart-inc]');
    const dec = e.target.closest('[data-cart-dec]');
    const rem = e.target.closest('[data-cart-remove]');
    const co  = e.target.closest('[data-checkout]');
    if (inc) { cart[+inc.dataset.cartInc].qty++; saveCart(); renderCart(); return; }
    if (dec) {
      const i = +dec.dataset.cartDec;
      cart[i].qty = Math.max(0, cart[i].qty - 1);
      if (cart[i].qty === 0) cart.splice(i, 1);
      saveCart(); renderCart(); return;
    }
    if (rem) { cart.splice(+rem.dataset.cartRemove, 1); saveCart(); renderCart(); return; }
    if (co)  { alert('Stripe checkout is coming soon. Your cart will be waiting when it goes live!'); return; }

    // product modal
    if (e.target.closest('[data-modal-close]') || e.target === modalOverlay) { closeProductModal(); return; }
    const t = e.target.closest('[data-thumb]');
    if (t) {
      const p = PRODUCTS[activePid];
      modalImg.src = p.images[+t.dataset.thumb];
      modalThumbs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      t.classList.add('active');
      return;
    }
    const wInc = e.target.closest('[data-w-inc]');
    const wDec = e.target.closest('[data-w-dec]');
    if (wInc) {
      const inp = modalWeights.querySelector(`[data-w-qty="${wInc.dataset.wInc}"]`);
      inp.value = (parseInt(inp.value, 10) || 0) + 1;
      return;
    }
    if (wDec) {
      const inp = modalWeights.querySelector(`[data-w-qty="${wDec.dataset.wDec}"]`);
      inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) - 1);
      return;
    }

    // open product modal from card
    const card = e.target.closest('[data-product]');
    if (card) { e.preventDefault(); openProductModal(card.dataset.product); }
  });

  // Cart line: typing into qty input
  document.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-cart-input]');
    if (!inp) return;
    const i = +inp.dataset.cartInput;
    const v = Math.max(0, parseInt(inp.value, 10) || 0);
    cart[i].qty = v;
    saveCart();
    if (v === 0) { cart.splice(i, 1); renderCart(); }
  });

  // Card keyboard activation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalOverlay.classList.contains('open')) closeProductModal();
      else if (drawer.classList.contains('open')) closeCart();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('[data-product]');
      if (card) { e.preventDefault(); openProductModal(card.dataset.product); }
    }
  });

  // Add-to-cart from modal
  modalAdd.addEventListener('click', () => {
    if (!activePid) return;
    const p = PRODUCTS[activePid];
    let added = 0;
    p.weights.forEach((w, i) => {
      const inp = modalWeights.querySelector(`[data-w-qty="${i}"]`);
      if (!inp) return; // out-of-stock row, no input rendered
      const qty = Math.max(0, parseInt(inp.value, 10) || 0);
      if (qty === 0) return;
      const existing = cart.find(it => it.productId === activePid && it.weight === w.name);
      if (existing) existing.qty += qty;
      else cart.push({ productId: activePid, weight: w.name, price: w.price, qty });
      added += qty;
    });
    if (added === 0) {
      modalAdd.textContent = 'Choose a quantity first';
      setTimeout(() => { modalAdd.textContent = 'Add to Cart'; }, 1600);
      return;
    }
    saveCart();
    closeProductModal();
    openCart();
  });

  /* -------- Sock-kit modal -------- */
  const sockOverlay = document.querySelector('[data-sock-modal]');
  const sockImg     = sockOverlay.querySelector('[data-sock-img]');
  const sockName    = sockOverlay.querySelector('[data-sock-name]');
  const sockTag     = sockOverlay.querySelector('[data-sock-tag]');
  const sockDesc    = sockOverlay.querySelector('[data-sock-desc]');
  const sockPrice   = sockOverlay.querySelector('[data-sock-price]');
  const sockOpts    = sockOverlay.querySelectorAll('[data-sock-opt]');
  const sockAddBtn  = sockOverlay.querySelector('[data-sock-add]');
  let activeSockId  = null;

  const openSockModal = (sid) => {
    const p = PRODUCTS[sid];
    if (!p) return;
    activeSockId = sid;
    sockName.textContent  = p.name;
    sockTag.textContent   = p.tagline;
    sockDesc.textContent  = p.description;
    sockPrice.textContent = fmt(p.weights[0].price);
    sockImg.src = p.images[0];
    sockImg.alt = p.name;
    sockOpts.forEach((el, i) => { el.textContent = p.weights[i] ? p.weights[i].name : ''; });
    sockOverlay.querySelectorAll('input[name="sock-scheme"]').forEach((r, i) => { r.checked = i === 0; });
    sockAddBtn.textContent = 'Add to Cart';
    sockOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeSockModal = () => {
    sockOverlay.classList.remove('open');
    activeSockId = null;
    if (!drawer.classList.contains('open')) document.body.style.overflow = '';
  };

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-sock-kit]');
    if (card) { e.preventDefault(); openSockModal(card.dataset.sockKit); return; }
    if (e.target.closest('[data-sock-close]') || e.target === sockOverlay) { closeSockModal(); return; }
    if (e.target.closest('[data-sock-add]')) {
      if (!activeSockId) return;
      const p = PRODUCTS[activeSockId];
      const choice = sockOverlay.querySelector('input[name="sock-scheme"]:checked');
      const idx = choice ? +choice.value : 0;
      const w = p.weights[idx];
      const existing = cart.find(it => it.productId === activeSockId && it.weight === w.name);
      if (existing) existing.qty += 1;
      else cart.push({ productId: activeSockId, weight: w.name, price: w.price, qty: 1 });
      saveCart();
      closeSockModal();
      openCart();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sockOverlay.classList.contains('open')) closeSockModal();
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.matches('[data-sock-kit]')) {
      e.preventDefault();
      openSockModal(document.activeElement.dataset.sockKit);
    }
  });


  /* ============================================================
     Manage Site - inventory management + custom products.
     Stored in localStorage at wfc-inventory-v1. No auth (yet).
     ============================================================ */
  const INV_KEY = "wfc-inventory-v1";
  // Migrate any sizesOOS / overrides.weights entries that still use old weight-class
  // names (Lace, Fingering / Sock, ...). Returns a possibly-mutated copy + a flag.
  const migrateInv = (raw) => {
    let mutated = false;
    const migrateNames = (arr) => arr.map((n) => {
      if (typeof n !== 'string' || !Object.prototype.hasOwnProperty.call(YARN_MIGRATION, n)) return n;
      mutated = true;
      return YARN_MIGRATION[n];
    }).filter((n) => n !== null && n !== undefined);
    const migrateWeights = (ws) => ws.map((w) => {
      if (!w || typeof w.name !== 'string') return w;
      if (!Object.prototype.hasOwnProperty.call(YARN_MIGRATION, w.name)) return w;
      mutated = true;
      const next = YARN_MIGRATION[w.name];
      return next ? Object.assign({}, w, { name: next }) : null;
    }).filter(Boolean);
    const stock = raw.stock || {};
    Object.values(stock).forEach((info) => {
      if (info && Array.isArray(info.sizesOOS)) info.sizesOOS = migrateNames(info.sizesOOS);
      if (info && info.overrides && Array.isArray(info.overrides.weights)) {
        info.overrides.weights = migrateWeights(info.overrides.weights);
      }
    });
    const custom = raw.custom || [];
    custom.forEach((cp) => {
      if (cp && Array.isArray(cp.sizesOOS)) cp.sizesOOS = migrateNames(cp.sizesOOS);
      if (cp && Array.isArray(cp.weights)) cp.weights = migrateWeights(cp.weights);
    });
    return { data: { stock, custom }, mutated };
  };
  const loadInv = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(INV_KEY)) || {};
      const { data, mutated } = migrateInv(raw);
      if (mutated) {
        try { localStorage.setItem(INV_KEY, JSON.stringify(data)); } catch {}
      }
      return data;
    } catch { return { stock: {}, custom: [] }; }
  };
  const saveInv = (inv) => {
    try { localStorage.setItem(INV_KEY, JSON.stringify(inv)); }
    catch (e) { alert("Could not save - browser storage may be full."); }
  };

  function isProductOOS(pid) {
    const inv = loadInv();
    if (inv.stock[pid] && inv.stock[pid].outOfStock) return true;
    const cp = inv.custom.find(c => c.id === pid);
    if (cp && cp.outOfStock) return true;
    return false;
  }
  function isSizeOOS(pid, sizeName) {
    const inv = loadInv();
    if (inv.stock[pid] && Array.isArray(inv.stock[pid].sizesOOS) && inv.stock[pid].sizesOOS.includes(sizeName)) return true;
    const cp = inv.custom.find(c => c.id === pid);
    if (cp && Array.isArray(cp.sizesOOS) && cp.sizesOOS.includes(sizeName)) return true;
    return false;
  }

  // Inject saved custom products into PRODUCTS so the existing modal/cart pipeline picks them up.
  const _initInv = loadInv();
  _initInv.custom.forEach(cp => {
    PRODUCTS[cp.id] = {
      name: cp.name,
      tagline: cp.tagline || "",
      description: cp.description || "",
      images: cp.image ? [cp.image] : [],
      weights: cp.weights || []
    };
  });

  // Apply built-in product overrides (set via the edit form) on top of PRODUCTS.
  Object.entries(_initInv.stock || {}).forEach(([pid, info]) => {
    if (PRODUCTS[pid] && info && info.overrides) {
      const o = info.overrides;
      if (o.name !== undefined)        PRODUCTS[pid].name        = o.name;
      if (o.tagline !== undefined)     PRODUCTS[pid].tagline     = o.tagline;
      if (o.description !== undefined) PRODUCTS[pid].description = o.description;
      if (o.images)                    PRODUCTS[pid].images      = o.images;
      if (o.weights)                   PRODUCTS[pid].weights     = o.weights;
    }
  });

  // Sync existing static product cards with PRODUCTS state (overrides + OOS).
  const syncProductCard = (card) => {
    const pid = card.dataset.product;
    const p = PRODUCTS[pid];
    if (!p) return;
    card.classList.toggle("out-of-stock", isProductOOS(pid));
    const h3 = card.querySelector("h3");
    if (h3 && p.name) h3.textContent = p.name;
    const meta = card.querySelector(".card-meta");
    if (meta && p.tagline !== undefined) meta.textContent = p.tagline;
    if (p.weights && p.weights.length) {
      const minP = Math.min(...p.weights.map(w => w.price));
      const price = card.querySelector(".card-price");
      if (price) price.textContent = "From $" + minP + " CAD";
    }
    if (p.images && p.images[0]) {
      const cardImg = card.querySelector(".card-media img");
      if (cardImg) cardImg.src = p.images[0];
    }
  };
  document.querySelectorAll(".product-card[data-product]").forEach(syncProductCard);

  // Append custom products to the colourways grid (shop page only).
  const shopGrid = document.querySelector("[data-shop-grid]");
  const buildCustomCard = (cp) => {
    const card = document.createElement("article");
    card.className = "card product-card";
    if (cp.outOfStock) card.classList.add("out-of-stock");
    card.dataset.product = cp.id;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "View " + cp.name + " details");
    const minPrice = cp.weights && cp.weights.length ? Math.min(...cp.weights.map(w => w.price)) : null;
    const star = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.39 5.77L20.5 8.5l-4.25 4.14L17.18 19 12 16l-5.18 3 .93-6.36L3.5 8.5l6.11-.73L12 2z"/></svg>';
    card.innerHTML =
      '<span class="badge-new">' + star + 'NEW</span>' +
      '<div class="card-media"><img src="' + (cp.image || "") + '" alt="' + (cp.name || "") + '" loading="lazy"></div>' +
      '<div class="card-body">' +
        '<h3>' + (cp.name || "") + '</h3>' +
        '<p class="card-meta">' + (cp.tagline || "") + '</p>' +
        '<p class="card-price">' + (minPrice !== null ? "From $" + minPrice + " CAD" : "") + '</p>' +
      '</div>';
    return card;
  };
  if (shopGrid) {
    _initInv.custom.forEach(cp => shopGrid.appendChild(buildCustomCard(cp)));
  }

  // OOS notice banner above the colourways grid.
  const refreshOOSBanner = () => {
    if (!shopGrid) return;
    const existing = document.querySelector(".oos-notice");
    if (existing) existing.remove();
    const oosNames = Object.keys(PRODUCTS).filter(pid => isProductOOS(pid)).map(pid => PRODUCTS[pid].name);
    if (!oosNames.length) return;
    const banner = document.createElement("div");
    banner.className = "oos-notice";
    banner.innerHTML = "<strong>Currently sold out:</strong> " + oosNames.join(", ") + ". Check back soon - we restock often.";
    shopGrid.parentElement.insertBefore(banner, shopGrid);
  };
  refreshOOSBanner();

  // ----- Manage modal -----
  document.body.insertAdjacentHTML("beforeend",
    '<div class="manage-modal-overlay" data-manage-modal>' +
      '<div class="manage-modal" role="dialog" aria-modal="true" aria-labelledby="manage-title">' +
        '<div class="manage-modal-head">' +
          '<h2 id="manage-title">Manage site</h2>' +
          '<button type="button" data-manage-close aria-label="Close">\u00d7</button>' +
        '</div>' +
        '<div class="manage-tabs" role="tablist">' +
          '<button type="button" class="is-active" data-manage-tab="inventory" role="tab">Inventory</button>' +
          '<button type="button" data-manage-tab="add" role="tab">Add product</button>' +
        '</div>' +
        '<div class="manage-tab-pane" data-pane="inventory">' +
          '<p class="manage-help">Toggle products and yarn options in or out of stock. Out-of-stock options can\u2019t be added to a cart, and fully sold-out products show a notice on the shop page.</p>' +
          '<div class="inventory-list" data-inventory-list></div>' +
        '</div>' +
        '<div class="manage-tab-pane" data-pane="add" hidden>' +
          '<form data-add-product novalidate>' +
            '<div class="form-field"><label for="np-name">Product name *</label><input id="np-name" name="name" type="text" required></div>' +
            '<div class="form-field"><label for="np-tagline">Tagline</label><input id="np-tagline" name="tagline" type="text" placeholder="e.g. Tonal \u00b7 soft blue"></div>' +
            '<div class="form-field"><label for="np-desc">Description</label><textarea id="np-desc" name="description" rows="3"></textarea></div>' +
            '<div class="form-field"><label for="np-photo">Photo *</label><input id="np-photo" name="photo" type="file" accept="image/*" required><div class="np-preview" data-photo-preview></div></div>' +
            '<fieldset class="form-field"><legend>Available options &amp; prices (CAD)</legend><p class="manage-help" style="margin: 0 0 var(--space-sm); font-size: 0.8125rem;">For yarn colourways, options are the dog-named bases. For other products (like sock kits), edit the option names after creating.</p><div class="np-weights" data-np-weights></div></fieldset>' +
            '<button type="submit" class="btn btn-primary">Add product</button>' +
            '<p class="form-status" role="status" aria-live="polite"></p>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>'
  );

  const manageOverlay = document.querySelector("[data-manage-modal]");
  const inventoryList = manageOverlay.querySelector("[data-inventory-list]");
  const npWeightsBox  = manageOverlay.querySelector("[data-np-weights]");
  const npPreview     = manageOverlay.querySelector("[data-photo-preview]");
  const addForm       = manageOverlay.querySelector("[data-add-product]");
  const addStatus     = addForm.querySelector(".form-status");
  let pendingPhoto = null;

  const DEFAULT_NEW_WEIGHTS = STANDARD_YARNS.map((y) => ({ name: y.name, price: y.price, on: true }));

  const renderNpWeights = () => {
    npWeightsBox.innerHTML = DEFAULT_NEW_WEIGHTS.map((w, i) =>
      '<label class="np-weight-row">' +
        '<input type="checkbox" data-np-w="' + i + '" ' + (w.on ? "checked" : "") + '>' +
        '<span class="np-weight-name">' + w.name + '</span>' +
        '<input type="number" min="0" step="0.01" data-np-w-price="' + i + '" value="' + w.price + '" aria-label="' + w.name + ' price">' +
      '</label>'
    ).join("");
  };
  renderNpWeights();

  const escapeAttr = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapeText = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let pendingEditPhoto = null;

  const renderInventoryList = () => {
    pendingEditPhoto = null;
    const inv = loadInv();
    const ids = Object.keys(PRODUCTS);
    const rows = ids.map(pid => {
      const p = PRODUCTS[pid];
      const customEntry = (inv.custom || []).find(c => c.id === pid);
      const isCustom = !!customEntry;
      const oos = isProductOOS(pid);
      const sizesOOSCount = ((inv.stock[pid] && inv.stock[pid].sizesOOS) || (customEntry && customEntry.sizesOOS) || []).length;
      const sizesCount = (p.weights || []).length;
      const thumb = (p.images && p.images[0]) || "";
      const status = oos
        ? "Sold out"
        : (sizesOOSCount > 0 ? sizesOOSCount + " of " + sizesCount + " option" + (sizesCount === 1 ? "" : "s") + " out of stock" : sizesCount + " option" + (sizesCount === 1 ? "" : "s") + " in stock");
      return (
        '<button type="button" class="inv-row' + (oos ? ' is-oos' : '') + '" data-edit-product="' + pid + '">' +
          '<div class="inv-row-thumb">' + (thumb ? '<img src="' + escapeAttr(thumb) + '" alt="">' : '') + '</div>' +
          '<div class="inv-row-body">' +
            '<h4>' + escapeText(p.name) + (isCustom ? ' <span class="inv-tag">Custom</span>' : '') + '</h4>' +
            '<p class="inv-row-status">' + status + '</p>' +
          '</div>' +
          '<span class="inv-row-arrow" aria-hidden="true">\u203A</span>' +
        '</button>'
      );
    }).join("");
    inventoryList.innerHTML = rows || '<p>No products yet.</p>';
  };

  const buildEditWeightRow = (i, name, price, oos) => (
    '<div class="ep-weight-row">' +
      '<input type="text" class="ep-w-name" data-ep-w-name="' + i + '" value="' + escapeAttr(name) + '" placeholder="Option / yarn name">' +
      '<input type="number" class="ep-w-price" data-ep-w-price="' + i + '" min="0" step="0.01" value="' + (price !== undefined && price !== null ? price : '') + '" placeholder="Price">' +
      '<label class="ep-w-oos"><input type="checkbox" data-ep-w-oos="' + i + '"' + (oos ? ' checked' : '') + '> OOS</label>' +
      '<button type="button" class="ep-w-remove" data-ep-w-remove="' + i + '" aria-label="Remove this option">\u00d7</button>' +
    '</div>'
  );

  const renderEditPanel = (pid) => {
    pendingEditPhoto = null;
    const inv = loadInv();
    const p = PRODUCTS[pid];
    if (!p) { renderInventoryList(); return; }
    const customEntry = (inv.custom || []).find(c => c.id === pid);
    const isCustom = !!customEntry;
    const oos = isProductOOS(pid);
    const sizesOOS = (inv.stock[pid] && inv.stock[pid].sizesOOS) || (customEntry && customEntry.sizesOOS) || [];
    const currentImage = (p.images && p.images[0]) || "";
    const weightRows = (p.weights || []).map((w, i) => buildEditWeightRow(i, w.name, w.price, sizesOOS.includes(w.name))).join("");

    inventoryList.innerHTML =
      '<div class="ep-header">' +
        '<button type="button" class="ep-back" data-back-to-list>\u2190 Back to all products</button>' +
        '<h3>Edit ' + escapeText(p.name) + (isCustom ? ' <span class="inv-tag">Custom</span>' : '') + '</h3>' +
      '</div>' +
      '<form data-edit-product data-edit-pid="' + escapeAttr(pid) + '">' +
        '<div class="form-field"><label for="ep-name">Product name *</label><input id="ep-name" name="name" type="text" value="' + escapeAttr(p.name) + '" required></div>' +
        '<div class="form-field"><label for="ep-tagline">Tagline</label><input id="ep-tagline" name="tagline" type="text" value="' + escapeAttr(p.tagline || "") + '"></div>' +
        '<div class="form-field"><label for="ep-desc">Description</label><textarea id="ep-desc" name="description" rows="3">' + escapeText(p.description || "") + '</textarea></div>' +
        '<div class="form-field">' +
          '<label>Photo</label>' +
          '<div class="ep-current-photo">' + (currentImage ? '<img src="' + escapeAttr(currentImage) + '" alt=""><span class="ep-current-label">Current</span>' : '<span class="help-text">No photo set</span>') + '</div>' +
          '<input type="file" accept="image/*" data-ep-photo>' +
          '<div class="np-preview" data-ep-preview></div>' +
          '<span class="help-text">Choose a new file to replace the current photo. Leave empty to keep it.</span>' +
        '</div>' +
        '<div class="form-field">' +
          '<label class="inv-toggle"><input type="checkbox" data-ep-product-oos' + (oos ? ' checked' : '') + '> Mark entire product out of stock</label>' +
        '</div>' +
        '<fieldset class="form-field">' +
          '<legend>Options, prices &amp; stock</legend>' +
          '<div class="ep-weights">' + weightRows + '</div>' +
          '<button type="button" class="btn btn-outline btn-sm ep-add-size" data-ep-add-size>+ Add another option</button>' +
        '</fieldset>' +
        '<div class="ep-actions">' +
          '<button type="submit" class="btn btn-primary">Save changes</button>' +
          '<button type="button" class="btn btn-outline" data-back-to-list>Cancel</button>' +
          (isCustom ? '<button type="button" class="btn btn-outline inv-delete" data-delete-custom="' + escapeAttr(pid) + '">Delete product</button>' : '') +
        '</div>' +
        '<p class="form-status" role="status" aria-live="polite"></p>' +
      '</form>';
  };

  const openManage = () => {
    renderInventoryList();
    manageOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  const closeManage = () => {
    manageOverlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-manage-site]")) { e.preventDefault(); openManage(); return; }
    if (e.target.closest("[data-manage-close]") || e.target === manageOverlay) { closeManage(); return; }

    const tab = e.target.closest("[data-manage-tab]");
    if (tab) {
      manageOverlay.querySelectorAll("[data-manage-tab]").forEach(t => t.classList.toggle("is-active", t === tab));
      manageOverlay.querySelectorAll(".manage-tab-pane").forEach(pane => {
        pane.hidden = pane.dataset.pane !== tab.dataset.manageTab;
      });
      return;
    }

    const delBtn = e.target.closest("[data-delete-custom]");
    if (delBtn) {
      if (!confirm("Delete this product? This cannot be undone.")) return;
      const pid = delBtn.dataset.deleteCustom;
      const inv = loadInv();
      inv.custom = (inv.custom || []).filter(c => c.id !== pid);
      saveInv(inv);
      delete PRODUCTS[pid];
      renderInventoryList();
      const card = document.querySelector('[data-product="' + pid + '"]');
      if (card) card.remove();
      refreshOOSBanner();
    }
  });

  // Open edit panel when an inventory row (or back-link) is clicked.
  inventoryList.addEventListener("click", (e) => {
    const row = e.target.closest("button[data-edit-product]");
    if (row) { renderEditPanel(row.dataset.editProduct); return; }
    const back = e.target.closest("[data-back-to-list]");
    if (back) { e.preventDefault(); renderInventoryList(); return; }
    const removeSize = e.target.closest("[data-ep-w-remove]");
    if (removeSize) { e.preventDefault(); removeSize.closest(".ep-weight-row").remove(); return; }
    const addSize = e.target.closest("[data-ep-add-size]");
    if (addSize) {
      e.preventDefault();
      const ws = inventoryList.querySelector(".ep-weights");
      if (!ws) return;
      const i = ws.children.length;
      ws.insertAdjacentHTML("beforeend", buildEditWeightRow(i, "", "", false));
      const newRow = ws.lastElementChild;
      const nameInp = newRow && newRow.querySelector(".ep-w-name");
      if (nameInp) nameInp.focus();
      return;
    }
  });

  // Photo replace inside edit panel — downscale + preview
  inventoryList.addEventListener("change", (e) => {
    if (!e.target.matches("[data-ep-photo]")) return;
    const file = e.target.files && e.target.files[0];
    if (!file) { pendingEditPhoto = null; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 600;
        const ratio = img.width > max ? max / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        pendingEditPhoto = c.toDataURL("image/jpeg", 0.78);
        const preview = inventoryList.querySelector("[data-ep-preview]");
        if (preview) preview.innerHTML = '<img src="' + pendingEditPhoto + '" alt="New photo preview">';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Submit edit form — persist + sync card + back to list.
  inventoryList.addEventListener("submit", (e) => {
    if (!e.target.matches("form[data-edit-product]")) return;
    e.preventDefault();
    const form = e.target;
    const status = form.querySelector(".form-status");
    const pid = form.dataset.editPid;
    const inv = loadInv();
    const isCustom = (inv.custom || []).some(c => c.id === pid);

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    if (!name) { status.textContent = "Product name is required."; status.className = "form-status err"; return; }

    const weights = [];
    const oosNames = [];
    form.querySelectorAll(".ep-weight-row").forEach((row) => {
      const nm = row.querySelector(".ep-w-name");
      const pr = row.querySelector(".ep-w-price");
      const oo = row.querySelector('input[type="checkbox"][data-ep-w-oos]');
      if (!nm || !pr) return;
      const wName = (nm.value || "").trim();
      const wPrice = parseFloat(pr.value);
      if (!wName || isNaN(wPrice) || wPrice <= 0) return;
      weights.push({ name: wName, price: wPrice });
      if (oo && oo.checked) oosNames.push(wName);
    });
    if (!weights.length) { status.textContent = "Add at least one option with a price."; status.className = "form-status err"; return; }

    const productOOS = !!form.querySelector("[data-ep-product-oos]").checked;
    const tagline = (data.get("tagline") || "").toString().trim();
    const description = (data.get("description") || "").toString().trim();

    PRODUCTS[pid].name = name;
    PRODUCTS[pid].tagline = tagline;
    PRODUCTS[pid].description = description;
    PRODUCTS[pid].weights = weights;
    if (pendingEditPhoto) PRODUCTS[pid].images = [pendingEditPhoto];

    if (isCustom) {
      const idx = inv.custom.findIndex(c => c.id === pid);
      inv.custom[idx] = Object.assign({}, inv.custom[idx], {
        name, tagline, description, weights,
        outOfStock: productOOS,
        sizesOOS: oosNames,
        image: pendingEditPhoto || inv.custom[idx].image
      });
    } else {
      inv.stock[pid] = inv.stock[pid] || {};
      inv.stock[pid].outOfStock = productOOS;
      inv.stock[pid].sizesOOS = oosNames;
      inv.stock[pid].overrides = Object.assign({}, inv.stock[pid].overrides || {}, {
        name, tagline, description, weights
      });
      if (pendingEditPhoto) inv.stock[pid].overrides.images = [pendingEditPhoto];
    }
    saveInv(inv);

    const card = document.querySelector('[data-product="' + pid + '"]');
    if (card) syncProductCard(card);
    refreshOOSBanner();
    pendingEditPhoto = null;
    renderInventoryList();
  });

  // Photo upload: downscale to 600px wide JPEG to keep localStorage usage low.
  addForm.querySelector("#np-photo").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) { pendingPhoto = null; npPreview.innerHTML = ""; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 600;
        const ratio = img.width > max ? max / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        pendingPhoto = c.toDataURL("image/jpeg", 0.78);
        npPreview.innerHTML = '<img src="' + pendingPhoto + '" alt="Preview">';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(addForm);
    const name = (data.get("name") || "").toString().trim();
    if (!name) { addStatus.textContent = "Product name is required."; addStatus.className = "form-status err"; return; }
    if (!pendingPhoto) { addStatus.textContent = "Please choose a photo."; addStatus.className = "form-status err"; return; }
    const weights = [];
    DEFAULT_NEW_WEIGHTS.forEach((w, i) => {
      const cb = addForm.querySelector('[data-np-w="' + i + '"]');
      const pr = addForm.querySelector('[data-np-w-price="' + i + '"]');
      if (cb && cb.checked) {
        const price = parseFloat(pr.value);
        if (!isNaN(price) && price > 0) weights.push({ name: w.name, price });
      }
    });
    if (!weights.length) { addStatus.textContent = "Choose at least one option."; addStatus.className = "form-status err"; return; }

    const id = "custom-" + Date.now();
    const product = {
      id, name,
      tagline: (data.get("tagline") || "").toString().trim(),
      description: (data.get("description") || "").toString().trim(),
      image: pendingPhoto,
      weights,
      outOfStock: false,
      sizesOOS: []
    };
    const inv = loadInv();
    inv.custom = inv.custom || [];
    inv.custom.push(product);
    saveInv(inv);

    PRODUCTS[id] = {
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      images: [product.image],
      weights: product.weights
    };

    if (shopGrid) shopGrid.appendChild(buildCustomCard(product));

    addStatus.textContent = "Product added. \u2713";
    addStatus.className = "form-status ok";
    addForm.reset();
    pendingPhoto = null;
    npPreview.innerHTML = "";
    renderNpWeights();
    renderInventoryList();
    refreshOOSBanner();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && manageOverlay.classList.contains("open")) closeManage();
  });

  /* -------- Yarn base guide (renders into [data-yarn-guide] on shop + faq pages) -------- */
  const buildYarnGuide = () => {
    const target = document.querySelector('[data-yarn-guide]');
    if (!target) return;
    const rows = Object.entries(YARNS).map(([name, y]) => (
      '<tr>' +
        '<td><strong class="yarn-name-cell">' + name + '</strong></td>' +
        '<td>' + y.weightClass + '<br><span class="yarn-also">' + y.alsoCalled + '</span></td>' +
        '<td>' + y.material + '<br><span class="yarn-also">' + y.yardage + '</span></td>' +
        '<td>' + y.gauge + '</td>' +
        '<td>' + y.needles + '</td>' +
        '<td>' + y.bestFor + '</td>' +
      '</tr>'
    )).join('');
    target.innerHTML = (
      '<div class="weight-table-wrap">' +
        '<table class="weight-table" aria-label="Yarn base guide">' +
          '<thead><tr>' +
            '<th>Name</th>' +
            '<th>Weight</th>' +
            '<th>Material &amp; per skein</th>' +
            '<th>Typical Gauge (sts / 10cm)</th>' +
            '<th>Needle Size (mm)</th>' +
            '<th>Best For</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>'
    );
  };
  buildYarnGuide();

  refreshCount();
})();

/* ============================================================
   Gallery — hero collage, masonry, lightbox, subtle parallax
   Only runs on the gallery page (gated by #gallery-page).
   ============================================================ */
(() => {
  'use strict';
  if (!document.getElementById('gallery-page')) return;

  const PATH = 'assets/instagram%20photos/';
  const PHOTOS = [
    '497896996_17948115530975893_5088040218807095898_n.jpg',
    '498228573_17948115539975893_2748925487181902576_n.jpg',
    '536684650_17959570766975893_1922192321164673185_n.jpg',
    '537513671_17959570748975893_3152961356134894747_n.jpg',
    '538203611_17959570757975893_8586865582258329885_n.jpg',
    '539147600_17960029439975893_7539542676129557227_n.jpg',
    '539255631_17959946957975893_8869819811993436792_n.jpg',
    '539269555_17959946948975893_6535482395112810828_n.jpg',
    '539400566_17959946939975893_1978405338197637096_n.jpg',
    '539569243_17960029448975893_1256857932235668305_n.jpg',
    '539630044_17960166350975893_4428638388612417306_n.jpg',
    '539697211_17960029430975893_8980761181033616068_n.jpg',
    '539809879_17959946966975893_2917230079827176711_n.jpg',
    '539953343_17960166341975893_94388447923849723_n.jpg',
    '541933416_17960398415975893_4142364726095155882_n.jpg',
    '553357538_17963517260975893_56901305283876003_n.jpg',
    '574221471_17968237868975893_308904729088207777_n.jpg',
    '580567208_17968237877975893_4859483563000239844_n.jpg',
    '587015091_17969796731975893_5902586687882176836_n.jpg',
    '624438361_17977260422975893_4688649082217381886_n.jpg',
    '624544029_17977260395975893_2575802146794472908_n.jpg',
    '625048354_17977565735975893_6132038992906557637_n.jpg',
    '625143719_17977565753975893_387922034221429037_n.jpg',
    '625377429_17977260431975893_4064270045212570531_n.jpg',
    '625443218_17977565762975893_228117937371640945_n.jpg',
    '625947032_17977260377975893_7892827048748826040_n.jpg',
    '625980985_17977260404975893_8256122931195498561_n.jpg',
    '632420419_17979299687975893_1097879557280021250_n.jpg',
    '640916371_17979729743975893_4759480354591748999_n.jpg',
    '642476412_17920241328270918_4434018850078245709_n.jpg',
    '642515431_17980659002975893_9187490471552472974_n.jpg',
    '645609000_17980659032975893_2458672403906848495_n.jpg',
    '649219532_17939310201171348_5808152459565359754_n.jpg',
    '649243561_17954518017098361_8556653013352201598_n.jpg',
    '650298211_17914382808141579_3060556399916489331_n.jpg',
    '651549429_18016345547827070_1402453397329628965_n.jpg',
    '651989069_17963376141027949_1864594709909784560_n.jpg',
    '652095479_18036697397784749_3143386783582092996_n.jpg',
    '652426669_18022146203811062_7816671568861890964_n.jpg',
    '652588692_18070066415250898_4789105958206892994_n.jpg',
    '653950343_18084411812252431_6281323240554135768_n.jpg',
    '654003998_18073288469552962_2330165658165025924_n.jpg',
    '654107735_18158179657376717_8998773553931108153_n.jpg',
    '654580413_18095529875042702_8371917816531115835_n.jpg',
    '655026768_18145852015485606_1806738720853976992_n.jpg',
    '655052999_18097859947982450_4878990438461826484_n.jpg',
    '655080230_18086921516520428_5391925842897815303_n.jpg',
    '655082861_18110524651801705_2806303605372823683_n.jpg',
    '655163184_18118213855617228_2305617749291777993_n.jpg',
    '655177099_18115574227662310_8852161963329555111_n.jpg',
    '655232584_18078649727384883_4631719241367686220_n.jpg',
    '655395495_18096683435071584_2137993245516459447_n.jpg',
    '655637605_18105679196497519_1809094489293265984_n.jpg',
    '655864345_17983124723975893_4519530908823758238_n.jpg',
    '655952361_18134250880520986_4709045705013259987_n.jpg',
    '656022592_18099130712492032_7811116867007452596_n.jpg',
    '656030520_17983124690975893_8109874112518567461_n.jpg',
    '656093583_18077985350624669_2863375006009172308_n.jpg',
    '656147199_18124731490586943_4100394213124289107_n.jpg',
    '656193110_18098839660815211_1065029558284394127_n.jpg',
    '656265845_17983124702975893_5557831916711096354_n.jpg',
    '656268491_17983124681975893_2773237632005547970_n.jpg',
    '656274337_17983124711975893_8664218986532895693_n.jpg',
    '656294946_18076539743134182_41061452095859811_n.jpg',
    '656582266_18078998534387631_5334538188998693752_n.jpg',
    '656671187_18147497329480365_5632420885001310257_n.jpg',
    '656859928_18082714274365504_1413228550089720021_n.jpg',
    '657603079_18204013285336749_8072669538459757287_n.jpg',
    '657672625_18082342772609663_7164995325130814522_n.jpg',
    '657689560_18134946025524430_4972388951806448890_n.jpg',
    '658943644_18004477859913087_7746230835714860034_n.jpg',
    '658964768_18316716433284749_6765486912378511887_n.jpg',
    '669363754_18390625981086322_194878446713092148_n.jpg',
    '669759827_18431100388141555_7789665521017059989_n.jpg',
    '669765230_18086901455593367_3624861009432528208_n.jpg',
    '670021683_18087220967608427_5063584987340120751_n.jpg',
    '670269964_18523243726077005_915799333716410655_n.jpg',
    '670351404_18403895047182087_8904527730010842906_n.jpg',
    '670446713_18452550283105521_8757941136324738457_n.jpg',
    '670523172_18129305077494114_1148858462212163545_n.jpg',
    '670536624_18140953942448197_1140763327727679581_n.jpg'
  ];

  // Spread hero picks across the timeline so the bento isn't all one cluster.
  const HERO_INDEXES = [0, 20, 40, 60, 80];
  const heroPhotos    = HERO_INDEXES.map(i => PHOTOS[i]);
  const masonryPhotos = PHOTOS.map((p, i) => ({ p, i })).filter(o => !HERO_INDEXES.includes(o.i));

  const heroMount = document.getElementById('gallery-hero');
  heroMount.innerHTML = heroPhotos.map((p, i) => `
    <figure data-photo-idx="${HERO_INDEXES[i]}">
      <img src="${PATH + p}" alt="Winston Fibres Co. — gallery photo ${i + 1}" loading="lazy">
    </figure>`).join('');

  const gridMount = document.getElementById('gallery-grid');
  gridMount.innerHTML = masonryPhotos.map(({ p, i }) => `
    <img src="${PATH + p}" alt="Winston Fibres Co. — gallery photo" loading="lazy" data-photo-idx="${i}">`).join('');

  // Lightbox
  document.body.insertAdjacentHTML('beforeend', `
    <div class="lightbox-overlay" data-lightbox role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button class="lightbox-nav prev" type="button" data-lightbox-prev aria-label="Previous photo">‹</button>
      <img class="lightbox-img" alt="" data-lightbox-img>
      <button class="lightbox-nav next" type="button" data-lightbox-next aria-label="Next photo">›</button>
      <button class="lightbox-close" type="button" data-lightbox-close aria-label="Close">×</button>
      <div class="lightbox-counter" data-lightbox-counter></div>
    </div>`);

  const lb         = document.querySelector('[data-lightbox]');
  const lbImg      = lb.querySelector('[data-lightbox-img]');
  const lbCounter  = lb.querySelector('[data-lightbox-counter]');
  let lbIdx = 0;

  const showLb = (idx) => {
    lbIdx = (idx + PHOTOS.length) % PHOTOS.length;
    lbImg.src = PATH + PHOTOS[lbIdx];
    lbCounter.textContent = `${lbIdx + 1} / ${PHOTOS.length}`;
  };
  const openLb  = (idx) => { showLb(idx); lb.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-lightbox-close]') || e.target === lb) { closeLb(); return; }
    if (e.target.closest('[data-lightbox-prev]')) { showLb(lbIdx - 1); return; }
    if (e.target.closest('[data-lightbox-next]')) { showLb(lbIdx + 1); return; }
    const trig = e.target.closest('[data-photo-idx]');
    if (trig) openLb(+trig.dataset.photoIdx);
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLb();
    else if (e.key === 'ArrowLeft')  showLb(lbIdx - 1);
    else if (e.key === 'ArrowRight') showLb(lbIdx + 1);
  });

})();

/* ============================================================
   Team tabs (about page) — click a name, swap photo + bio.
   ============================================================ */
(function () {
  const tabs = document.querySelectorAll(".team-tab");
  if (!tabs.length) return;

  const TEAM = {
    bonnie: {
      name: "Bonnie",
      meta: "Golden Retriever",
      img:  "assets/team/bonnie.jpg",
      bio:  "Bonnie's a leggy blonde Golden Retriever with a nose for trouble — and for mushrooms. She lives for boat rides at the Muskoka cottage, banana slices, a sliver of cheese, and a long ear scratch. Her zoomies are the stuff of legend.",
      yarn: "Inspires the Mohair & Silk Lace — light, soft, and a little fluffy."
    },
    gertrude: {
      name: "Gertrude",
      meta: "Bulldog · Gertie",
      img:  "assets/team/gertrude.jpg",
      bio:  "Gertie is the talkative one — a cuddly, squishy little ham of a Bulldog who plays a serious game of tug, naps in any patch of sunlit grass, and has more heart than logic, in the very best way.",
      yarn: "Inspires the Single-Ply Fingering — soft, characterful, full of personality."
    },
    giddeon: {
      name: "Giddeon",
      meta: "Greyhound · ex-racer",
      img:  "assets/team/giddeon.jpg",
      bio:  "Adopted off the racetrack and theatrically retired, Giddeon is a hearty noodle — sturdy, built to last, occasionally faking an injury for sympathy. His zoomies are short but spectacular.",
      yarn: "Inspires the Classic Sock 3-Ply — and yes, he wears actual socks."
    },
    bindi: {
      name: "Bindi",
      meta: "Boxer",
      img:  "assets/team/bindi.jpg",
      bio:  "The life of the party. Bindi is a refined, beautiful, wildly social Boxer who loves greeting strangers, lake runs, and any other dog within sight. Soft ears, delicate legs, very good manners.",
      yarn: "Inspires the Single-Ply Bulky — warm, soft, easy company."
    },
    ellie: {
      name: "Ellie",
      meta: "Corgi · 2 yrs",
      img:  "assets/team/ellie.jpg",
      bio:  "Two years old and still a goofy ball of fluff. This Corgi lives for cheese crackers, hide-and-seek, and rolling in fresh grass. Sworn enemies: rain, the mailman, and rattling Tupperware.",
      yarn: "Inspires the 1-Ply Super Chunky — quick to knit, big on personality."
    },
    barley: {
      name: "Barley",
      meta: "Boxer",
      img:  "assets/team/barley.jpg",
      bio:  "The cuddliest ‘shmoofle’-faced Boxer you'll ever meet — velvet fur, a lovely set of jowls, and a soft spot for hand-fed snacks. Rides shotgun with the window down and watches the world go by.",
      yarn: "Inspires the 4-Ply Worsted — steady, dependable, and warm."
    },
    maisy: {
      name: "Maisy",
      meta: "Photo and bio coming soon",
      img:  null,
      bio:  "",
      yarn: ""
    },
    piper: {
      name: "Piper",
      meta: "Photo and bio coming soon",
      img:  null,
      bio:  "",
      yarn: ""
    }
  };

  const $name = document.querySelector("[data-team-name]");
  const $meta = document.querySelector("[data-team-meta]");
  const $bio  = document.querySelector("[data-team-bio]");
  const $yarn = document.querySelector("[data-team-yarn]");
  const $img  = document.querySelector("[data-team-img]");
  const $imgWrap = $img ? $img.closest(".team-panel-img") : null;

  const select = (slug) => {
    const d = TEAM[slug]; if (!d) return;
    tabs.forEach(t => {
      const on = t.dataset.team === slug;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $name.textContent = d.name;
    $meta.textContent = d.meta;
    $bio.textContent  = d.bio;
    $yarn.textContent = d.yarn;
    if (!d.img) {
      if ($imgWrap) $imgWrap.classList.add("is-placeholder");
      $img.removeAttribute("src");
      $img.alt = "";
      return;
    }
    if ($imgWrap) $imgWrap.classList.remove("is-placeholder");
    if ($img.src.indexOf(d.img) === -1) {
      $img.style.opacity = 0;
      const tmp = new Image();
      tmp.onload = () => { $img.src = d.img; $img.alt = d.name + ", " + d.meta; $img.style.opacity = 1; };
      tmp.src = d.img;
    }
  };

  tabs.forEach(t => t.addEventListener("click", () => select(t.dataset.team)));

  const tabList = tabs[0].parentElement;
  tabList.addEventListener("keydown", (e) => {
    const order = Array.from(tabs);
    const i = order.indexOf(document.activeElement);
    if (i === -1) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = order[(i + (e.key === "ArrowRight" ? 1 : -1) + order.length) % order.length];
      next.focus(); select(next.dataset.team);
    }
  });
})();

/* ============================================================
   Palette tabs (sock-project page) - click a name, swap photo + desc.
   ============================================================ */
(function () {
  const tabs = document.querySelectorAll(".palette-tab");
  if (!tabs.length) return;

  const PAL = {
    pastels: {
      name: "Pastels",
      img:  "assets/products/robins-egg.jpg",
      alt:  "Pastels palette example - soft tonal blue with sandy speckles.",
      desc: "Soft, dreamy, easy on the eyes - buttery yellows, baby blues, blush pinks, and whisper-grey neutrals. Spring-mood socks that play nicely with everything in your wardrobe."
    },
    brights: {
      name: "Brights",
      img:  "assets/products/rainbow-dash.jpg",
      alt:  "Brights palette example - bright multi-colour variegated yarn.",
      desc: "Bold and joyful - saturated teals, hot pinks, sunset oranges, and electric purples. The kits people post on their feeds. Wear them with everything else neutral."
    },
    naturals: {
      name: "Naturals",
      img:  "assets/products/forest-floor.jpg",
      alt:  "Naturals palette example - mossy greens and earthy browns.",
      desc: "Forest, stone, oat, ochre, and the occasional moody dark. Quietly beautiful, the easiest to wear with anything, and the colourway most likely to become your daily-driver socks."
    }
  };

  const $name = document.querySelector("[data-palette-name]");
  const $desc = document.querySelector("[data-palette-desc]");
  const $img  = document.querySelector("[data-palette-img]");

  const select = (slug) => {
    const d = PAL[slug]; if (!d) return;
    tabs.forEach(t => {
      const on = t.dataset.palette === slug;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $name.textContent = d.name;
    $desc.textContent = d.desc;
    if ($img.src.indexOf(d.img) === -1) {
      $img.style.opacity = 0;
      const tmp = new Image();
      tmp.onload = () => { $img.src = d.img; $img.alt = d.alt; $img.style.opacity = 1; };
      tmp.src = d.img;
    }
  };

  tabs.forEach(t => t.addEventListener("click", () => select(t.dataset.palette)));

  const list = tabs[0].parentElement;
  list.addEventListener("keydown", (e) => {
    const order = Array.from(tabs);
    const i = order.indexOf(document.activeElement);
    if (i === -1) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = order[(i + (e.key === "ArrowRight" ? 1 : -1) + order.length) % order.length];
      next.focus(); select(next.dataset.palette);
    }
  });
})();

/* -------- Brand dog: intro video on load + hover pet video + heart particles -------- */
(() => {
  'use strict';
  const brand = document.querySelector('.brand');
  if (!brand) return;
  const intro = brand.querySelector('.brand-vid-intro');
  const pet = brand.querySelector('.brand-vid-pet');
  const canvas = brand.querySelector('.brand-hearts');
  if (!intro || !pet || !canvas) return;

  const HOVER_COOLDOWN_MS = 3500;
  let introPlaying = false;
  let petOnCooldown = false;
  let hoverActive = false;

  [intro, pet].forEach(v => { v.muted = true; v.playsInline = true; });

  function syncBrandState() {
    const active = intro.classList.contains('is-active') || pet.classList.contains('is-active');
    brand.classList.toggle('is-video-active', active);
  }
  function playVid(v) {
    v.classList.add('is-active');
    syncBrandState();
    try { v.currentTime = 0; } catch (_) {}
    const p = v.play();
    if (p && p.catch) p.catch(() => { v.classList.remove('is-active'); syncBrandState(); });
  }
  function stopVid(v) {
    v.classList.remove('is-active');
    syncBrandState();
    try { v.pause(); } catch (_) {}
  }

  /* ---- Intro on every page load ---- */
  function startIntro() {
    introPlaying = true;
    playVid(intro);
  }
  intro.addEventListener('ended', () => {
    introPlaying = false;
    stopVid(intro);
  });
  intro.addEventListener('error', () => { introPlaying = false; stopVid(intro); });
  if (intro.readyState >= 2) startIntro();
  else intro.addEventListener('loadeddata', startIntro, { once: true });

  /* ---- Hover: pet video once, with cooldown + boundary-cross requirement ---- */
  pet.addEventListener('ended', () => { stopVid(pet); });

  brand.addEventListener('mouseenter', () => {
    hoverActive = true;
    startHearts();
    if (!introPlaying && !petOnCooldown) {
      petOnCooldown = true;
      playVid(pet);
      setTimeout(() => { petOnCooldown = false; }, HOVER_COOLDOWN_MS);
    }
  });
  brand.addEventListener('mouseleave', () => {
    hoverActive = false;
    stopHearts();
  });

  /* ---- Heart particles (pixel-art, monochrome, theme-aware) ---- */
  const ctx = canvas.getContext('2d');
  let hearts = [];
  let rafId = null;
  let lastSpawn = 0;
  let lastTs = 0;
  const HEART_PATTERN = [
    [0,1,0,1,0],
    [1,1,1,1,1],
    [1,1,1,1,1],
    [0,1,1,1,0],
    [0,0,1,0,0],
  ];

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener('resize', resize);

  function heartColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#111111';
  }

  function drawHeart(cx, cy, px, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = heartColor();
    const ox = cx - 2.5 * px;
    const oy = cy - 2.5 * px;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (HEART_PATTERN[r][c]) {
          ctx.fillRect(Math.round(ox + c * px), Math.round(oy + r * px), px, px);
        }
      }
    }
    ctx.restore();
  }

  function spawn() {
    const rect = canvas.getBoundingClientRect();
    hearts.push({
      x: rect.width  * (0.25 + Math.random() * 0.5),
      y: rect.height * (0.70 + Math.random() * 0.15),
      vx: (Math.random() - 0.5) * 0.025,
      vy: -(0.025 + Math.random() * 0.025),
      life: 0,
      ttl: 1400 + Math.random() * 700,
      px: 1.5 + Math.random() * 1.2,
    });
  }

  function tick(ts) {
    const dt = lastTs ? Math.min(64, ts - lastTs) : 16;
    lastTs = ts;
    if (hoverActive && ts - lastSpawn > 160) { spawn(); lastSpawn = ts; }

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hearts = hearts.filter(h => {
      h.life += dt;
      if (h.life >= h.ttl) return false;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      const t = h.life / h.ttl;
      const a = t < 0.15 ? (t / 0.15) : (1 - (t - 0.15) / 0.85);
      drawHeart(h.x, h.y, h.px, Math.max(0, a));
      return true;
    });

    if (hoverActive || hearts.length) {
      rafId = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
      rafId = null;
      lastTs = 0;
    }
  }

  function startHearts() {
    if (!rafId) { lastTs = 0; lastSpawn = 0; rafId = requestAnimationFrame(tick); }
  }
  function stopHearts() { /* tick() will wind down once hoverActive is false and hearts drain */ }
})();
