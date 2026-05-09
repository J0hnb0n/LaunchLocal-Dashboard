/* ============================================
   LaunchLocal — FilterBar Utility
   ============================================

   Config-driven filter bar that replaces the hand-rolled filter UIs in
   Scanner, Prelim Site Works, and Sales. Modules pass a config object
   describing the filter controls (search, pills, selects, quick toggles,
   date range, sort) and an onChange callback. The FilterBar owns the UI
   and serializes/deserializes state to the URL hash (after `?`) when
   `urlState: true`.

   Public API:

     const fb = LaunchLocal.FilterBar.mount(container, config)
       container : HTMLElement to render into
       config    : {
         search?: { placeholder, fields[] },
         pills?:  { key, options: [{key,label,count?}] },
         selects?: [{ key, label, options: [{value,label}], multi? }],
         dateRange?: { key, label, presets?: [...] },
         quickFilters?: [{ key, label, default? }],
         sort?:   { options: [{value,label}], default },
         onChange: (state) => void,
         urlState?: bool
       }

       returns:
         { destroy(), getState(), setState(partial) }

   State shape passed to onChange:
     { search, pills, selects, quickFilters, dateRange, sort }

   Notes:
   - `setState`/URL writes use history.replaceState so the dashboard's
     hash router does NOT trigger a full module re-render. The router
     compares rawHash, so we avoid the hashchange event entirely.
   - The MODULE owns the filter logic against its data; FilterBar just
     reports state changes. `search.fields` is informational metadata
     for the module — FilterBar doesn't filter records itself.
   ============================================ */

