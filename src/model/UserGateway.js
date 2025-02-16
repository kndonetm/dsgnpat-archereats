import { getDb } from './conn.js'
import { ObjectId } from "mongodb";

class UserGateway {
	constructor() {
		this.db = getDb()
		this.collection = this.db.collection('users')
	}
	
	/**
	 * Find a user by their username.
	 * @param {string} username
	 * @returns {Promise<Object>}
	 */
	async getByUsername(username) {
		return this.collection.findOne({ username })
	}
		
	/**
	 * Find a user by their ObjectId.
	 * @param {string} id
	 * @returns {Promise<Object>}
	 */
	async getById(id) {
		return this.collection.findOne({ _id: new ObjectId(id) })
	}
	
	/**
	 * Insert a new user into the database.
	 * @param {Object} userData
	 * @returns {Promise<ObjectId>} The ID of the inserted user
	 */
	async insertUser(userData) {
		const insertedUser = await this.collection.insertOne(userData)
		return insertedUser.insertedId
	}
	
	/**
	 * Update a user's details.
	 * @param {string} id
	 * @param {Object} updateData
	 * @returns {Promise<Object>}
	 */
	async updateUser(id, updateData) {
		return this.collection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updateData }
		)
	}
}

export default new UserGateway();
