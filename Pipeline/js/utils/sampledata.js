/* ============================================
   LaunchLocal — Sample Data Loader
   ============================================ */

const SAMPLE_COLLECTIONS = ['prospects', 'sites', 'projects', 'invoices', 'expenses'];

const SampleData = {

    /**
     * Delete ALL documents from all collections.
     * Useful before going live with real data.
     */
    async clear() {
        const confirmed = confirm(
            'Clear ALL data?\n\nThis will permanently delete EVERY prospect, site, project, invoice, expense, and activity log from Firestore — including real records.\n\nThis cannot be undone.'
        );
        if (!confirmed) return;

        const btn = document.getElementById('clear-data-btn');
        if (btn) btn.classList.add('btn-loading');

        try {
            // activityLog is immutable per firestore.rules, so we skip it.
            const collections = ['prospects', 'sites', 'projects', 'invoices', 'expenses'];
            for (const col of collections) {
                const docs = await DB.getDocs(col);
                if (docs.length === 0) continue;
                // Firestore batch cap is 500 ops; chunk accordingly
                for (let i = 0; i < docs.length; i += 450) {
                    const slice = docs.slice(i, i + 450);
                    const batch = LaunchLocal.db.batch();
                    for (const doc of slice) {
                        batch.delete(LaunchLocal.db.collection(col).doc(doc.id));
                    }
                    await batch.commit();
                }
            }
            LaunchLocal.toast('All data cleared. Ready for real use.', 'success');
            setTimeout(() => Router.reload(), 800);
        } catch (error) {
            console.error('SampleData.clear error:', error);
            LaunchLocal.toast('Clear failed: ' + error.message, 'error');
        } finally {
            const btn = document.getElementById('clear-data-btn');
            if (btn) btn.classList.remove('btn-loading');
        }
    },

    /**
     * Delete ONLY docs flagged as sample data (isSample:true or legacy seed IDs).
     * Real user records are left untouched.
     */
    async removeSamplesOnly() {
        const btn = document.getElementById('remove-samples-btn');
        if (btn) btn.classList.add('btn-loading');

        try {
            let totalRemoved = 0;
            for (const col of SAMPLE_COLLECTIONS) {
                const docs = await DB.getDocs(col);
                const samples = docs.filter((d) => SampleFlag.isSampleDoc(d));
                if (samples.length === 0) continue;

                for (let i = 0; i < samples.length; i += 450) {
                    const slice = samples.slice(i, i + 450);
                    const batch = LaunchLocal.db.batch();
                    for (const doc of slice) {
                        batch.delete(LaunchLocal.db.collection(col).doc(doc.id));
                    }
                    await batch.commit();
                }
                totalRemoved += samples.length;
            }

            if (totalRemoved === 0) {
                LaunchLocal.toast('No sample data found to remove.', 'info');
            } else {
                await DB.logActivity(
                    'sample_data_removed',
                    'system',
                    `removed ${totalRemoved} sample records`,
                    { totalRemoved }
                );
                LaunchLocal.toast(`Removed ${totalRemoved} sample record${totalRemoved === 1 ? '' : 's'}. Real data untouched.`, 'success');
                setTimeout(() => Router.reload(), 800);
            }
        } catch (error) {
            console.error('SampleData.removeSamplesOnly error:', error);
            LaunchLocal.toast('Removal failed: ' + error.message, 'error');
        } finally {
            const btn = document.getElementById('remove-samples-btn');
            if (btn) btn.classList.remove('btn-loading');
        }
    },

    async load() {
        const btn = document.getElementById('sample-data-btn');
        if (btn) btn.classList.add('btn-loading');

        try {
            // Check if data already exists
            const existing = await DB.getDocs('prospects', { limit: 1 });
            if (existing.length > 0) {
                LaunchLocal.toast('Sample data is already loaded.', 'warning');
                return;
            }

            const db = LaunchLocal.db;
            const now = firebase.firestore.Timestamp.now();
            const uid = LaunchLocal.currentUser?.uid || null;
            const base = { createdAt: now, updatedAt: now, createdBy: uid, updatedBy: uid };

            const prospects = [
                {
                    id: 'p-mario',
                    businessName: "Mario's Pizza",
                    address: '142 King St W, Hamilton, ON',
                    phone: '(905) 555-0142',
                    email: 'mario@mariospizza.ca',
                    website: null,
                    industry: 'restaurant',
                    googleRating: 4.5,
                    reviewCount: 127,
                    googlePlaceId: 'mock_p1',
                    lat: 43.2557, lng: -79.8711,
                    prospectScore: 85,
                    scoreBreakdown: { noWebsite: 30, facebook: 10, googleRating: 10, noMobile: 15, pageSpeed: 10, oldCopyright: 10 },
                    status: 'new',
                    hotLead: true,
                    notes: 'Very active on Facebook, no website at all. High foot traffic corner location.',
                    contactLog: [],
                    assignedTo: uid,
                    facebookUrl: 'https://facebook.com/mariospizzahamilton',
                    nextFollowUp: '2026-04-10'
                },
                {
                    id: 'p-plumbing',
                    businessName: "Pat's Plumbing",
                    address: '88 Barton St E, Hamilton, ON',
                    phone: '(905) 555-0188',
                    email: null,
                    website: null,
                    industry: 'tradesperson',
                    googleRating: 4.7,
                    reviewCount: 203,
                    googlePlaceId: 'mock_p2',
                    lat: 43.2641, lng: -79.8422,
                    prospectScore: 82,
                    scoreBreakdown: { noWebsite: 30, googleRating: 10, facebook: 10, pageSpeed: 10, oldCopyright: 10, noMobile: 12 },
                    status: 'new',
                    hotLead: true,
                    notes: 'Relies entirely on word of mouth. 200+ Google reviews but zero online presence.',
                    contactLog: [],
                    assignedTo: uid,
                    facebookUrl: null,
                    nextFollowUp: '2026-04-11'
                },
                {
                    id: 'p-bakery',
                    businessName: 'Sunrise Bakery',
                    address: '225 Ottawa St N, Hamilton, ON',
                    phone: '(905) 555-0225',
                    email: 'info@sunrisebakery.ca',
                    website: 'http://sunrisebakery.ca',
                    industry: 'restaurant',
                    googleRating: 4.3,
                    reviewCount: 89,
                    googlePlaceId: 'mock_p3',
                    lat: 43.2482, lng: -79.8233,
                    prospectScore: 75,
                    scoreBreakdown: { noSSL: 15, noMobile: 15, pageSpeed: 10, googleRating: 10, oldCopyright: 10, facebook: 10, noWebsite: 0 },
                    status: 'site-queued',
                    hotLead: true,
                    notes: 'Site is from 2019, no SSL, not mobile friendly. Owner very interested in moving forward.',
                    contactLog: [{ date: '2026-04-05', note: 'Owner expressed strong interest, ready to move forward.' }],
                    assignedTo: uid,
                    facebookUrl: 'https://facebook.com/sunrisebakery'
                },
                {
                    id: 'p-hair',
                    businessName: 'The Hair Studio',
                    address: '410 Locke St S, Hamilton, ON',
                    phone: '(905) 555-0410',
                    email: 'hello@thehairstudio.ca',
                    website: 'http://thehairstudio.ca',
                    industry: 'salon',
                    googleRating: 4.6,
                    reviewCount: 154,
                    googlePlaceId: 'mock_p4',
                    lat: 43.2502, lng: -79.8914,
                    prospectScore: 68,
                    scoreBreakdown: { noSSL: 15, noMobile: 15, pageSpeed: 10, oldCopyright: 10, googleRating: 10, facebook: 8 },
                    status: 'approved',
                    hotLead: false,
                    notes: 'Popular salon on Locke St. Owner uses a booking app but has no real website.',
                    contactLog: [],
                    assignedTo: uid,
                    facebookUrl: 'https://facebook.com/thehairstudio',
                    nextFollowUp: '2026-04-12'
                },
                {
                    id: 'p-nails',
                    businessName: 'Bella Nails & Spa',
                    address: '780 Upper James St, Hamilton, ON',
                    phone: '(905) 555-0780',
                    email: 'bella@bellanails.ca',
                    website: 'https://bellanails.ca',
                    industry: 'salon',
                    googleRating: 4.4,
                    reviewCount: 211,
                    googlePlaceId: 'mock_p5',
                    lat: 43.2279, lng: -79.8641,
                    prospectScore: 58,
                    scoreBreakdown: { noMobile: 15, pageSpeed: 10, oldCopyright: 10, googleRating: 10, facebook: 8 },
                    status: 'pitched',
                    hotLead: false,
                    notes: 'Existing site is outdated and slow. They are interested in a full redesign.',
                    contactLog: [
                        { date: '2026-04-03', note: 'Initial pitch meeting. Very positive response from owner.' },
                        { date: '2026-04-07', note: 'Follow-up call. Reviewing proposal with business partner.' }
                    ],
                    assignedTo: uid,
                    facebookUrl: 'https://facebook.com/bellanails',
                    nextFollowUp: '2026-04-15'
                },
                {
                    id: 'p-auto',
                    businessName: 'Ace Auto Repair',
                    address: '15 Main St E, Hamilton, ON',
                    phone: '(905) 555-0015',
                    email: 'service@aceauto.ca',
                    website: 'https://aceauto.ca',
                    industry: 'tradesperson',
                    googleRating: 4.2,
                    reviewCount: 76,
                    googlePlaceId: 'mock_p6',
                    lat: 43.2583, lng: -79.8681,
                    prospectScore: 55,
                    scoreBreakdown: { pageSpeed: 10, oldCopyright: 10, noMobile: 15, googleRating: 10 },
                    status: 'site-ready',
                    hotLead: false,
                    notes: 'Slow website, outdated design. Owner is tech-averse but receptive to improvement.',
                    contactLog: [{ date: '2026-04-01', note: 'Reviewed site together. Very slow load times confirmed.' }],
                    assignedTo: uid,
                    facebookUrl: null
                },
                {
                    id: 'p-green',
                    businessName: 'Green Thumb Landscaping',
                    address: '55 Fennell Ave E, Hamilton, ON',
                    phone: '(905) 555-0055',
                    email: 'info@greenthumb.ca',
                    website: 'https://greenthumb.ca',
                    industry: 'tradesperson',
                    googleRating: 3.9,
                    reviewCount: 42,
                    googlePlaceId: 'mock_p7',
                    lat: 43.2361, lng: -79.8512,
                    prospectScore: 45,
                    scoreBreakdown: { pageSpeed: 10, oldCopyright: 10, noMobile: 15 },
                    status: 'reviewed',
                    hotLead: false,
                    notes: 'Mediocre site. Lower priority due to smaller review count and competitive market.',
                    contactLog: [],
                    assignedTo: uid,
                    facebookUrl: null
                },
                {
                    id: 'p-optometry',
                    businessName: 'Valley Optometry',
                    address: '300 Upper Wentworth St, Hamilton, ON',
                    phone: '(905) 555-0300',
                    email: 'office@valleyoptometry.ca',
                    website: 'https://valleyoptometry.ca',
                    industry: 'medical',
                    googleRating: 4.1,
                    reviewCount: 38,
                    googlePlaceId: 'mock_p8',
                    lat: 43.2198, lng: -79.8471,
                    prospectScore: 35,
                    scoreBreakdown: { pageSpeed: 10, oldCopyright: 10 },
                    status: 'reviewed',
                    hotLead: false,
                    notes: 'Decent existing site but slow. Moderate opportunity — worth approving.',
                    contactLog: [],
                    assignedTo: uid,
                    facebookUrl: null
                },
                {
                    id: 'p-hardware',
                    businessName: 'Corner Hardware',
                    address: '900 Concession St, Hamilton, ON',
                    phone: '(905) 555-0900',
                    email: 'owner@cornerhardware.ca',
                    website: 'https://cornerhardware.ca',
                    industry: 'retail',
                    googleRating: 4.8,
                    reviewCount: 310,
                    googlePlaceId: 'mock_p9',
                    lat: 43.2301, lng: -79.8351,
                    prospectScore: 22,
                    scoreBreakdown: { pageSpeed: 10, oldCopyright: 10 },
                    status: 'sold',
                    hotLead: false,
                    notes: 'Signed! New site launched April 2026. Excellent client.',
                    contactLog: [
                        { date: '2026-03-20', note: 'Initial pitch. Very interested in modernizing.' },
                        { date: '2026-03-28', note: 'Proposal accepted. Deposit received via e-transfer.' },
                        { date: '2026-04-08', note: 'Site launched. Client extremely happy with result.' }
                    ],
                    assignedTo: uid,
                    facebookUrl: 'https://facebook.com/cornerhardwarehamilton'
                },
                {
                    id: 'p-maple',
                    businessName: 'Maple Leaf Bakery',
                    address: '1200 Rymal Rd E, Hamilton, ON',
                    phone: '(905) 555-1200',
                    email: null,
                    website: 'https://mapleleafbakery.ca',
                    industry: 'restaurant',
                    googleRating: 4.0,
                    reviewCount: 15,
                    googlePlaceId: 'mock_p10',
                    lat: 43.2115, lng: -79.8204,
                    prospectScore: 15,
                    scoreBreakdown: { pageSpeed: 5, googleRating: 10 },
                    status: 'archived',
                    hotLead: false,
                    notes: 'Recently had a new site built by a family member. Not a current opportunity.',
                    contactLog: [],
                    assignedTo: uid,
                    facebookUrl: null
                }
            ];

            const sites = [
                {
                    id: 's-auto',
                    prospectId: 'p-auto',
                    businessName: 'Ace Auto Repair',
                    industry: 'tradesperson',
                    status: 'generated',
                    previewUrl: null,
                    qaStatus: 'pending',
                    qaReviewer: null,
                    qaDate: null,
                    qaFeedback: null,
                    templateUsed: 'tradesperson',
                    pageSpeedScore: 94,
                    mobileScore: 97
                },
                {
                    id: 's-bakery',
                    prospectId: 'p-bakery',
                    businessName: 'Sunrise Bakery',
                    industry: 'restaurant',
                    status: 'generated',
                    previewUrl: null,
                    qaStatus: 'approved',
                    qaReviewer: uid,
                    qaFeedback: 'Looks great. Good use of food photography placeholders. Ready to pitch.',
                    templateUsed: 'restaurant',
                    pageSpeedScore: 96,
                    mobileScore: 99
                },
                {
                    id: 's-hair',
                    prospectId: 'p-hair',
                    businessName: 'The Hair Studio',
                    industry: 'salon',
                    status: 'revision-needed',
                    previewUrl: null,
                    qaStatus: 'revision-needed',
                    qaReviewer: uid,
                    qaFeedback: 'Hero section colour clashes with their brand palette. Update to soft pinks and whites.',
                    templateUsed: 'salon',
                    pageSpeedScore: 91,
                    mobileScore: 95
                },
                {
                    id: 's-nails',
                    prospectId: 'p-nails',
                    businessName: 'Bella Nails & Spa',
                    industry: 'salon',
                    status: 'generated',
                    previewUrl: null,
                    qaStatus: 'approved',
                    qaReviewer: uid,
                    qaFeedback: 'Clean and modern design. Excellent mobile layout. Ready to pitch.',
                    templateUsed: 'salon',
                    pageSpeedScore: 98,
                    mobileScore: 99
                }
            ];

            const projects = [
                {
                    id: 'pr-hardware',
                    prospectId: 'p-hardware',
                    siteId: null,
                    clientName: 'Corner Hardware',
                    status: 'active',
                    domainName: 'cornerhardware.ca',
                    deploymentUrl: 'https://cornerhardware.ca',
                    revisions: [],
                    maintenanceTier: 'basic',
                    monthlyFee: 15000,
                    automationFlags: [],
                    automationRevenue: 0,
                    communicationLog: [
                        { date: '2026-04-10', note: 'Sent login credentials. Client confirmed receipt.' },
                        { date: '2026-04-08', note: 'Site launched. Walked client through Google Business Profile.' }
                    ],
                    startDate: '2026-04-08',
                    renewalDate: '2027-04-08',
                    lastContactDate: '2026-04-10'
                },
                {
                    id: 'pr-nails',
                    prospectId: 'p-nails',
                    siteId: 's-nails',
                    clientName: 'Bella Nails & Spa',
                    status: 'onboarding',
                    domainName: 'bellanails.ca',
                    deploymentUrl: null,
                    revisions: [
                        { id: 'r1', description: 'Update business hours to include Sunday 10am–4pm', status: 'pending', requestedAt: '2026-04-11' }
                    ],
                    maintenanceTier: 'standard',
                    monthlyFee: 25000,
                    automationFlags: ['booking-integration'],
                    automationRevenue: 0,
                    communicationLog: [
                        { date: '2026-04-09', note: 'Contract signed. Deposit received. Starting onboarding process.' }
                    ],
                    startDate: '2026-04-09',
                    renewalDate: '2027-04-09',
                    lastContactDate: '2026-04-11'
                }
            ];

            const invoices = [
                {
                    id: 'inv-hardware-project',
                    projectId: 'pr-hardware',
                    clientName: 'Corner Hardware',
                    amount: 250000,
                    type: 'project',
                    status: 'paid',
                    issuedDate: '2026-03-28',
                    dueDate: '2026-04-04',
                    paidDate: '2026-04-02',
                    stripeInvoiceId: 'inv_mock_001',
                    commissionRate: 0.15,
                    commissionAmount: 37500,
                    salesRepId: uid,
                    lineItems: [
                        { description: 'Website Design & Development', amount: 200000 },
                        { description: 'Domain & Hosting Setup', amount: 50000 }
                    ],
                    notes: 'Paid in full via e-transfer.'
                },
                {
                    id: 'inv-hardware-maint',
                    projectId: 'pr-hardware',
                    clientName: 'Corner Hardware',
                    amount: 15000,
                    type: 'maintenance',
                    status: 'paid',
                    issuedDate: '2026-04-01',
                    dueDate: '2026-04-15',
                    paidDate: '2026-04-03',
                    stripeInvoiceId: 'inv_mock_002',
                    commissionRate: 0.10,
                    commissionAmount: 1500,
                    salesRepId: uid,
                    lineItems: [{ description: 'Monthly Maintenance — Basic Tier', amount: 15000 }],
                    notes: ''
                },
                {
                    id: 'inv-nails-project',
                    projectId: 'pr-nails',
                    clientName: 'Bella Nails & Spa',
                    amount: 250000,
                    type: 'project',
                    status: 'sent',
                    issuedDate: '2026-04-09',
                    dueDate: '2026-04-23',
                    paidDate: null,
                    stripeInvoiceId: null,
                    commissionRate: 0.15,
                    commissionAmount: 37500,
                    salesRepId: uid,
                    lineItems: [
                        { description: 'Website Design & Development', amount: 200000 },
                        { description: 'Domain & Hosting Setup', amount: 50000 }
                    ],
                    notes: 'Awaiting payment. Follow up April 16.'
                },
                {
                    id: 'inv-nails-maint',
                    projectId: 'pr-nails',
                    clientName: 'Bella Nails & Spa',
                    amount: 25000,
                    type: 'maintenance',
                    status: 'draft',
                    issuedDate: null,
                    dueDate: null,
                    paidDate: null,
                    stripeInvoiceId: null,
                    commissionRate: 0.10,
                    commissionAmount: 2500,
                    salesRepId: uid,
                    lineItems: [{ description: 'Monthly Maintenance — Standard Tier', amount: 25000 }],
                    notes: 'Will send once onboarding is complete.'
                },
                {
                    id: 'inv-overdue',
                    projectId: 'pr-hardware',
                    clientName: 'Old Client (Demo)',
                    amount: 15000,
                    type: 'maintenance',
                    status: 'overdue',
                    issuedDate: '2026-03-01',
                    dueDate: '2026-03-15',
                    paidDate: null,
                    stripeInvoiceId: null,
                    commissionRate: 0.10,
                    commissionAmount: 1500,
                    salesRepId: uid,
                    lineItems: [{ description: 'Monthly Maintenance — Basic Tier', amount: 15000 }],
                    notes: 'Follow up required. 28 days overdue.'
                }
            ];

            const expenses = [
                {
                    id: 'exp-claude',
                    date: '2026-04-01',
                    category: 'api',
                    description: 'Claude API usage — March 2026',
                    amount: 2300,
                    hstPaid: 299,
                    notes: 'Site generation and content tasks'
                },
                {
                    id: 'exp-google',
                    date: '2026-04-01',
                    category: 'api',
                    description: 'Google Places API — March 2026',
                    amount: 1500,
                    hstPaid: 0,
                    notes: 'USD billing — no HST applied'
                },
                {
                    id: 'exp-firebase',
                    date: '2026-04-01',
                    category: 'domain-hosting',
                    description: 'Firebase Blaze plan — March 2026',
                    amount: 1200,
                    hstPaid: 156,
                    notes: 'Firestore reads/writes and hosting'
                },
                {
                    id: 'exp-canva',
                    date: '2026-03-15',
                    category: 'software',
                    description: 'Canva Pro — annual renewal',
                    amount: 19999,
                    hstPaid: 2600,
                    notes: 'Design assets for client sites'
                },
                {
                    id: 'exp-domain',
                    date: '2026-03-20',
                    category: 'domain-hosting',
                    description: 'cornerhardware.ca domain registration',
                    amount: 1695,
                    hstPaid: 220,
                    notes: 'Annual domain renewal via Namecheap'
                }
            ];

            // Batch write all documents. isSample=true lets us purge samples
            // later without touching real records.
            const seedBase = { ...base, isSample: true };
            const batch = db.batch();
            for (const p of prospects) {
                const { id, ...data } = p;
                batch.set(db.collection('prospects').doc(id), { ...data, ...seedBase });
            }
            for (const s of sites) {
                const { id, ...data } = s;
                batch.set(db.collection('sites').doc(id), { ...data, ...seedBase });
            }
            for (const p of projects) {
                const { id, ...data } = p;
                batch.set(db.collection('projects').doc(id), { ...data, ...seedBase });
            }
            for (const inv of invoices) {
                const { id, ...data } = inv;
                batch.set(db.collection('invoices').doc(id), { ...data, ...seedBase });
            }
            for (const exp of expenses) {
                const { id, ...data } = exp;
                batch.set(db.collection('expenses').doc(id), { ...data, ...seedBase });
            }
            await batch.commit();

            await DB.logActivity('sample_data_loaded', 'system', 'loaded sample pipeline data for demonstration');

            LaunchLocal.toast('Sample data loaded! Refreshing...', 'success');
            setTimeout(() => Router.reload(), 800);

        } catch (error) {
            console.error('SampleData.load error:', error);
            LaunchLocal.toast('Failed to load sample data: ' + error.message, 'error');
        } finally {
            const btn = document.getElementById('sample-data-btn');
            if (btn) btn.classList.remove('btn-loading');
        }
    }
};
