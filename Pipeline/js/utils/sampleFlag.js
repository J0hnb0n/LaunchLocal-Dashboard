/* ============================================
   LaunchLocal — Sample-data identification
   Used by "Remove Sample Data" so real records stay intact.
   A doc is considered "sample" if either:
     1. It has isSample === true (set by SampleData.load going forward)
     2. Its document ID matches a known legacy seed ID
   ============================================ */

(function (global) {
    'use strict';

    const LEGACY_SAMPLE_IDS = [
        // Prospects
        'p-mario', 'p-plumbing', 'p-bakery', 'p-hair', 'p-nails',
        'p-auto', 'p-green', 'p-optometry', 'p-hardware', 'p-maple',
        // Sites
        's-auto', 's-bakery', 's-hair', 's-nails',
        // Projects
        'pr-hardware', 'pr-nails',
        // Invoices
        'inv-hardware-project', 'inv-hardware-maint',
        'inv-nails-project', 'inv-nails-maint', 'inv-overdue',
        // Expenses
        'exp-claude', 'exp-google', 'exp-firebase', 'exp-canva', 'exp-domain'
    ];

    const SampleFlag = {
        LEGACY_IDS: LEGACY_SAMPLE_IDS,

        /**
         * Is this doc a sample seed?
         * @param {{id:string, isSample?:boolean}} doc
         * @returns {boolean}
         */
        isSampleDoc(doc) {
            if (!doc) return false;
            if (doc.isSample === true) return true;
            return LEGACY_SAMPLE_IDS.includes(doc.id);
        }
    };

    global.SampleFlag = SampleFlag;
})(window);
