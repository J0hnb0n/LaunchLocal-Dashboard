// ============================================================
// FESCUE'S EDGE — Section components
// ============================================================

// ------------------------------------------------------------
// NAVIGATION CONTEXT — lets any descendant trigger a page change
// ------------------------------------------------------------
const NavContext = React.createContext(() => {});
const useNav = () => React.useContext(NavContext);

const Placeholder = ({ label, aspect = "4/3", tone = "green", src, className = "", position = "center" }) => {
  if (src) {
    return (
      <div
        className={"fe-photo " + className}
        style={{ aspectRatio: aspect }}
      >
        <img src={src} alt={label} loading="lazy" style={{ objectPosition: position }} />
      </div>
    );
  }
  const tones = {
    green:  { bg: "#1f3a2e", stripe: "#223f32", ink: "#e8e3d5" },
    sand:   { bg: "#c9a961", stripe: "#bf9e54", ink: "#1a1a1a" },
    paper:  { bg: "#e8e3d5", stripe: "#ded8c7", ink: "#1f3a2e" },
    night:  { bg: "#0f1a14", stripe: "#132019", ink: "#c9a961" },
  };
  const t = tones[tone] || tones.green;
  const stripe = `repeating-linear-gradient(135deg, ${t.bg} 0 18px, ${t.stripe} 18px 36px)`;
  return (
    <div
      className={"fe-placeholder " + className}
      style={{
        aspectRatio: aspect,
        background: stripe,
        color: t.ink,
      }}
    >
      <div className="fe-placeholder-inner">
        <span className="fe-placeholder-dot" />
        <span className="fe-placeholder-label">{label}</span>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// TOP BAR / NAV
// ------------------------------------------------------------
const NAV_ITEMS = [
  { id: "home",       label: "Home" },
  { id: "course",     label: "Course" },
  { id: "rates",      label: "Rates" },
  { id: "membership", label: "Membership" },
  { id: "leagues",    label: "Leagues" },
  { id: "events",     label: "Events" },
  { id: "dining",     label: "Dining & Banquets" },
];

const TopBar = ({ page, theme, setTheme }) => {
  const navigate = useNav();
  const go = (id) => (e) => { e.preventDefault(); navigate(id); };
  return (
    <header className="fe-topbar">
      <div className="fe-topbar-inner">
        <a href="#home" onClick={go("home")} className="fe-wordmark" aria-label="Fescue's Edge — home">
          <img src="img/logo-fescue.png" alt="" className="fe-logo-img" aria-hidden="true" />
          <span>
            <em>Fescue's</em> Edge
            <small>Golf Club · Scotland, Ontario</small>
          </span>
        </a>
        <nav className="fe-nav">
          {NAV_ITEMS.map(it => (
            <a
              key={it.id}
              href={"#" + it.id}
              className={page === it.id ? "is-active" : ""}
              onClick={go(it.id)}
            >
              {it.label}
            </a>
          ))}
        </nav>
        <div className="fe-top-actions">
          <button
            className="fe-theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M20.5 14A8 8 0 1110 3.5 7 7 0 0020.5 14z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          <a href="tel:5194842200" className="fe-phone" aria-label="Call the Pro Shop">
            <span className="fe-dot" /> 519·484·2200
          </a>
          <a href="https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.ComboLanding?CourseCode=FSCU&FromCourseWebsite=true" className="fe-btn-tee" target="_blank" rel="noopener">
            Book a tee time <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </header>
  );
};

// ------------------------------------------------------------
// HERO
// ------------------------------------------------------------
const Hero = () => {
  const navigate = useNav();
  return (
    <section className="fe-hero" id="top" data-screen-label="01 Hero">
      <div className="fe-hero-media">
        <Placeholder src="img/01-hero-autumn-pond.jpg" label="Autumn pond reflection" aspect="16/7" />
        <div className="fe-hero-overlay" />
      </div>

      <div className="fe-hero-content">
        <div className="fe-eyebrow fe-eyebrow-light">
          <span className="fe-eyebrow-rule" /> Scotland, Ontario
        </div>
        <h1 className="fe-display">
          Where the fescue <em>meets</em><br/>the fairway.
        </h1>
        <p className="fe-hero-sub">
          Nine holes, five tee blocks, and a welcome that's kept golfers coming back for a generation.
        </p>
        <div className="fe-hero-ctas">
          <a href="https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.ComboLanding?CourseCode=FSCU&FromCourseWebsite=true" className="fe-btn-primary fe-btn-lg" target="_blank" rel="noopener">Book a tee time</a>
          <a
            href="#course"
            onClick={(e) => { e.preventDefault(); navigate("course"); }}
            className="fe-btn-ghost fe-btn-lg"
          >Discover the course →</a>
        </div>
      </div>

      <div className="fe-hero-meta">
        <div><span className="fe-meta-k">Holes</span><span className="fe-meta-v">9</span></div>
        <div><span className="fe-meta-k">Tee blocks</span><span className="fe-meta-v">5</span></div>
        <div><span className="fe-meta-k">Range</span><span className="fe-meta-v">Bent-grass</span></div>
        <div><span className="fe-meta-k">Season</span><span className="fe-meta-v">Now open</span></div>
      </div>
    </section>
  );
};

// ------------------------------------------------------------
// STATUS BAR — quick "what's open" strip
// ------------------------------------------------------------
const StatusBar = () => (
  <section className="fe-status" aria-label="Today at Fescue's">
    <div className="fe-status-inner">
      <div className="fe-status-item">
        <span className="fe-status-pulse fe-on" /> Course <b>Open</b> · carts available
      </div>
      <div className="fe-status-item">
        <span className="fe-status-pulse fe-on" /> Driving Range <b>Open</b> · Mondays till 6:30pm
      </div>
      <div className="fe-status-item">
        <span className="fe-status-pulse fe-off" /> Kitchen <b>Closed</b> for season
      </div>
    </div>
  </section>
);

// ------------------------------------------------------------
// INTRO / STORY BLOCK
// ------------------------------------------------------------
const Intro = () => (
  <section className="fe-intro" aria-label="Welcome">
    <div className="fe-intro-inner">
      <div className="fe-intro-main">
        <div className="fe-intro-media">
          <Placeholder src="img/04-tee-path.jpg" label="Tee box looking down the fairway" aspect="4/5"/>
          <span className="fe-intro-caption">Opening tee · late afternoon</span>
        </div>
        <div className="fe-intro-body">
          <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> The Welcome</div>
          <h2 className="fe-display fe-intro-heading">
            Rolling Ontario countryside, <em>minutes</em> from Brantford.
          </h2>
          <div className="fe-intro-cols">
            <p>
              Five tee blocks mean a beginner and a scratch golfer can share the same afternoon.
            </p>
            <p>
              Bent-grass range, a clubhouse deck over the ninth, and a pace that lets the round breathe.
            </p>
          </div>
          <dl className="fe-intro-stats">
            <div><dt>Holes</dt><dd>9</dd></div>
            <div><dt>Tee blocks</dt><dd>5</dd></div>
            <div><dt>Range</dt><dd>Bent-grass</dd></div>
            <div><dt>Season</dt><dd>Now open</dd></div>
          </dl>
          <div className="fe-intro-signature">
            <span className="fe-sig-rule" />
            <span className="fe-sig-text">The Braun family · keepers of the course</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ------------------------------------------------------------
// THE COURSE
// ------------------------------------------------------------
const Course = () => (
  <section className="fe-course" id="course" data-screen-label="02 Course">
    <div className="fe-section-header">
      <div className="fe-eyebrow fe-eyebrow-light"><span className="fe-eyebrow-rule"/> The Course</div>
      <h2 className="fe-h1 fe-on-dark">Nine holes. Five tee blocks. One very good afternoon.</h2>
    </div>

    <div className="fe-course-grid">
      <div className="fe-course-hero">
        <Placeholder src="img/03-course-bunkers.jpg" label="Signature hole — bunkers and autumn maples" aspect="4/3"/>
      </div>
      <div className="fe-course-copy">
        <p className="fe-lede">
          Rolling fairways and tree-lined corridors onto wide-set greens. A course that rewards a well-struck iron and forgives a well-intentioned one.
        </p>
        <dl className="fe-course-stats">
          <div><dt>Holes</dt><dd>9</dd></div>
          <div><dt>Tee blocks</dt><dd>5</dd></div>
          <div><dt>Range</dt><dd>Bent-grass</dd></div>
        </dl>
      </div>
    </div>

    <div className="fe-course-gallery">
      <Placeholder src="img/02-flag-clubhouse.jpg" label="Approach to the green" aspect="1/1"/>
      <Placeholder src="img/04-tee-path.jpg" label="Tee box looking down" aspect="1/1"/>
      <Placeholder src="img/05-aerial-autumn.jpg" label="Aerial · autumn" aspect="1/1"/>
      <Placeholder src="img/08-summer-green-pond.jpg" label="Green over the pond" aspect="1/1"/>
    </div>
  </section>
);

// ------------------------------------------------------------
// INTERACTIVE SCORECARD — all tees shown at once
// ------------------------------------------------------------
const HOLES = [
  { hole: 1, par: 4, tips: 410, gold: 388, blue: 360, white: 332, red: 302 },
  { hole: 2, par: 3, tips: 182, gold: 170, blue: 158, white: 140, red: 118 },
  { hole: 3, par: 4, tips: 395, gold: 378, blue: 354, white: 328, red: 290 },
  { hole: 4, par: 5, tips: 521, gold: 498, blue: 470, white: 438, red: 410 },
  { hole: 5, par: 4, tips: 368, gold: 352, blue: 330, white: 304, red: 268 },
  { hole: 6, par: 3, tips: 208, gold: 192, blue: 174, white: 152, red: 128 },
  { hole: 7, par: 4, tips: 422, gold: 402, blue: 378, white: 348, red: 310 },
  { hole: 8, par: 4, tips: 398, gold: 380, blue: 354, white: 326, red: 288 },
  { hole: 9, par: 4, tips: 311, gold: 295, blue: 276, white: 252, red: 222 },
];

const TEES = [
  { k: "tips",  label: "Tips",  color: "#1a1a1a" },
  { k: "gold",  label: "Gold",  color: "#c9a961" },
  { k: "blue",  label: "Blue",  color: "#2a4e7a" },
  { k: "white", label: "White", color: "#f4efe0", outline: true },
  { k: "red",   label: "Red",   color: "#a63a3a" },
];

const Scorecard = () => {
  const parTotal = HOLES.reduce((s, h) => s + h.par, 0);

  return (
    <section className="fe-scorecard-sec" id="scorecard" data-screen-label="03 Scorecard">
      <div className="fe-section-header fe-section-header-center">
        <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> The Card</div>
        <h2 className="fe-h1">Hole by hole, tee by tee.</h2>
        <p className="fe-sub">Five tee blocks laid out side by side — play the course the way that fits your game.</p>
      </div>

      <div className="fe-scorecard">
        <table>
          <thead>
            <tr>
              <th>Tee</th>
              {HOLES.map(h => <th key={h.hole}>{h.hole}</th>)}
              <th>Out</th>
            </tr>
          </thead>
          <tbody>
            {TEES.map(t => {
              const total = HOLES.reduce((s, h) => s + h[t.k], 0);
              return (
                <tr key={t.k} className={"fe-row-tee fe-row-tee-" + t.k}>
                  <th>
                    <span className="fe-tee-cell">
                      <span
                        className="fe-tee-dot"
                        style={{
                          background: t.color,
                          boxShadow: t.outline ? "inset 0 0 0 1px #1f3a2e55" : "none"
                        }}
                      />
                      {t.label}
                    </span>
                  </th>
                  {HOLES.map(h => <td key={h.hole}>{h[t.k]}</td>)}
                  <td><b>{total.toLocaleString()}</b></td>
                </tr>
              );
            })}
            <tr className="fe-row-par">
              <th>Par</th>
              {HOLES.map(h => <td key={h.hole}>{h.par}</td>)}
              <td><b>{parTotal}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="fe-scorecard-foot">
        <span className="fe-scorecard-note">Sample layout · 2026 yardages available at the Pro Shop</span>
      </div>
    </section>
  );
};

// ------------------------------------------------------------
// RATES + PRE-PACKS
// ------------------------------------------------------------
const Rates = () => (
  <section className="fe-rates" id="rates" data-screen-label="04 Rates">
    <div className="fe-section-header">
      <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> Rates</div>
      <h2 className="fe-h1">2026 green fees &amp; pre-packs.</h2>
      <p className="fe-sub">Tax included. Book up to 7 days ahead.</p>
    </div>

    <div className="fe-rates-grid">
      <article className="fe-rate-card">
        <header>
          <h3>Weekday</h3>
          <span className="fe-rate-days">Mon – Thu</span>
        </header>
        <ul>
          <li><span>9 holes</span><b>$32</b></li>
          <li><span>18 holes</span><b>$52</b></li>
          <li><span>Twilight · after 3pm</span><b>$28</b></li>
          <li><span>Senior 65+</span><b>$28 / $44</b></li>
          <li><span>Junior 17 &amp; under</span><b>$22 / $34</b></li>
        </ul>
      </article>

      <article className="fe-rate-card fe-rate-card-feature">
        <header>
          <h3>Weekend</h3>
          <span className="fe-rate-days">Fri – Sun &amp; Holidays</span>
        </header>
        <ul>
          <li><span>9 holes</span><b>$40</b></li>
          <li><span>18 holes</span><b>$64</b></li>
          <li><span>Twilight · after 3pm</span><b>$34</b></li>
          <li><span>Power cart · 9</span><b>$18 /rider</b></li>
          <li><span>Power cart · 18</span><b>$28 /rider</b></li>
        </ul>
      </article>

      <article className="fe-rate-card">
        <header>
          <h3>Pre-Packs</h3>
          <span className="fe-rate-days">Pre-paid rounds</span>
        </header>
        <ul>
          <li><span>10-round card</span><b>$420</b></li>
          <li><span>20-round card</span><b>$780</b></li>
          <li><span>Corporate · 50 rounds</span><b>$1,850</b></li>
          <li><span>Range pass · season</span><b>$275</b></li>
          <li><span>Lesson bundle · 5</span><b>$340</b></li>
        </ul>
      </article>
    </div>

    <p className="fe-rates-foot">
      Rates are indicative of the 2026 season. For group &amp; tournament pricing, call <a href="tel:5194842200">519·484·2200</a>.
    </p>
  </section>
);

// ------------------------------------------------------------
// MEMBERSHIP
// ------------------------------------------------------------
const Membership = () => (
  <section className="fe-membership" id="membership" data-screen-label="05 Membership">
    <div className="fe-member-media">
      <Placeholder src="img/07-clubhouse-summer.jpg" label="The clubhouse" aspect="4/5" position="center"/>
    </div>
    <div className="fe-member-content">
      <div className="fe-eyebrow fe-eyebrow-light"><span className="fe-eyebrow-rule"/> Membership</div>
      <h2 className="fe-h1 fe-on-dark">A home course, without the formality.</h2>
      <p className="fe-lede fe-on-dark">
        2026 memberships are nearly full. Unlimited play, locker privileges,
        advance booking, a seat at every members' event.
      </p>

      <div className="fe-member-tiers">
        <div className="fe-tier">
          <h4>Single</h4>
          <div className="fe-tier-price"><span>$</span>1,695<small>/season</small></div>
          <ul>
            <li>Unlimited play, 7 days/week</li>
            <li>14-day advance booking</li>
            <li>Range privileges included</li>
            <li>Member events &amp; tournaments</li>
          </ul>
        </div>
        <div className="fe-tier fe-tier-feature">
          <span className="fe-tier-flag">Most popular</span>
          <h4>Couple</h4>
          <div className="fe-tier-price"><span>$</span>2,895<small>/season</small></div>
          <ul>
            <li>Two unlimited memberships</li>
            <li>14-day advance booking</li>
            <li>Range privileges included</li>
            <li>Guest pass book (×6)</li>
          </ul>
        </div>
        <div className="fe-tier">
          <h4>Intermediate · 19–35</h4>
          <div className="fe-tier-price"><span>$</span>1,195<small>/season</small></div>
          <ul>
            <li>Unlimited play, 7 days/week</li>
            <li>7-day advance booking</li>
            <li>Range privileges included</li>
            <li>Young-members socials</li>
          </ul>
        </div>
        <div className="fe-tier">
          <h4>Junior · 18 &amp; under</h4>
          <div className="fe-tier-price"><span>$</span>495<small>/season</small></div>
          <ul>
            <li>Unlimited play, 7 days/week</li>
            <li>Jr camps included</li>
            <li>Mentorship from the pro</li>
            <li>Range privileges included</li>
          </ul>
        </div>
      </div>

      <div className="fe-member-cta">
        <a href="mailto:braun@fescuesedge.com" className="fe-btn-primary fe-btn-on-dark">Enquire about 2026 — limited openings</a>
        <span className="fe-member-note">braun@fescuesedge.com · 519·484·2200</span>
      </div>
    </div>
  </section>
);

// ------------------------------------------------------------
// DRIVING RANGE
// ------------------------------------------------------------
const Range = () => (
  <section className="fe-range" id="range" data-screen-label="06 Range">
    <div className="fe-range-inner">
      <div className="fe-range-copy">
        <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> Driving Range</div>
        <h2 className="fe-h1">Bent-grass tees. A proper warm-up.</h2>
        <p className="fe-lede">
          Open to close, seven days. Mondays till 6:30. Buckets, practice
          greens, and a teaching bay with our pro.
        </p>
        <ul className="fe-range-list">
          <li><span>Small bucket</span><b>$8</b></li>
          <li><span>Large bucket</span><b>$14</b></li>
          <li><span>Season range pass</span><b>$275</b></li>
          <li><span>Private lesson · 45 min</span><b>$75</b></li>
          <li><span>Jr clinic · 6-week series</span><b>$180</b></li>
        </ul>
      </div>
      <Placeholder src="img/09-bench-wildflowers.jpg" label="A quiet view" aspect="4/5"/>
    </div>
  </section>
);

// ------------------------------------------------------------
// LEAGUES
// ------------------------------------------------------------
const Leagues = () => (
  <section className="fe-leagues" id="leagues" data-screen-label="07 Leagues">
    <div className="fe-section-header">
      <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> Leagues</div>
      <h2 className="fe-h1">Leagues for every level, every week of the season.</h2>
      <p className="fe-sub">
        All abilities welcome. Call the Pro Shop at <a href="tel:5194842200">519·484·2200</a> to enquire about a spot.
      </p>
    </div>

    <div className="fe-league-cards">
      <article className="fe-league-card">
        <header><span>Mon evenings</span><h4>Men's League</h4></header>
        <p>Stroke play with handicap. Nightly skins, season-long points race to the Closing Scramble.</p>
        <footer><span>Apr — Sep</span></footer>
      </article>
      <article className="fe-league-card">
        <header><span>Tue evenings</span><h4>Ladies' League</h4></header>
        <p>Social stroke play with handicaps across the season.</p>
        <footer><span>Apr — Sep</span></footer>
      </article>
      <article className="fe-league-card">
        <header><span>Wed mornings</span><h4>Senior League</h4></header>
        <p>Coffee at 8, tee off at 9. Team play, new pairings weekly.</p>
        <footer><span>May — Sep</span></footer>
      </article>
      <article className="fe-league-card">
        <header><span>Thu evenings</span><h4>Couples' League</h4></header>
        <p>Best ball, scramble, alt-shot — patio dinner to close.</p>
        <footer><span>May — Aug</span></footer>
      </article>
    </div>
  </section>
);

// ------------------------------------------------------------
// TOURNAMENTS + JR CAMPS
// ------------------------------------------------------------
const Events = () => (
  <section className="fe-events" id="events" data-screen-label="08 Events">
    <div className="fe-section-header">
      <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> Tournaments &amp; Jr Camps</div>
      <h2 className="fe-h1">Your day. Our grounds. A round to remember.</h2>
    </div>

    <div className="fe-events-grid">
      <article className="fe-event-feature">
        <Placeholder src="img/02-flag-clubhouse.jpg" label="Tournament day" aspect="5/3"/>
        <div className="fe-event-body">
          <h3>Host your tournament</h3>
          <p>
            Corporate outings, charity scrambles, family reunions. Groups of
            40 to 144 — we handle shotgun logistics through prize presentations.
          </p>
          <ul className="fe-event-inc">
            <li>Full-day course rental or flexible windows</li>
            <li>Cart fleet, bag-drop &amp; pro-shop support</li>
            <li>Custom scoring, pin contests, longest-drive plaques</li>
            <li>Catered banquet &amp; licensed bar options</li>
          </ul>
          <a className="fe-btn-primary" href="mailto:braun@fescuesedge.com">Request a tournament quote</a>
        </div>
      </article>

      <article className="fe-event-camp">
        <div className="fe-camp-head">
          <span className="fe-eyebrow-sm">Summer 2026</span>
          <h3>Junior Golf Camps</h3>
          <p>
            Four-day programs, 9am–3pm, lunch included. Skills stations,
            playing rounds, closing-day scramble.
          </p>
        </div>
        <ul className="fe-camp-dates">
          <li><b>Jul 6 — 9</b><span>Ages 8–17 · $475+tax</span></li>
          <li><b>Jul 20 — 23</b><span>Ages 8–17 · $475+tax</span></li>
          <li><b>Aug 10 — 13</b><span>Ages 8–17 · $475+tax</span></li>
        </ul>
        <a className="fe-link-arrow" href="mailto:braun@fescuesedge.com">Sign up by email or call the Pro Shop →</a>
      </article>
    </div>
  </section>
);

// ------------------------------------------------------------
// BANQUETS & RESTAURANT
// ------------------------------------------------------------
const Dining = () => (
  <section className="fe-dining" id="dining" data-screen-label="09 Dining">
    <div className="fe-dining-split">
      <div className="fe-dining-banquet">
        <div className="fe-eyebrow fe-eyebrow-light"><span className="fe-eyebrow-rule"/> Banquets &amp; Weddings</div>
        <h2 className="fe-h1 fe-on-dark">A room with a view of the ninth.</h2>
        <p className="fe-lede fe-on-dark">
          Receptions, rehearsal dinners, corporate meetings. Seats up to 140,
          opens onto a wrap-around deck, and the sun falling behind the back
          nine comes included.
        </p>
        <dl className="fe-banquet-specs">
          <div><dt>Seated capacity</dt><dd>140</dd></div>
          <div><dt>Cocktail capacity</dt><dd>180</dd></div>
          <div><dt>Dance floor</dt><dd>Built-in</dd></div>
          <div><dt>Bar</dt><dd>Fully licensed</dd></div>
        </dl>
        <a className="fe-btn-primary fe-btn-on-dark" href="mailto:braun@fescuesedge.com">Enquire about your date</a>
      </div>

      <div className="fe-dining-restaurant">
        <Placeholder src="img/06-patio-deck.jpg" label="The patio overlooking the pond" aspect="4/3"/>
        <div className="fe-restaurant-body">
          <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> The Clubhouse Restaurant</div>
          <h3 className="fe-h2">Honest food, a fully licensed bar, and the best deck in the county.</h3>
          <p>
            Open seven days in-season. Local producers, a famous Caesar, a
            patty melt getting there.
          </p>
          <div className="fe-hours">
            <h4>Hours</h4>
            <ul>
              <li><span>Mon – Thu</span><b>11am – 8pm</b></li>
              <li><span>Fri – Sat</span><b>11am – 10pm</b></li>
              <li><span>Sun</span><b>10am – 7pm · brunch til 2</b></li>
              <li className="fe-closed"><span>Currently</span><b>Closed for season</b></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ------------------------------------------------------------
// NEWS
// ------------------------------------------------------------
const News = () => (
  <section className="fe-news" id="news" data-screen-label="10 News">
    <div className="fe-section-header">
      <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> From the Pro Shop</div>
      <h2 className="fe-h1">News &amp; notices.</h2>
    </div>

    <div className="fe-news-grid">
      <article>
        <time>Apr 10 · 2026</time>
        <h4>Driving range opens for the season</h4>
        <p>Bent-grass tees, with expanded Monday hours till 6:30pm.</p>
      </article>
      <article>
        <time>Mar 14 · 2026</time>
        <h4>Jr Camps 2026 — dates announced</h4>
        <p>Three four-day sessions through July and August. Limited spots; sign-ups open now.</p>
      </article>
      <article>
        <time>Feb 28 · 2026</time>
        <h4>Memberships — a few spots remain</h4>
        <p>The 2026 roster is nearly full. Drop us a note if you're thinking about joining the club.</p>
      </article>
    </div>
  </section>
);

// ------------------------------------------------------------
// VISIT / CONTACT
// ------------------------------------------------------------
const Visit = () => (
  <section className="fe-visit" id="visit" data-screen-label="11 Visit">
    <div className="fe-visit-map">
      <Placeholder src="img/05-aerial-autumn.jpg" label="Aerial view of the course" aspect="4/3"/>
    </div>
    <div className="fe-visit-body">
      <div className="fe-eyebrow fe-eyebrow-light"><span className="fe-eyebrow-rule"/> Visit</div>
      <h2 className="fe-h1 fe-on-dark">Come and find us.</h2>
      <p className="fe-lede fe-on-dark">
        Scotland, Ontario. Thirty minutes south of Brantford, an hour from the
        GTA.
      </p>

      <div className="fe-visit-grid">
        <div>
          <h4>Location</h4>
          <p>Scotland, Ontario<br/>Minutes south of Brantford</p>
        </div>
        <div>
          <h4>Pro Shop</h4>
          <p><a href="tel:5194842200">519·484·2200</a><br/><a href="mailto:braun@fescuesedge.com">braun@fescuesedge.com</a></p>
        </div>
        <div>
          <h4>Course hours</h4>
          <p>Open daily in season</p>
        </div>
        <div>
          <h4>Range hours</h4>
          <p>Open to close, seven days<br/>Mondays till 6:30pm</p>
        </div>
      </div>

      <div className="fe-visit-ctas">
        <a className="fe-btn-primary fe-btn-on-dark" href="https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.ComboLanding?CourseCode=FSCU&FromCourseWebsite=true" target="_blank" rel="noopener">Book a tee time</a>
        <a className="fe-btn-ghost fe-btn-on-dark" href="https://www.google.com/maps/search/?api=1&query=Fescue%27s+Edge+Golf+Club+Scotland+Ontario" target="_blank" rel="noopener">Get directions →</a>
      </div>
    </div>
  </section>
);

// ------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------
const Footer = () => {
  const navigate = useNav();
  const go = (id) => (e) => { e.preventDefault(); navigate(id); };
  return (
    <footer className="fe-footer">
      <div className="fe-footer-top">
        <div className="fe-footer-brand">
          <h3><em>Fescue's</em> Edge</h3>
          <p>A championship nine in Scotland, Ontario —<br/>a quietly-good place to spend an afternoon.</p>
        </div>
        <div className="fe-footer-cols">
          <div>
            <h5>Play</h5>
            <a href="#course" onClick={go("course")}>The Course</a>
            <a href="#rates" onClick={go("rates")}>Rates</a>
            <a href="#rates" onClick={go("rates")}>Driving Range</a>
            <a href="https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.ComboLanding?CourseCode=FSCU&FromCourseWebsite=true" target="_blank" rel="noopener">Book a tee time</a>
          </div>
          <div>
            <h5>Club</h5>
            <a href="#membership" onClick={go("membership")}>Membership</a>
            <a href="#leagues" onClick={go("leagues")}>Leagues</a>
            <a href="#events" onClick={go("events")}>Tournaments</a>
            <a href="#events" onClick={go("events")}>Jr Camps</a>
          </div>
          <div>
            <h5>Host</h5>
            <a href="#dining" onClick={go("dining")}>Banquets &amp; Weddings</a>
            <a href="#dining" onClick={go("dining")}>Restaurant</a>
          </div>
          <div>
            <h5>Visit</h5>
            <a href="tel:5194842200">519·484·2200</a>
            <a href="mailto:braun@fescuesedge.com">braun@fescuesedge.com</a>
            <a href="https://www.google.com/maps/search/?api=1&query=Fescue%27s+Edge+Golf+Club+Scotland+Ontario" target="_blank" rel="noopener">Directions</a>
          </div>
        </div>
      </div>
      <div className="fe-footer-bottom">
        <span>© 2026 Fescue's Edge Golf Club · 18 Hagan Road, Scotland ON</span>
        <span>Design concept · for client review</span>
      </div>
    </footer>
  );
};

// ------------------------------------------------------------
// HOME PAGE — landing composition
// ------------------------------------------------------------
const Home = () => (
  <>
    <Hero />
    <StatusBar />
    <Intro />
    <News />
    <Visit />
  </>
);

// ------------------------------------------------------------
// APP SHELL — theme + hash-based page routing
// ------------------------------------------------------------
const PAGES = {
  home:       () => <Home />,
  course:     () => <><Course /><Scorecard /></>,
  rates:      () => <><Rates /><Range /></>,
  membership: () => <Membership />,
  leagues:    () => <Leagues />,
  events:     () => <Events />,
  dining:     () => <Dining />,
};

const getPageFromHash = () => {
  const h = (window.location.hash || "").replace(/^#/, "");
  return PAGES[h] ? h : "home";
};

const App = () => {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem("fe-theme") || "light"; } catch (e) { return "light"; }
  });
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("fe-theme", theme); } catch (e) {}
  }, [theme]);

  const [page, setPage] = React.useState(getPageFromHash);
  React.useEffect(() => {
    const onHash = () => setPage(getPageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = React.useCallback((p) => {
    const next = PAGES[p] ? p : "home";
    if (next === "home") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
      window.location.hash = next;
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const render = PAGES[page] || PAGES.home;

  return (
    <NavContext.Provider value={navigate}>
      <TopBar page={page} theme={theme} setTheme={setTheme} />
      <main key={page} className={"fe-page fe-page-" + page}>
        {render()}
      </main>
      <Footer />
    </NavContext.Provider>
  );
};

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------
Object.assign(window, {
  TopBar, Hero, StatusBar, Intro, Course, Scorecard, Rates,
  Membership, Range, Leagues, Events, Dining, News, Visit, Footer,
  Home, App, NavContext,
});
