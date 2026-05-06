// ============================================================
// FESCUE'S EDGE — Section components
// ============================================================

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
const TopBar = () => (
  <header className="fe-topbar">
    <div className="fe-topbar-inner">
      <a href="#top" className="fe-wordmark">
        <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.25"/>
          <path d="M12 26 Q 20 8 28 26" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
          <circle cx="20" cy="28" r="1.8" fill="currentColor"/>
        </svg>
        <span>
          <em>Fescue's</em> Edge
          <small>Golf Club · Est. Scotland, Ontario</small>
        </span>
      </a>
      <nav className="fe-nav">
        <a href="#course">Course</a>
        <a href="#rates">Rates</a>
        <a href="#membership">Membership</a>
        <a href="#leagues">Leagues</a>
        <a href="#events">Events</a>
        <a href="#dining">Dining &amp; Banquets</a>
        <a href="#visit">Visit</a>
      </nav>
      <div className="fe-top-actions">
        <a href="tel:5194842200" className="fe-phone" aria-label="Call the Pro Shop">
          <span className="fe-dot" /> 519·484·2200
        </a>
        <a href="https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.ComboLanding?CourseCode=FSCU&FromCourseWebsite=true" className="fe-btn-primary">
          Book a Tee Time <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </header>
);

// ------------------------------------------------------------
// HERO
// ------------------------------------------------------------
const Hero = () => (
  <section className="fe-hero" id="top" data-screen-label="01 Hero">
    <div className="fe-hero-media">
      <Placeholder src="img/01-hero-autumn-pond.jpg" label="Autumn pond reflection" aspect="16/7" />
      <div className="fe-hero-overlay" />
    </div>

    <div className="fe-hero-content">
      <div className="fe-eyebrow fe-eyebrow-light">
        <span className="fe-eyebrow-rule" /> A championship nine · Scotland, Ontario
      </div>
      <h1 className="fe-display">
        Where the fescue <em>meets</em><br/>the fairway.
      </h1>
      <p className="fe-hero-sub">
        One hundred acres of rolling Ontario countryside, five tee blocks, and
        a welcome that's kept golfers coming back for a generation.
      </p>
      <div className="fe-hero-ctas">
        <a href="https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.ComboLanding?CourseCode=FSCU&FromCourseWebsite=true" className="fe-btn-primary fe-btn-lg">Book a Tee Time</a>
        <a href="#course" className="fe-btn-ghost fe-btn-lg">Discover the course →</a>
      </div>
    </div>

    <div className="fe-hero-meta">
      <div><span className="fe-meta-k">Par</span><span className="fe-meta-v">35</span></div>
      <div><span className="fe-meta-k">Yardage</span><span className="fe-meta-v">3,215</span></div>
      <div><span className="fe-meta-k">Holes</span><span className="fe-meta-v">9 · 5 tees</span></div>
      <div><span className="fe-meta-k">Acres</span><span className="fe-meta-v">100</span></div>
      <div><span className="fe-meta-k">Season</span><span className="fe-meta-v">Now open</span></div>
    </div>
  </section>
);

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
        <span className="fe-status-pulse fe-on" /> Driving Range <b>Open</b> · Mon till 6:30pm
      </div>
      <div className="fe-status-item">
        <span className="fe-status-pulse fe-off" /> Kitchen <b>Closed</b> for season
      </div>
      <div className="fe-status-item fe-status-weather">
        <span>☀︎</span> 18°C · Wind WSW 9 km/h · Tees dry
      </div>
      <div className="fe-status-item fe-status-time">
        Tee sheet: 47 of 120 slots open today
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
            One hundred acres of <em>rolling</em> Ontario countryside.
          </h2>
          <div className="fe-intro-cols">
            <p>
              Tucked into Scotland, minutes south of Brantford. Five tee blocks
              mean a beginner and a scratch golfer can share the same afternoon.
            </p>
            <p>
              Bent-grass range, a clubhouse deck over the ninth, and a pace
              that lets the round breathe.
            </p>
          </div>
          <dl className="fe-intro-stats">
            <div><dt>Par</dt><dd>35</dd></div>
            <div><dt>Yardage</dt><dd>3,215</dd></div>
            <div><dt>Holes</dt><dd>9</dd></div>
            <div><dt>Tee blocks</dt><dd>5</dd></div>
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
          Rolling fairways. Tree-lined corridors onto wide-set greens. A course
          that rewards a well-struck iron and forgives a well-intentioned one.
        </p>
        <dl className="fe-course-stats">
          <div><dt>Par</dt><dd>35</dd></div>
          <div><dt>Length</dt><dd>3,215 yd</dd></div>
          <div><dt>Tee blocks</dt><dd>5</dd></div>
          <div><dt>Course type</dt><dd>Championship 9</dd></div>
          <div><dt>Acreage</dt><dd>100</dd></div>
          <div><dt>Pace</dt><dd>~1h 55m</dd></div>
        </dl>
        <div className="fe-dress">
          <h4>Dress code in effect.</h4>
          <p>Collared shirts preferred. No jeans, cut-offs, or muscle shirts.</p>
        </div>
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
// INTERACTIVE SCORECARD
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

