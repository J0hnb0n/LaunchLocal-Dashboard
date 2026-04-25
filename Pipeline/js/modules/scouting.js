/* ============================================
   LaunchLocal — Scouting Module
   ============================================ */

// Known large chains (Canadian / ON-centric). Businesses matching any of these
// tokens are auto-excluded when the "Exclude chains" checkbox is on — they're
// unlikely Launch Local targets since they all have corporate web presence.
// Entries should be lowercase with apostrophes/punctuation stripped — matched
// against normalized business names with word boundaries.
const CHAIN_BLACKLIST = [
    // Fast food / QSR
    'mcdonalds', 'wendys', 'burger king', 'subway', 'tim hortons', 'starbucks',
    'a w', 'kfc', 'harveys', 'popeyes', 'pizza hut', 'dominos', 'little caesars',
    'mary browns', 'taco bell', 'dairy queen', 'pizza pizza', 'pizza nova',
    'panago', 'chipotle', 'five guys', 'mcdonald s', 'arbys', 'quiznos',
    'second cup', 'country style', 'coffee time', 'booster juice', 'jugo juice',
    // Casual dining
    'boston pizza', 'swiss chalet', 'east side marios', 'kelseys', 'montanas',
    'the keg', 'applebees', 'dennys', 'ihop', 'cora', 'symposium cafe',
    'jack astors', 'milestones', 'earls', 'moxies', 'red lobster', 'olive garden',
    'state and main', 'the works', 'mr sub', 'mucho burrito',
    // Grocery / retail
    'walmart', 'canadian tire', 'home depot', 'lowes', 'costco', 'ikea',
    'shoppers drug mart', 'rexall', 'pharmasave', 'dollarama', 'dollar tree',
    'no frills', 'loblaws', 'metro', 'sobeys', 'food basics', 'freshco',
    'longos', 'giant tiger', 'winners', 'marshalls', 'homesense',
    'best buy', 'staples', 'indigo', 'chapters', 'michaels', 'bulk barn',
    'lcbo', 'the beer store', 'walmart supercentre',
    // Convenience / gas
    '7 eleven', 'macs', 'circle k', 'couche tard', 'hasty market',
    'esso', 'shell', 'petro canada', 'pioneer', 'ultramar', 'husky',
    // Auto
    'jiffy lube', 'mr lube', 'midas', 'speedy auto', 'napa', 'mister transmission',
    'goodyear', 'kal tire', 'active green and ross', 'uniroyal',
    // Hair / beauty
    'great clips', 'first choice haircutters', 'supercuts', 'magicuts',
    // Banks
    'rbc', 'td canada trust', 'bmo', 'scotiabank', 'cibc', 'national bank',
    'desjardins', 'td bank',
    // Hotels
    'marriott', 'holiday inn', 'best western', 'comfort inn', 'hampton',
    'ramada', 'super 8', 'days inn', 'quality inn', 'fairfield inn',
    'hilton', 'sheraton', 'westin', 'travelodge', 'motel 6',
    // Gyms / fitness
    'goodlife fitness', 'planet fitness', 'anytime fitness', 'ymca', 'la fitness',
    // Misc services
    'ups store', 'fedex', 'h r block', 'money mart'
];