(function (global) {
    'use strict';

    function debounce(fn, ms) {
        let t = null;
        return function (...args) {
            if (t) clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function escapeHtml(str) {
        return (global.LaunchLocal && global.LaunchLocal.escapeHtml)
            ? global.LaunchLocal.escapeHtml(str || '')
            : String(str == null ? '' : str)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function defaultStateFor(config) {
        const state = {
            search: '',
            pills: {},
            selects: {},
            quickFilters: {},
            dateRange: null,
            sort: null
        };
        if (config.pills) {
            // First option is treated as the default ("All" or first key)
            state.pills[config.pills.key] = (config.pills.options[0] || {}).key || 'all';
        }
        if (Array.isArray(config.selects)) {
            for (const s of config.selects) {
                state.selects[s.key] = s.multi ? [] : 'all';
            }
        }
        if (Array.isArray(config.quickFilters)) {
            for (const q of config.quickFilters) {
                state.quickFilters[q.key] = !!q.default;
            }
        }
        if (config.dateRange) {
            state.dateRange = { preset: null, from: null, to: null };
        }
        if (config.sort) {
            state.sort = config.sort.default || (config.sort.options[0] && config.sort.options[0].value) || null;
        }
        return state;
    }

    function isStateDefault(state, config) {
        if (state.search) return false;
        if (config.pills) {
            const def = (config.pills.options[0] || {}).key || 'all';
            if (state.pills[config.pills.key] !== def) return false;
        }
        if (Array.isArray(config.selects)) {
            for (const s of config.selects) {
                const v = state.selects[s.key];
                if (s.multi) { if (Array.isArray(v) && v.length) return false; }
                else { if (v && v !== 'all') return false; }
            }
        }
        if (Array.isArray(config.quickFilters)) {
            for (const q of config.quickFilters) {
                if (!!state.quickFilters[q.key] !== !!q.default) return false;
            }
        }
        if (state.dateRange && (state.dateRange.preset || state.dateRange.from || state.dateRange.to)) return false;
        if (config.sort) {
            const def = config.sort.default || (config.sort.options[0] && config.sort.options[0].value);
            if (state.sort !== def) return false;
        }
        return true;
    }

    /* ---------- URL hash state ---------- */

    function getCurrentHashParts() {
        const raw = (window.location.hash || '').replace(/^#/, '');
        const [path, query] = raw.split('?');
        const params = new URLSearchParams(query || '');
        return { path: path || '', params };
    }

    function writeHashParams(params) {
        const { path } = getCurrentHashParts();
        const qs = params.toString();
        const newHash = qs ? `#${path}?${qs}` : `#${path}`;
        // Use replaceState so the router's hashchange listener does NOT fire
        // (and we don't trigger a full module re-render every time a filter
        // changes). The path component never changes here — only query params.
        try {
            history.replaceState(null, '', newHash);
        } catch (_) {
            window.location.hash = newHash;
        }
    }

    function serializeStateToParams(state, config) {
        const params = new URLSearchParams();
        if (state.search) params.set('q', state.search);
        if (config.pills) {
            const def = (config.pills.options[0] || {}).key || 'all';
            const v = state.pills[config.pills.key];
            if (v && v !== def) params.set(config.pills.key, v);
        }
        if (Array.isArray(config.selects)) {
            for (const s of config.selects) {
                const v = state.selects[s.key];
                if (s.multi) {
                    if (Array.isArray(v) && v.length) params.set(s.key, v.join(','));
                } else if (v && v !== 'all') {
                    params.set(s.key, v);
                }
            }
        }
        if (Array.isArray(config.quickFilters)) {
            const onKeys = config.quickFilters.filter(q => state.quickFilters[q.key] !== !!q.default && state.quickFilters[q.key]).map(q => q.key);
            if (onKeys.length) params.set('qf', onKeys.join(','));
        }
        if (state.dateRange) {
            if (state.dateRange.preset) params.set('range', state.dateRange.preset);
            if (state.dateRange.from)   params.set('from', state.dateRange.from);
            if (state.dateRange.to)     params.set('to', state.dateRange.to);
        }
        if (config.sort && state.sort) {
            const def = config.sort.default || (config.sort.options[0] && config.sort.options[0].value);
            if (state.sort !== def) params.set('sort', state.sort);
        }
        return params;
    }

    function readStateFromParams(params, config) {
        const state = defaultStateFor(config);
        if (params.has('q')) state.search = params.get('q') || '';
        if (config.pills && params.has(config.pills.key)) {
            const v = params.get(config.pills.key);
            const valid = config.pills.options.some(o => o.key === v);
            if (valid) state.pills[config.pills.key] = v;
        }
        if (Array.isArray(config.selects)) {
            for (const s of config.selects) {
                if (!params.has(s.key)) continue;
                const raw = params.get(s.key);
                if (s.multi) {
                    state.selects[s.key] = raw ? raw.split(',').filter(Boolean) : [];
                } else {
                    state.selects[s.key] = raw || 'all';
                }
            }
        }
        if (Array.isArray(config.quickFilters) && params.has('qf')) {
            const onKeys = (params.get('qf') || '').split(',').filter(Boolean);
            for (const q of config.quickFilters) {
                state.quickFilters[q.key] = onKeys.includes(q.key);
            }
        }
        if (state.dateRange) {
            if (params.has('range')) state.dateRange.preset = params.get('range');
            if (params.has('from'))  state.dateRange.from = params.get('from');
            if (params.has('to'))    state.dateRange.to = params.get('to');
        }
        if (config.sort && params.has('sort')) {
            const v = params.get('sort');
            const valid = config.sort.options.some(o => o.value === v);
            if (valid) state.sort = v;
        }
        return state;
    }

    /* ---------- Render helpers ---------- */

    function renderSearch(cfg) {
        if (!cfg.search) return '';
        return `
            <input type="text" class="form-input filter-search" data-fb-search
                placeholder="${escapeHtml(cfg.search.placeholder || 'Search…')}">
        `;
    }

    function renderPills(cfg, state) {
        if (!cfg.pills) return '';
        const active = state.pills[cfg.pills.key];
        const tabs = cfg.pills.options.map(o => {
            const isActive = o.key === active;
            const count = (typeof o.count === 'function') ? o.count() : null;
            const countHtml = (count != null && count !== '') ? `<span class="tab-count">${count}</span>` : '';
            return `
                <button type="button" class="status-tab ${isActive ? 'active' : ''}"
                    data-fb-pill="${escapeHtml(o.key)}"
                    aria-pressed="${isActive ? 'true' : 'false'}">
                    ${escapeHtml(o.label)} ${countHtml}
                </button>
            `;
        }).join('');
        return `<div class="status-tabs" role="group" aria-label="Filter">${tabs}</div>`;
    }

    function renderSelects(cfg, state) {
        if (!Array.isArray(cfg.selects) || !cfg.selects.length) return '';
        return cfg.selects.map(s => {
            if (s.multi) {
                const selected = state.selects[s.key] || [];
                const label = selected.length
                    ? `${escapeHtml(s.label)}: ${selected.length}`
                    : escapeHtml(s.label);
                const items = (s.options || []).map(o => `
                    <label class="filter-multi-item">
                        <input type="checkbox" data-fb-multi-opt
                            value="${escapeHtml(o.value)}"
                            ${selected.includes(o.value) ? 'checked' : ''}>
                        <span>${escapeHtml(o.label)}</span>
                    </label>
                `).join('');
                return `
                    <div class="filter-multi" data-fb-multi="${escapeHtml(s.key)}">
                        <button type="button" class="filter-multi-trigger" data-fb-multi-trigger>
                            <span>${label}</span>
                            <span class="filter-caret" aria-hidden="true">&#9662;</span>
                        </button>
                        <div class="filter-multi-popover" hidden>${items}</div>
                    </div>
                `;
            }
            const current = state.selects[s.key] || 'all';
            const opts = (s.options || []).map(o => `
                <option value="${escapeHtml(o.value)}" ${o.value === current ? 'selected' : ''}>
                    ${escapeHtml(o.label)}
                </option>
            `).join('');
            return `
                <select class="form-input filter-select" data-fb-select="${escapeHtml(s.key)}"
                    aria-label="${escapeHtml(s.label)}">
                    ${opts}
                </select>
            `;
        }).join('');
    }

    function renderQuickFilters(cfg, state) {
        if (!Array.isArray(cfg.quickFilters) || !cfg.quickFilters.length) return '';
        const chips = cfg.quickFilters.map(q => {
            const on = !!state.quickFilters[q.key];
            return `
                <button type="button" class="filter-quickpill ${on ? 'active' : ''}"
                    data-fb-quick="${escapeHtml(q.key)}"
                    aria-pressed="${on ? 'true' : 'false'}">
                    ${escapeHtml(q.label)}
                </button>
            `;
        }).join('');
        return `<div class="filter-quickrow">${chips}</div>`;
    }

    function renderDateRange(cfg, state) {
        if (!cfg.dateRange) return '';
        const presets = cfg.dateRange.presets || ['today', 'week', 'month', '30d', 'custom'];
        const dr = state.dateRange || { preset: null, from: null, to: null };
        const labelText = dr.preset
            ? `${cfg.dateRange.label}: ${dr.preset}`
            : (dr.from || dr.to ? `${cfg.dateRange.label}: custom` : cfg.dateRange.label);
        const presetBtns = presets.map(p => `
            <button type="button" class="filter-date-preset ${dr.preset === p ? 'active' : ''}"
                data-fb-date-preset="${escapeHtml(p)}">${escapeHtml(p)}</button>
        `).join('');
        return `
            <div class="filter-date-range" data-fb-daterange>
                <button type="button" class="filter-multi-trigger" data-fb-date-trigger>
                    <span>${escapeHtml(labelText)}</span>
                    <span class="filter-caret" aria-hidden="true">&#9662;</span>
                </button>
                <div class="filter-multi-popover filter-date-popover" hidden>
                    <div class="filter-date-presets">${presetBtns}</div>
                    <div class="filter-date-custom" ${dr.preset === 'custom' ? '' : 'hidden'}>
                        <label>From <input type="date" data-fb-date-from value="${escapeHtml(dr.from || '')}"></label>
                        <label>To <input type="date" data-fb-date-to value="${escapeHtml(dr.to || '')}"></label>
                    </div>
                </div>
            </div>
        `;
    }

    function renderSort(cfg, state) {
        if (!cfg.sort) return '';
        const opts = cfg.sort.options.map(o => `
            <option value="${escapeHtml(o.value)}" ${o.value === state.sort ? 'selected' : ''}>
                ${escapeHtml(o.label)}
            </option>
        `).join('');
        return `
            <select class="form-input filter-select filter-sort" data-fb-sort aria-label="Sort">
                ${opts}
            </select>
        `;
    }

    function renderClearAll(visible) {
        return `
            <button type="button" class="filter-clear-all" data-fb-clear
                ${visible ? '' : 'hidden'}>Clear filters</button>
        `;
    }

    /* ---------- Mount ---------- */

    const FilterBar = {
        mount(container, config) {
            if (!container) throw new Error('FilterBar.mount: container required');
            config = config || {};

            // Initial state: defaults overlaid with URL params if urlState is on
            let state = defaultStateFor(config);
            if (config.urlState) {
                const { params } = getCurrentHashParts();
                state = readStateFromParams(params, config);
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'filter-bar filter-bar-rich';
            container.appendChild(wrapper);

            function paint() {
                const showClear = !isStateDefault(state, config);
                wrapper.innerHTML = `
                    ${renderSearch(config)}
                    ${renderPills(config, state)}
                    ${renderSelects(config, state)}
                    ${renderDateRange(config, state)}
                    ${renderQuickFilters(config, state)}
                    ${renderSort(config, state)}
                    ${renderClearAll(showClear)}
                `;
                // Restore the search input value (paint blew it away)
                const searchEl = wrapper.querySelector('[data-fb-search]');
                if (searchEl) searchEl.value = state.search || '';
            }

            function emit() {
                if (config.urlState) {
                    writeHashParams(serializeStateToParams(state, config));
                }
                if (typeof config.onChange === 'function') {
                    try { config.onChange(getStateClone()); } catch (err) { window.log?.warn?.('FilterBar onChange error:', err); }
                }
            }

            function getStateClone() {
                return JSON.parse(JSON.stringify(state));
            }

            paint();

            // Debounced search
            const onSearchInput = debounce((val) => {
                state.search = val;
                // Don't repaint (cursor would jump) — just emit and update Clear All visibility.
                const clearBtn = wrapper.querySelector('[data-fb-clear]');
                if (clearBtn) {
                    if (isStateDefault(state, config)) clearBtn.setAttribute('hidden', '');
                    else clearBtn.removeAttribute('hidden');
                }
                emit();
            }, 150);

            /* ---------- Event delegation ---------- */
            const onClick = (e) => {
                // Pill
                const pill = e.target.closest('[data-fb-pill]');
                if (pill && wrapper.contains(pill)) {
                    state.pills[config.pills.key] = pill.getAttribute('data-fb-pill');
                    paint();
                    emit();
                    return;
                }

                // Quick filter toggle
                const qf = e.target.closest('[data-fb-quick]');
                if (qf && wrapper.contains(qf)) {
                    const k = qf.getAttribute('data-fb-quick');
                    state.quickFilters[k] = !state.quickFilters[k];
                    paint();
                    emit();
                    return;
                }

                // Multi-select trigger
                const mTrigger = e.target.closest('[data-fb-multi-trigger]');
                if (mTrigger && wrapper.contains(mTrigger)) {
                    const popover = mTrigger.parentElement.querySelector('.filter-multi-popover');
                    closeAllPopovers(popover);
                    if (popover) popover.toggleAttribute('hidden');
                    return;
                }

                // Date trigger
                const dTrigger = e.target.closest('[data-fb-date-trigger]');
                if (dTrigger && wrapper.contains(dTrigger)) {
                    const popover = dTrigger.parentElement.querySelector('.filter-date-popover');
                    closeAllPopovers(popover);
                    if (popover) popover.toggleAttribute('hidden');
                    return;
                }

                // Date preset
                const dPreset = e.target.closest('[data-fb-date-preset]');
                if (dPreset && wrapper.contains(dPreset)) {
                    const p = dPreset.getAttribute('data-fb-date-preset');
                    state.dateRange = state.dateRange || { preset: null, from: null, to: null };
                    state.dateRange.preset = p;
                    if (p !== 'custom') { state.dateRange.from = null; state.dateRange.to = null; }
                    paint();
                    // re-open the popover so user sees the active preset / custom inputs
                    const popover = wrapper.querySelector('.filter-date-popover');
                    if (popover) popover.removeAttribute('hidden');
                    emit();
                    return;
                }

                // Clear all
                if (e.target.closest('[data-fb-clear]')) {
                    state = defaultStateFor(config);
                    paint();
                    emit();
                    return;
                }
            };

            const onChangeEvt = (e) => {
                // Standard select
                const sel = e.target.closest('[data-fb-select]');
                if (sel && wrapper.contains(sel)) {
                    state.selects[sel.getAttribute('data-fb-select')] = sel.value;
                    // No repaint (the select keeps its value naturally)
                    const clearBtn = wrapper.querySelector('[data-fb-clear]');
                    if (clearBtn) {
                        if (isStateDefault(state, config)) clearBtn.setAttribute('hidden', '');
                        else clearBtn.removeAttribute('hidden');
                    }
                    emit();
                    return;
                }

                // Sort select
                const sortSel = e.target.closest('[data-fb-sort]');
                if (sortSel && wrapper.contains(sortSel)) {
                    state.sort = sortSel.value;
                    const clearBtn = wrapper.querySelector('[data-fb-clear]');
                    if (clearBtn) {
                        if (isStateDefault(state, config)) clearBtn.setAttribute('hidden', '');
                        else clearBtn.removeAttribute('hidden');
                    }
                    emit();
                    return;
                }

                // Multi-select option
                const mOpt = e.target.closest('[data-fb-multi-opt]');
                if (mOpt && wrapper.contains(mOpt)) {
                    const wrap = mOpt.closest('[data-fb-multi]');
                    const key = wrap.getAttribute('data-fb-multi');
                    const checks = wrap.querySelectorAll('[data-fb-multi-opt]');
                    const vals = [];
                    checks.forEach(c => { if (c.checked) vals.push(c.value); });
                    state.selects[key] = vals;
                    // Update trigger label without closing the popover
                    const trigger = wrap.querySelector('[data-fb-multi-trigger] span');
                    const sCfg = (config.selects || []).find(s => s.key === key);
                    if (trigger && sCfg) {
                        trigger.textContent = vals.length ? `${sCfg.label}: ${vals.length}` : sCfg.label;
                    }
                    const clearBtn = wrapper.querySelector('[data-fb-clear]');
                    if (clearBtn) {
                        if (isStateDefault(state, config)) clearBtn.setAttribute('hidden', '');
                        else clearBtn.removeAttribute('hidden');
                    }
                    emit();
                    return;
                }

                // Date custom inputs
                if (e.target.matches('[data-fb-date-from]') || e.target.matches('[data-fb-date-to]')) {
                    state.dateRange = state.dateRange || { preset: 'custom', from: null, to: null };
                    state.dateRange.preset = 'custom';
                    if (e.target.matches('[data-fb-date-from]')) state.dateRange.from = e.target.value || null;
                    else state.dateRange.to = e.target.value || null;
                    const clearBtn = wrapper.querySelector('[data-fb-clear]');
                    if (clearBtn) {
                        if (isStateDefault(state, config)) clearBtn.setAttribute('hidden', '');
                        else clearBtn.removeAttribute('hidden');
                    }
                    emit();
                    return;
                }
            };

            const onInputEvt = (e) => {
                if (e.target.matches('[data-fb-search]')) {
                    onSearchInput(e.target.value);
                }
            };

            function closeAllPopovers(except) {
                wrapper.querySelectorAll('.filter-multi-popover').forEach(p => {
                    if (p !== except) p.setAttribute('hidden', '');
                });
            }

            const onDocClick = (e) => {
                if (!wrapper.contains(e.target)) {
                    closeAllPopovers(null);
                }
            };

            wrapper.addEventListener('click', onClick);
            wrapper.addEventListener('change', onChangeEvt);
            wrapper.addEventListener('input', onInputEvt);
            document.addEventListener('click', onDocClick);

            // Fire initial onChange so module renders with restored state
            // (do NOT write URL on mount — it's already there).
            if (typeof config.onChange === 'function') {
                try { config.onChange(getStateClone()); } catch (err) { window.log?.warn?.('FilterBar onChange error:', err); }
            }

            return {
                getState: getStateClone,
                setState(partial) {
                    if (!partial || typeof partial !== 'object') return;
                    state = Object.assign({}, state, partial);
                    paint();
                    emit();
                },
                destroy() {
                    document.removeEventListener('click', onDocClick);
                    wrapper.remove();
                }
            };
        }
    };

    global.LaunchLocal = global.LaunchLocal || {};
    global.LaunchLocal.FilterBar = FilterBar;
})(window);