const Scorecard = () => {
  const [tee, setTee] = React.useState("blue");
  const total = HOLES.reduce((s, h) => s + h[tee], 0);
  const parTotal = HOLES.reduce((s, h) => s + h.par, 0);

  const tees = [
    { k: "tips", label: "Tips",  color: "#1a1a1a" },
    { k: "gold", label: "Gold",  color: "#c9a961" },
    { k: "blue", label: "Blue",  color: "#2a4e7a" },
    { k: "white", label: "White", color: "#e8e3d5" },
    { k: "red",  label: "Red",   color: "#a63a3a" },
  ];

  return (
    <section className="fe-scorecard-sec" id="scorecard" data-screen-label="03 Scorecard">
      <div className="fe-section-header fe-section-header-center">
        <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> The Card</div>
        <h2 className="fe-h1">Hole by hole, tee by tee.</h2>
        <p className="fe-sub">Switch tee blocks to see the yardage shift.</p>
      </div>

      <div className="fe-tees">
        {tees.map(t => (
          <button
            key={t.k}
            className={"fe-tee-pill " + (tee === t.k ? "is-active" : "")}
            onClick={() => setTee(t.k)}
          >
            <span className="fe-tee-dot" style={{ background: t.color, boxShadow: t.k === "white" ? "inset 0 0 0 1px #1f3a2e33" : "none" }} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="fe-scorecard">
        <table>
          <thead>
            <tr>
              <th>Hole</th>
              {HOLES.map(h => <th key={h.hole}>{h.hole}</th>)}
              <th>Out</th>
            </tr>
          </thead>
          <tbody>
            <tr className="fe-row-yards">
              <th>Yards ({tees.find(t => t.k === tee).label})</th>
              {HOLES.map(h => <td key={h.hole}>{h[tee]}</td>)}
              <td><b>{total.toLocaleString()}</b></td>
            </tr>
            <tr className="fe-row-par">
              <th>Par</th>
              {HOLES.map(h => <td key={h.hole}>{h.par}</td>)}
              <td><b>{parTotal}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="fe-scorecard-foot">
        <a href="#" className="fe-link-arrow">Download printable scorecard (PDF) →</a>
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
// LEAGUES + MEN'S LEAGUE FEATURE
// ------------------------------------------------------------
const STANDINGS = [
  { pos: 1,  name: "D. MacIntyre",  rounds: 14, avg: 38.2, pts: 112 },
  { pos: 2,  name: "R. Clarke",     rounds: 14, avg: 38.6, pts: 108 },
  { pos: 3,  name: "T. Braun",      rounds: 13, avg: 39.1, pts: 104 },
  { pos: 4,  name: "J. Whitfield",  rounds: 14, avg: 39.4, pts: 101 },
  { pos: 5,  name: "K. Doyle",      rounds: 12, avg: 39.8, pts: 96  },
  { pos: 6,  name: "A. Petrov",     rounds: 14, avg: 40.1, pts: 93  },
  { pos: 7,  name: "M. Goodfellow", rounds: 13, avg: 40.3, pts: 91  },
  { pos: 8,  name: "S. Reyes",      rounds: 14, avg: 40.6, pts: 89  },
  { pos: 9,  name: "L. Ostrander",  rounds: 11, avg: 41.0, pts: 82  },
  { pos: 10, name: "B. Tomlin",     rounds: 13, avg: 41.2, pts: 80  },
];

const Leagues = () => (
  <section className="fe-leagues" id="leagues" data-screen-label="07 Leagues">
    <div className="fe-section-header">
      <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> Leagues</div>
      <h2 className="fe-h1">Leagues for every level, every week of the season.</h2>
      <p className="fe-sub">
        All abilities welcome. Call the Pro Shop at <a href="tel:5194842200">519·484·2200</a> to enquire.
      </p>
    </div>

    <div className="fe-league-cards">
      <article className="fe-league-card">
        <header><span>Tue evenings</span><h4>Ladies' League</h4></header>
        <p>Social stroke play with handicaps across the season.</p>
        <footer><span>Apr 28 — Sep 22</span><a className="fe-link-arrow">Details →</a></footer>
      </article>
      <article className="fe-league-card">
        <header><span>Wed mornings</span><h4>Senior League</h4></header>
        <p>Coffee at 8, tee off at 9. Team play, new pairings weekly.</p>
        <footer><span>May 06 — Sep 30</span><a className="fe-link-arrow">Details →</a></footer>
      </article>
      <article className="fe-league-card">
        <header><span>Thu evenings</span><h4>Couples' League</h4></header>
        <p>Best ball, scramble, alt-shot — patio dinner to close.</p>
        <footer><span>May 14 — Aug 27</span><a className="fe-link-arrow">Details →</a></footer>
      </article>
      <article className="fe-league-card">
        <header><span>Sat mornings</span><h4>Junior Development</h4></header>
        <p>On-course coaching &amp; play for juniors 8–17.</p>
        <footer><span>May 09 — Aug 29</span><a className="fe-link-arrow">Details →</a></footer>
      </article>
    </div>

    {/* ------ MEN'S LEAGUE FEATURE ------ */}
    <div className="fe-mens" data-screen-label="07a Men's League">
      <div className="fe-mens-head">
        <div>
          <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> The Monday Night Men's League</div>
          <h2 className="fe-h1">Seventy-four men. One scorecard. Nine holes.</h2>
          <p className="fe-lede">
            Monday evenings, April to September. Stroke play with handicap,
            nightly skins, weekly flights, season-long points race to the
            Closing Scramble.
          </p>
        </div>
        <div className="fe-mens-key">
          <div><span>Night</span><b>Mondays · 4:30pm shotgun</b></div>
          <div><span>Format</span><b>Stroke play · handicap</b></div>
          <div><span>Season</span><b>Apr 27 — Sep 21</b></div>
          <div><span>Fee</span><b>$395 all-in</b></div>
          <div><span>Spots</span><b>Full · waitlist open</b></div>
        </div>
      </div>

      <div className="fe-mens-grid">
        <div className="fe-standings">
          <div className="fe-standings-head">
            <h3>Season standings — Week 11 of 22</h3>
            <span className="fe-update">Updated Mon 10:42pm</span>
          </div>
          <table>
            <thead>
              <tr><th>#</th><th>Player</th><th>Rd</th><th>Avg</th><th>Pts</th></tr>
            </thead>
            <tbody>
              {STANDINGS.map(p => (
                <tr key={p.pos} className={p.pos <= 3 ? "fe-top" : ""}>
                  <td><span className={"fe-pos fe-pos-" + p.pos}>{p.pos}</span></td>
                  <td>{p.name}</td>
                  <td>{p.rounds}</td>
                  <td>{p.avg.toFixed(1)}</td>
                  <td><b>{p.pts}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          <a className="fe-link-arrow">Full standings &amp; weekly scorecards →</a>
        </div>

        <aside className="fe-mens-aside">
          <div className="fe-schedule">
            <h4>Upcoming nights</h4>
            <ul>
              <li><b>Mon · Apr 27</b><span>Opening Night — Scramble</span></li>
              <li><b>Mon · May 04</b><span>Week 1 · Stroke (handicap)</span></li>
              <li><b>Mon · May 11</b><span>Week 2 · Stableford</span></li>
              <li><b>Mon · May 18</b><span>Week 3 · Two-man best ball</span></li>
              <li><b>Mon · May 25</b><span>Week 4 · Stroke (handicap)</span></li>
              <li><b>Mon · Jun 01</b><span>Club Night · Steak dinner</span></li>
            </ul>
          </div>
          <div className="fe-spotlight">
            <span className="fe-eyebrow-sm">Last week's low net</span>
            <h4>D. MacIntyre — 32</h4>
            <p>Four birdies, no bogeys. Unofficial course record through the back five.</p>
          </div>
        </aside>
      </div>
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
    <div className="fe-section-header fe-section-header-row">
      <div>
        <div className="fe-eyebrow"><span className="fe-eyebrow-rule"/> From the Pro Shop</div>
        <h2 className="fe-h1">News &amp; notices.</h2>
      </div>
      <a className="fe-link-arrow">Archive →</a>
    </div>

    <div className="fe-news-grid">
      <article>
        <time>Apr 10 · 2026</time>
        <h4>Driving range opens for the season</h4>
        <p>Bent-grass tees, new mat section at the north end, and expanded Monday hours till 6:30pm.</p>
        <a className="fe-link-arrow">Read →</a>
      </article>
      <article>
        <time>Mar 29 · 2026</time>
        <h4>Carts back on Sunday March 29th</h4>
        <p>The frost has broken and the fairways are rolling. Tee times open at 8am, all week.</p>
        <a className="fe-link-arrow">Read →</a>
      </article>
      <article>
        <time>Mar 14 · 2026</time>
        <h4>Jr Camp 2026 — dates announced</h4>
        <p>Three four-day sessions through July and August. Limited spots; sign-ups open this week.</p>
        <a className="fe-link-arrow">Read →</a>
      </article>
      <article>
        <time>Feb 28 · 2026</time>
        <h4>Memberships — a few spots remain</h4>
        <p>The 2026 roster is nearly full. Drop us a note if you're thinking about joining the club.</p>
        <a className="fe-link-arrow">Read →</a>
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
          <h4>Address</h4>
          <p>18 Hagan Road<br/>Scotland, Ontario<br/>N0E 1R0</p>
        </div>
        <div>
          <h4>Pro Shop</h4>
          <p><a href="tel:5194842200">519·484·2200</a><br/><a href="mailto:braun@fescuesedge.com">braun@fescuesedge.com</a></p>
        </div>
        <div>
          <h4>Course hours</h4>
          <p>Daily, 7:00am — dusk<br/>Book up to 7 days ahead</p>
        </div>
        <div>
          <h4>Range hours</h4>
          <p>Open to close, seven days<br/>Monday till 6:30pm</p>
        </div>
      </div>

      <div className="fe-visit-ctas">
        <a className="fe-btn-primary fe-btn-on-dark" href="https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.ComboLanding?CourseCode=FSCU&FromCourseWebsite=true">Book a tee time</a>
        <a className="fe-btn-ghost fe-btn-on-dark" href="#">Get directions →</a>
      </div>
    </div>
  </section>
);

// ------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------
const Footer = () => (
  <footer className="fe-footer">
    <div className="fe-footer-top">
      <div className="fe-footer-brand">
        <h3><em>Fescue's</em> Edge</h3>
        <p>A championship nine in Scotland, Ontario —<br/>a quietly-good place to spend an afternoon.</p>
      </div>
      <div className="fe-footer-cols">
        <div>
          <h5>Play</h5>
          <a href="#course">The Course</a>
          <a href="#rates">Rates</a>
          <a href="#scorecard">Scorecard</a>
          <a href="#range">Driving Range</a>
        </div>
        <div>
          <h5>Club</h5>
          <a href="#membership">Membership</a>
          <a href="#leagues">Leagues</a>
          <a href="#events">Tournaments</a>
          <a href="#events">Jr Camps</a>
        </div>
        <div>
          <h5>Host</h5>
          <a href="#dining">Banquets</a>
          <a href="#dining">Weddings</a>
          <a href="#dining">Restaurant</a>
          <a href="#news">News</a>
        </div>
        <div>
          <h5>Visit</h5>
          <a href="#visit">Directions</a>
          <a href="tel:5194842200">519·484·2200</a>
          <a href="mailto:braun@fescuesedge.com">Email</a>
          <a href="#">Newsletter</a>
        </div>
      </div>
    </div>
    <div className="fe-footer-bottom">
      <span>© 2026 Fescue's Edge Golf Club · 18 Hagan Road, Scotland ON</span>
      <span>Design concept · for client review</span>
    </div>
  </footer>
);

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------
Object.assign(window, {
  TopBar, Hero, StatusBar, Intro, Course, Scorecard, Rates,
  Membership, Range, Leagues, Events, Dining, News, Visit, Footer,
});
