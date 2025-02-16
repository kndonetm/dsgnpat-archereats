import { getDb } from "./conn.js";
import { ObjectId } from "mongodb";

class CommentGateway {
	constructor() {
		this.db = getDb();
		this.collection = this.db.collection("comments");
	}

	/**
	 * Get a comment by its ID.
	 * @param {string} id
	 * @returns {Promise<Object>}
	 */
	async getById(id) {
		return this.collection.findOne({ _id: new ObjectId(id) });
	}
	
	/**
	 * Get all comments associated with a review.
	 * @param {string} reviewId
	 * @returns {Promise<Array>}
	 */
	async getByReviewId(reviewId) {
		return this.collection.find({ reviewId: new ObjectId(reviewId) }).toArray();
	}

	/**
	 * Get all comments associated with a user.
	 * @param {string} userId
	 * @returns {Promise<Array>}
	 */
	async getByUserId(userId) {
		return this.collection.find({ userId: new ObjectId(userId) }).toArray();
	}
	
	/**
	 * Insert a new comment into the database.
	 * @param {Object} commentData
	 * @returns {Promise<ObjectId>} The ID of the inserted comment
	 */
	async insertComment(commentData) {
		const insertedComment = await this.collection.insertOne(commentData);
		return insertedComment.insertedId;
	}
	
	/**
	 * Update a comment's details.
	 * @param {string} id
	 * @param {Object} updateData
	 * @returns {Promise<Object>}
	 */
	async updateComment(id, updateData) {
		return this.collection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updateData }
		);
	}
	
	/**
	 * Delete a comment by its ID.
	 * @param {string} id
	 * @returns {Promise<Object>}
	 */
	async deleteComment(id) {
		return this.collection.deleteOne({ _id: new ObjectId(id) });
	}
	
	/**
	 * Delete all comments associated with a review.
	 * @param {string} reviewId
	 * @returns {Promise<Object>}
	 */
	async deleteByReviewId(reviewId) {
		return this.collection.deleteMany({ reviewId: new ObjectId(reviewId) });
	}

	/**
	 * Delete all comments associated with a user.
	 * @param {string} userId
	 * @returns {Promise<Object>}
	 */
	async deleteByUserId(userId) {
		return this.collection.deleteMany({ userId: new ObjectId(userId) });
	}
}

export default new CommentGateway();
