import { getDb } from './conn.js'
import { ObjectId } from 'mongodb'

class CommentGateway {
    constructor() {
        this.db = getDb()
        this.collection = this.db.collection('comments')
    }

    /**
     * Get a comment by its ID.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) })
    }

    /**
     * Get all comments associated with a review.
     * @param {string} reviewId
     * @returns {Promise<Array>}
     */
    async getByReviewId(reviewId) {
        return this.collection
            .find({ reviewId: new ObjectId(reviewId) })
            .toArray()
    }

    /**
     * Get all comments associated with a user.
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getByUserId(userId) {
        return this.collection.find({ userId: new ObjectId(userId) }).toArray()
    }

    /**
     * Insert a new comment into the database.
     * @param {Object} commentData
     * @returns {Promise<ObjectId>} The ID of the inserted comment
     */
    async insertComment(commentData) {
        const insertedComment = await this.collection.insertOne(commentData)
        return insertedComment.insertedId
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
        )
    }

    /**
     * Delete a comment by its ID.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async deleteComment(id) {
        return this.collection.deleteOne({ _id: new ObjectId(id) })
    }

    /**
     * Delete all comments associated with a review.
     * @param {string} reviewId
     * @returns {Promise<Object>}
     */
    async deleteByReviewId(reviewId) {
        return this.collection.deleteMany({ reviewId: new ObjectId(reviewId) })
    }

    /**
     * Delete all comments associated with a user.
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async deleteByUserId(userId) {
        return this.collection.deleteMany({ userId: new ObjectId(userId) })
    }

    /**
     * Like a comment (add userId to likes array)
     * @param {string} commentId - The ID of the comment
     * @param {string} userId - The ID of the user liking the comment
     * @returns {Promise<Object>} MongoDB update result
     */
    async like(commentId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(commentId) },
            {
                $addToSet: { likes: new ObjectId(userId) },
                $pull: { dislikes: new ObjectId(userId) }, // Remove from dislikes if it exists
            }
        )
    }

    /**
     * Unlike a comment (remove userId from likes array)
     * @param {string} commentId - The ID of the comment
     * @param {string} userId - The ID of the user unliking the comment
     * @returns {Promise<Object>} MongoDB update result
     */
    async unlike(commentId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(commentId) },
            { $pull: { likes: new ObjectId(userId) } }
        )
    }

    /**
     * Dislike a comment (add userId to dislikes array)
     * @param {string} commentId - The ID of the comment
     * @param {string} userId - The ID of the user disliking the comment
     * @returns {Promise<Object>} MongoDB update result
     */
    async dislike(commentId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(commentId) },
            {
                $addToSet: { dislikes: new ObjectId(userId) },
                $pull: { likes: new ObjectId(userId) }, // Remove from likes if it exists
            }
        )
    }

    /**
     * Remove dislike from a comment (remove userId from dislikes array)
     * @param {string} commentId - The ID of the comment
     * @param {string} userId - The ID of the user removing dislike
     * @returns {Promise<Object>} MongoDB update result
     */
    async undislike(commentId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(commentId) },
            { $pull: { dislikes: new ObjectId(userId) } }
        )
    }
}

export default new CommentGateway()
