/* ============================================
   LaunchLocal — Firestore Database Helpers
   ============================================ */

/**
 * DB — Firestore CRUD helper functions.
 * All operations include error handling and return clean data.
 * All writes track createdBy/updatedBy and timestamps.
 */
const DB = {

    /**
     * Get a single document by ID.
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @returns {Promise<Object|null>} Document data with id, or null if not found
     */
    async getDoc(collection, docId) {
        try {
            const doc = await LaunchLocal.db.collection(collection).doc(docId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error(`DB.getDoc(${collection}/${docId}):`, error);
            throw new Error(`Failed to fetch document from ${collection}.`);
        }
    },

    /**
     * Get all documents in a collection (with optional query constraints).
     * @param {string} collection - Collection name
     * @param {Object} [options] - Query options
     * @param {Array} [options.where] - Array of [field, operator, value] tuples
     * @param {Array} [options.orderBy] - Array of [field, direction] tuples
     * @param {number} [options.limit] - Max documents to return
     * @param {Object} [options.startAfter] - Document snapshot to paginate after
     * @returns {Promise<Object[]>} Array of document objects with id
     */
    async getDocs(collection, options = {}) {
        try {
            let query = LaunchLocal.db.collection(collection);

            // Apply where clauses
            if (options.where) {
                for (const [field, operator, value] of options.where) {
                    query = query.where(field, operator, value);
                }
            }

            // Apply ordering
            if (options.orderBy) {
                for (const [field, direction = 'asc'] of options.orderBy) {
                    query = query.orderBy(field, direction);
                }
            }

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            // Apply pagination cursor
            if (options.startAfter) {
                query = query.startAfter(options.startAfter);
            }

            const snapshot = await query.get();
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        } catch (error) {
            console.error(`DB.getDocs(${collection}):`, error);
            throw new Error(`Failed to fetch documents from ${collection}.`);
        }
    },

    /**
     * Add a new document to a collection. Auto-generates ID.
     * @param {string} collection - Collection name
     * @param {Object} data - Document data
     * @returns {Promise<string>} The new document ID
     */
    async addDoc(collection, data) {
        try {
            const uid = LaunchLocal.currentUser?.uid || null;
            const enriched = {
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: uid,
                updatedBy: uid
            };
            const docRef = await LaunchLocal.db.collection(collection).add(enriched);
            return docRef.id;
        } catch (error) {
            console.error(`DB.addDoc(${collection}):`, error);
            throw new Error(`Failed to add document to ${collection}.`);
        }
    },

    /**
     * Add a document with a specific ID.
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @param {Object} data - Document data
     * @returns {Promise<void>}
     */
    async setDoc(collection, docId, data) {
        try {
            const uid = LaunchLocal.currentUser?.uid || null;
            const enriched = {
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: uid,
                updatedBy: uid
            };
            await LaunchLocal.db.collection(collection).doc(docId).set(enriched);
        } catch (error) {
            console.error(`DB.setDoc(${collection}/${docId}):`, error);
            throw new Error(`Failed to set document in ${collection}.`);
        }
    },

    /**
     * Update specific fields on an existing document.
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @param {Object} data - Fields to update
     * @returns {Promise<void>}
     */
    async updateDoc(collection, docId, data) {
        try {
            const uid = LaunchLocal.currentUser?.uid || null;
            const enriched = {
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: uid
            };
            await LaunchLocal.db.collection(collection).doc(docId).update(enriched);
        } catch (error) {
            console.error(`DB.updateDoc(${collection}/${docId}):`, error);
            throw new Error(`Failed to update document in ${collection}.`);
        }
    },

    /**
     * Delete a document by ID.
     * @param {string} collection - Collection name
     * @param {string} docId - Document ID
     * @returns {Promise<void>}
     */
    async deleteDoc(collection, docId) {
        try {
            await LaunchLocal.db.collection(collection).doc(docId).delete();
        } catch (error) {
            console.error(`DB.deleteDoc(${collection}/${docId}):`, error);
            throw new Error(`Failed to delete document from ${collection}.`);
        }
    },

    /**
     * Get the count of documents matching a query.
     * @param {string} collection - Collection name
     * @param {Array} [whereClauses] - Array of [field, operator, value] tuples
     * @returns {Promise<number>}
     */
    async getCount(collection, whereClauses = []) {
        try {
            let query = LaunchLocal.db.collection(collection);
            for (const [field, operator, value] of whereClauses) {
                query = query.where(field, operator, value);
            }
            const snapshot = await query.get();
            return snapshot.size;
        } catch (error) {
            console.error(`DB.getCount(${collection}):`, error);
            return 0;
        }
    },

    /**
     * Listen to real-time changes on a collection query.
     * @param {string} collection - Collection name
     * @param {Object} options - Same as getDocs options
     * @param {Function} callback - Called with (docs[], error?)
     * @returns {Function} Unsubscribe function
     */
    onSnapshot(collection, options = {}, callback) {
        try {
            let query = LaunchLocal.db.collection(collection);

            if (options.where) {
                for (const [field, operator, value] of options.where) {
                    query = query.where(field, operator, value);
                }
            }

            if (options.orderBy) {
                for (const [field, direction = 'asc'] of options.orderBy) {
                    query = query.orderBy(field, direction);
                }
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            return query.onSnapshot(
                (snapshot) => {
                    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    callback(docs, null);
                },
                (error) => {
                    console.error(`DB.onSnapshot(${collection}):`, error);
                    callback([], error);
                }
            );
        } catch (error) {
            console.error(`DB.onSnapshot(${collection}):`, error);
            callback([], error);
            return () => {};
        }
    },

    /**
     * Log an activity to the activityLog collection.
     * @param {string} action - Short action name (e.g., 'prospect_created')
     * @param {string} module - Module name (e.g., 'prospects')
     * @param {string} description - Human-readable description
     * @param {Object} [metadata] - Extra data to attach
     * @param {string} [entityId] - Related entity ID
     * @returns {Promise<string>} Activity log ID
     */
    async logActivity(action, module, description, metadata = {}, entityId = null) {
        try {
            return await this.addDoc('activityLog', {
                action,
                module,
                entityId,
                userId: LaunchLocal.currentUser?.uid || null,
                userName: LaunchLocal.currentUser?.name || 'System',
                description,
                metadata,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            // Activity logging should never block the user
            console.error('Failed to log activity:', error);
        }
    },

    /**
     * Batch write — execute multiple operations atomically.
     * @param {Function} operations - Receives a batch object, call batch.set/update/delete
     * @returns {Promise<void>}
     */
    async batchWrite(operations) {
        try {
            const batch = LaunchLocal.db.batch();
            operations(batch, LaunchLocal.db);
            await batch.commit();
        } catch (error) {
            console.error('DB.batchWrite:', error);
            throw new Error('Batch operation failed.');
        }
    }
};