const normalizeForChainMatch = (s) => (s || '')
    .toLowerCase()
    .replace(/['\u2018\u2019\u02bc]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const CHAIN_MATCHERS = CHAIN_BLACKLIST.map(c => new RegExp(`\\b${c.replace(/\s+/g, '\\s+')}\\b`));

const isChainName = (name) => {
    const n = normalizeForChainMatch(name);
    if (!n) return false;
    return CHAIN_MATCHERS.some(re => re.test(n));
};

const ScoutingModule = {
    map: null,
    marker: null,
    circle: null,
    _resultMarkers: [],
    scanLat: 43.2557,   // Default: Hamilton, ON
    scanLng: -79.8711,
    scanRadius: 1000,
    scanResults: [],
    existingPlaceIds: new Set(),

    async render(container) {
        container.innerHTML = this.getShellHTML();
        await this.loadExistingIds();
        this.initMap();
        this.bindEvents(container);
        return () => {
            if (this._resultMarkers) {
                this._resultMarkers.forEach(m => { try { m.remove(); } catch(_) {} });
                this._resultMarkers = [];
            }
            if (this.map) {
                this.map.remove();
                this.map = null;
                this.marker = null;
                this.circle = null;
            }
            this.scanResults = [];
            this.existingPlaceIds = new Set();
        };
    },

    async loadExistingIds() {
        // Pull ALL prospects regardless of status — archived included. A
        // business that was once scraped and archived must not re-enter the
        // pipeline on a future scan, and anything already active upstream
        // (approved/sold/etc.) is obviously also a duplicate.
        try {
            const prospects = await DB.getDocs('prospects');
            this.existingPlaceIds = new Set(
                prospects.map(p => p.googlePlaceId).filter(Boolean)
            );
        } catch {
            this.existingPlaceIds = new Set();
        }
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <h2 class="page-title">Scouting</h2>
                    <p class="page-subtitle">Drag the pin to your target area, set a radius, and scan for local businesses.</p>
                </div>
            </div>

            <div class="scout-layout">
                <!-- Left: Controls + Results -->
                <div class="scout-panel card">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">Jump to Location</label>
                            <div style="display:flex;gap:6px;">
                                <input type="text" class="form-input" id="scout-location-input"
                                    placeholder="e.g. Brantford, ON" style="flex:1;">
                                <button class="btn btn-secondary" id="scout-go-btn" style="flex-shrink:0;">Go</button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Search Radius</label>
                            <div class="radius-options">
                                <button class="radius-btn" data-radius="500">500m</button>
                                <button class="radius-btn active" data-radius="1000">1 km</button>
                                <button class="radius-btn" data-radius="2000">2 km</button>
                                <button class="radius-btn" data-radius="5000">5 km</button>
                                <button class="radius-btn" data-radius="10000">10 km</button>
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom:12px;">
                            <label class="form-label">Business Category</label>
                            <select class="form-input" id="scout-category">
                                <option value="">All Categories</option>
                                <option value="restaurant">Restaurant / Food</option>
                                <option value="tradesperson">Tradesperson / Auto</option>
                                <option value="salon">Salon / Spa</option>
                                <option value="retail">Retail</option>
                                <option value="medical">Medical / Dental</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:12px;">
                            <label style="display:flex;align-items:center;gap:8px;font-size:var(--font-size-sm);cursor:pointer;color:var(--text-primary);">
                                <input type="checkbox" id="scout-exclude-chains" checked style="cursor:pointer;">
                                <span>Exclude large chains (McDonald's, Tim Hortons, etc.)</span>
                            </label>
                        </div>
                        <button class="btn btn-secondary" id="scout-locate-btn" style="width:100%;margin-bottom:8px;">&#127760; Use My Location</button>
                        <button class="btn btn-primary" id="scout-scan-btn" style="width:100%;">
                            <span class="btn-text">Scan This Area</span>
                        </button>
                        <button class="btn btn-secondary" id="scout-find-more-btn" style="width:100%;margin-top:8px;display:none;">
                            <span class="btn-text">Find More (by popularity)</span>
                        </button>
                        <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:8px;text-align:center;line-height:1.4;">
                            Each scan uses ~1 Google Places API call. "Find More" re-queries by popularity and appends new results. Businesses already in your pipeline are filtered out.
                        </p>
                    </div>

                    <div id="scout-results" style="display:none;">
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--border-light);">
                            <span id="scout-results-count" style="font-size:var(--font-size-sm);font-weight:600;color:var(--text-primary);"></span>
                            <button class="btn btn-sm btn-ghost" id="scout-toggle-all">Deselect All</button>
                        </div>
                        <div id="scout-results-list" style="max-height:380px;overflow-y:auto;padding:0 12px 12px;"></div>
                        <div style="padding:12px 16px;border-top:1px solid var(--border-light);">
                            <button class="btn btn-primary" id="scout-import-btn" style="width:100%;">
                                <span class="btn-text">Import Selected to Pipeline</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right: Map -->
                <div id="scout-map" class="scout-map-container"></div>
            </div>
        `;
    },

    initMap() {
        if (!window.L) {
            document.getElementById('scout-map').innerHTML = `
                <div class="empty-state" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                    <div class="empty-state-icon">&#128506;</div>
                    <h3 class="empty-state-title">Map unavailable</h3>
                    <p class="empty-state-desc">Could not load the map library. Check your internet connection.</p>
                </div>
            `;
            return;
        }

        this.map = L.map('scout-map').setView([this.scanLat, this.scanLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        const pinIcon = L.divIcon({
            className: '',
            html: '<div style="width:20px;height:20px;background:#1A73E8;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:grab;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        this.marker = L.marker([this.scanLat, this.scanLng], { draggable: true, icon: pinIcon }).addTo(this.map);
        this.circle = L.circle([this.scanLat, this.scanLng], {
            radius: this.scanRadius,
            color: '#1A73E8',
            fillColor: '#1A73E8',
            fillOpacity: 0.07,
            weight: 2,
            dashArray: '6, 6'
        }).addTo(this.map);

        this.marker.on('dragend', () => {
            const pos = this.marker.getLatLng();
            this.scanLat = pos.lat;
            this.scanLng = pos.lng;
            this.circle.setLatLng(pos);
        });
    },

    bindEvents(container) {
        // Radius buttons
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.radius-btn');
            if (btn) {
                container.querySelectorAll('.radius-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.scanRadius = parseInt(btn.getAttribute('data-radius'));
                if (this.circle) {
                    this.circle.setRadius(this.scanRadius);
                    if (this.map) this.map.fitBounds(this.circle.getBounds(), { padding: [30, 30] });
                }
            }
        });

        // Location search
        const goBtn = container.querySelector('#scout-go-btn');
        const locationInput = container.querySelector('#scout-location-input');

        const doGeocode = () => this.geocodeLocation(locationInput?.value?.trim());
        goBtn?.addEventListener('click', doGeocode);
        locationInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doGeocode();
        });

        // Geolocation
        container.querySelector('#scout-locate-btn')?.addEventListener('click', () => {
            if (!navigator.geolocation) {
                LaunchLocal.toast('Geolocation not supported by your browser.', 'warning');
                return;
            }
            const btn = container.querySelector('#scout-locate-btn');
            btn.textContent = 'Locating...';
            btn.disabled = true;
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.scanLat = pos.coords.latitude;
                    this.scanLng = pos.coords.longitude;
                    const latlng = [this.scanLat, this.scanLng];
                    if (this.marker) this.marker.setLatLng(latlng);
                    if (this.circle) {
                        this.circle.setLatLng(latlng);
                        if (this.map) this.map.fitBounds(this.circle.getBounds(), { padding: [30, 30] });
                    }
                    btn.innerHTML = '&#127760; Use My Location';
                    btn.disabled = false;
                },
                () => {
                    LaunchLocal.toast('Could not get your location.', 'warning');
                    btn.innerHTML = '&#127760; Use My Location';
                    btn.disabled = false;
                }
            );
        });

        // Scan
        container.querySelector('#scout-scan-btn')?.addEventListener('click', () => this.runScan('DISTANCE', false));
        container.querySelector('#scout-find-more-btn')?.addEventListener('click', () => this.runScan('POPULARITY', true));

        // Toggle all checkboxes
        container.addEventListener('click', (e) => {
            if (e.target.id === 'scout-toggle-all') {
                const boxes = container.querySelectorAll('.scout-check:not(:disabled)');
                const allChecked = Array.from(boxes).every(cb => cb.checked);
                boxes.forEach(cb => cb.checked = !allChecked);
                e.target.textContent = allChecked ? 'Select All' : 'Deselect All';
            }
        });

        // Import
        container.querySelector('#scout-import-btn')?.addEventListener('click', () => this.importResults(container));
    },

    async runScan(rankPreference = 'DISTANCE', appendMode = false) {
        const scanBtn = document.getElementById('scout-scan-btn');
        const moreBtn = document.getElementById('scout-find-more-btn');
        const activeBtn = appendMode ? moreBtn : scanBtn;
        activeBtn.classList.add('btn-loading');
        if (scanBtn) scanBtn.disabled = true;
        if (moreBtn) moreBtn.disabled = true;

        try {
            const category = document.getElementById('scout-category').value;
            const types = this.getCategoryTypes(category);
            const places = await API.nearbySearch(this.scanLat, this.scanLng, this.scanRadius, types, rankPreference);

            if (places.length === 0) {
                LaunchLocal.toast('No businesses found. Try a larger radius or different category.', 'info');
                return;
            }

            const alreadyShownIds = appendMode
                ? new Set(this.scanResults.map(r => r.place.id))
                : new Set();

            const excludeChains = !!document.getElementById('scout-exclude-chains')?.checked;

            let chainsFiltered = 0;
            const newResults = places
                .filter(p => {
                    if (this.existingPlaceIds.has(p.id) || alreadyShownIds.has(p.id)) return false;
                    if (excludeChains && isChainName(p.displayName?.text)) {
                        chainsFiltered++;
                        return false;
                    }
                    return true;
                })
                .map(place => {
                    const prospect = API.placeToProspect(place);
                    const { score, breakdown } = Scoring.calculate(prospect);
                    return { place, prospect, score, breakdown };
                });

            const totalFromApi = places.length;
            const filteredOut = totalFromApi - newResults.length;

            if (appendMode) {
                this.scanResults = [...this.scanResults, ...newResults]
                    .sort((a, b) => b.score - a.score);
            } else {
                this.scanResults = newResults.sort((a, b) => b.score - a.score);
            }

            const chainNote = chainsFiltered > 0
                ? ` (${chainsFiltered} chain${chainsFiltered !== 1 ? 's' : ''} excluded)`
                : '';

            if (newResults.length === 0) {
                const base = appendMode
                    ? `Popularity scan returned ${totalFromApi} business${totalFromApi !== 1 ? 'es' : ''}, none new. Try a different category or move the pin.`
                    : `No new businesses among ${totalFromApi} nearby — everything's already in your pipeline or filtered. Try "Find More" or a different category.`;
                LaunchLocal.toast(base + chainNote, 'info');
            } else if (appendMode && filteredOut > 0) {
                LaunchLocal.toast(`Added ${newResults.length} new · skipped ${filteredOut} duplicate${filteredOut !== 1 ? 's' : ''}${chainNote}.`, 'success');
            } else if (chainsFiltered > 0) {
                LaunchLocal.toast(`${newResults.length} new business${newResults.length !== 1 ? 'es' : ''} found${chainNote}.`, 'info');
            }

            this.renderMapMarkers();
            this.renderResults();
            document.getElementById('scout-results').style.display = this.scanResults.length ? '' : 'none';
            if (moreBtn) moreBtn.style.display = '';

        } catch (error) {
            console.error('Scout scan error:', error);
            LaunchLocal.toast('Scan failed: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            activeBtn.classList.remove('btn-loading');
            if (scanBtn) scanBtn.disabled = false;
            if (moreBtn) moreBtn.disabled = false;
        }
    },

    renderMapMarkers() {
        if (!this.map) return;
        if (this._resultMarkers) {
            this._resultMarkers.forEach(m => { try { m.remove(); } catch(_) {} });
        }
        this._resultMarkers = this.scanResults.map(r => {
            if (!r.prospect.lat || !r.prospect.lng) return null;
            const color = r.score >= 80 ? '#EA4335'
                : r.score >= 50 ? '#F9AB00'
                : '#34A853';
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:10px;height:10px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
                iconSize: [10, 10],
                iconAnchor: [5, 5]
            });
            return L.marker([r.prospect.lat, r.prospect.lng], { icon })
                .bindPopup(`<strong>${r.prospect.businessName}</strong><br><small>${r.prospect.address || ''}</small>`)
                .addTo(this.map);
        }).filter(Boolean);
    },

    renderResults() {
        const list = document.getElementById('scout-results-list');
        const countEl = document.getElementById('scout-results-count');
        if (!list) return;

        if (countEl) countEl.textContent = `${this.scanResults.length} new business${this.scanResults.length !== 1 ? 'es' : ''} found`;

        list.innerHTML = this.scanResults.map(r => `
            <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light);cursor:pointer;">
                <input type="checkbox" class="scout-check" data-id="${r.place.id}"
                    checked style="margin-top:3px;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:var(--font-size-sm);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        ${LaunchLocal.escapeHtml(r.prospect.businessName)}
                    </div>
                    <div style="font-size:var(--font-size-xs);color:var(--text-secondary);margin:2px 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${LaunchLocal.escapeHtml(r.prospect.address || '')}
                    </div>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        <span class="industry-tag">${r.prospect.industry}</span>
                        ${r.prospect.googleRating ? `<span class="meta-chip">&#9733; ${r.prospect.googleRating} (${r.prospect.reviewCount})</span>` : ''}
                        ${r.prospect.website ? '<span class="meta-chip">Has Website</span>' : '<span class="meta-chip chip-danger">No Website</span>'}
                    </div>
                </div>
                <div class="score-pill ${this.getScoreClass(r.score)}" style="flex-shrink:0;width:36px;height:36px;font-size:11px;">${r.score}</div>
            </label>
        `).join('');
    },

    async importResults(container) {
        const checked = container.querySelectorAll('.scout-check:checked:not(:disabled)');
        const selectedIds = Array.from(checked).map(cb => cb.getAttribute('data-id'));

        if (selectedIds.length === 0) {
            LaunchLocal.toast('No businesses selected to import.', 'warning');
            return;
        }

        const btn = document.getElementById('scout-import-btn');
        btn.classList.add('btn-loading');
        btn.disabled = true;

        const batchId = `scan_${Date.now()}`;
        let imported = 0;

        try {
            const importedIds = new Set();
            for (const id of selectedIds) {
                const result = this.scanResults.find(r => r.place.id === id);
                if (!result) continue;
                await DB.addDoc('prospects', {
                    ...result.prospect,
                    prospectScore: result.score,
                    scoreBreakdown: result.breakdown,
                    hotLead: Scoring.isHotLead(result.score),
                    scanBatchId: batchId
                });
                this.existingPlaceIds.add(id);
                importedIds.add(id);
                imported++;
            }

            this.scanResults = this.scanResults.filter(r => !importedIds.has(r.place.id));

            await DB.logActivity('scan_imported', 'scouting',
                `imported ${imported} prospect${imported !== 1 ? 's' : ''} from area scan`, { batchId });

            LaunchLocal.toast(`${imported} prospect${imported !== 1 ? 's' : ''} added to your pipeline.`, 'success');
            this.renderResults();
            this.renderMapMarkers();
            const resultsPanel = document.getElementById('scout-results');
            if (resultsPanel) resultsPanel.style.display = this.scanResults.length ? '' : 'none';

        } catch (error) {
            LaunchLocal.toast('Import failed: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
        }
    },

    async geocodeLocation(query) {
        if (!query) return;

        const btn = document.getElementById('scout-go-btn');
        if (btn) { btn.textContent = '...'; btn.disabled = true; }

        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ca,us`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            const results = await res.json();

            if (!results || results.length === 0) {
                LaunchLocal.toast(`"${query}" not found. Try adding a province, e.g. "Brantford, ON".`, 'warning');
                return;
            }

            const { lat, lon, display_name } = results[0];
            this.scanLat = parseFloat(lat);
            this.scanLng = parseFloat(lon);

            const latlng = [this.scanLat, this.scanLng];
            if (this.marker) this.marker.setLatLng(latlng);
            if (this.circle) {
                this.circle.setLatLng(latlng);
                if (this.map) this.map.fitBounds(this.circle.getBounds(), { padding: [30, 30] });
            }


        } catch (error) {
            LaunchLocal.toast('Location lookup failed. Check your connection.', 'error');
        } finally {
            if (btn) { btn.textContent = 'Go'; btn.disabled = false; }
        }
    },

    getCategoryTypes(category) {
        const map = {
            restaurant: ['restaurant', 'cafe', 'bakery', 'bar'],
            tradesperson: ['plumber', 'electrician', 'roofing_contractor', 'car_repair', 'general_contractor'],
            salon: ['hair_salon', 'beauty_salon', 'nail_salon', 'spa', 'barbershop'],
            retail: ['hardware_store', 'clothing_store', 'furniture_store', 'florist', 'gift_shop'],
            medical: ['dentist', 'doctor', 'optometrist', 'pharmacy']
        };
        return map[category] || [];
    },

    getScoreClass(score) {
        if (score >= 80) return 'score-hot';
        if (score >= 50) return 'score-high';
        if (score >= 20) return 'score-medium';
        return 'score-low';
    }
};

Router.register('scouting', ScoutingModule, 'Scouting', ['admin', 'sales']);
