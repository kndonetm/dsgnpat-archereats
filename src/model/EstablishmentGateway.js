import { ObjectId } from "mongodb";
import { getDb } from "./conn.js";

class EstablishmentGateway {
    constructor() {
        this.db = getDb();
        this.collection = this.db.collection("establishments");
    }

    /**
     * Find an establishment by its username.
     * @param {string} username
     * @returns {Promise<Object>}
     */
    async getByUsername(username) {
        return this.collection.findOne({ username });
    }

    /**
     * Find an establishment by its ObjectId.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    /**
     * Insert a new establishment into the database.
     * @param {Object} establishmentData
     * @returns {Promise<Object>}
     */
    async insertEstablishment(establishmentData) {
        return this.collection.insertOne(establishmentData);
    }

    /**
     * Update an establishment's details.
     * @param {string} id
     * @param {Object} updateData
     * @returns {Promise<Object>}
     */
    async updateEstablishment(id, updateData) {
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
    }

    /**
     * Update the rating of an establishment.
     * @param {string} establishmentId
     * @param {number} rating
     * @returns {Promise<Object>}
     */
    async updateRating(establishmentId, rating) {
        return this.collection.updateOne(
            { _id: new ObjectId(establishmentId) },
            { $set: { rating: rating } }
        );
    }

    /**
     * Delete an establishment by ID.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async deleteEstablishment(id) {
        return this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    /**
     * Get all establishments with optional filtering.
     * @param {Object} filter
     * @returns {Promise<Array>}
     */
    async getAllEstablishments(filter = {}) {
        return this.collection.find(filter).toArray();
    }
}

export default new EstablishmentGateway();
