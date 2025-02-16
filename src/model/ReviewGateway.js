import { ObjectId } from 'mongodb'
import { getDb } from './conn.js'

class ReviewGateway {
    constructor() {
        this.db = getDb()
        this.collection = this.db.collection('reviews')
    }

    /**
     * Fetch all reviews associated with a specific establishment
     * @param {string} establishmentId - The ID of the establishment
     * @returns {Promise<Array>} List of reviews with user and comment data
     */
    async getByEstablishmentId(establishmentId) {
        return this.collection
            .aggregate([
                {
                    $match: { establishmentId: new ObjectId(establishmentId) },
                },
                {
                    $lookup: {
                        // Join comments collection
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'reviewId',
                        as: 'comments',
                    },
                },
                {
                    $unwind: {
                        path: '$comments',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        // Join users collection (review author)
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: '$user',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        // Join users collection for comment authors
                        from: 'users',
                        localField: 'comments.userId',
                        foreignField: '_id',
                        as: 'comments.user',
                    },
                },
                {
                    $unwind: {
                        path: '$comments.user',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $group: {
                        // Group review data
                        _id: '$_id',
                        title: { $first: '$title' },
                        content: { $first: '$content' },
                        rating: { $first: '$rating' },
                        likes: { $first: '$likes' },
                        dislikes: { $first: '$dislikes' },
                        edited: { $first: '$edited' },
                        images: { $first: '$images' },
                        videos: { $first: '$videos' },
                        datePosted: { $first: '$datePosted' },
                        estabResponse: { $first: '$estabResponse' },
                        establishmentId: { $first: '$establishmentId' },
                        userId: { $first: '$userId' },
                        user: { $first: '$user' },
                        comments: { $push: '$comments' },
                    },
                },
                {
                    $sort: { datePosted: -1 }, // Sort by most recent reviews
                },
            ])
            .toArray()
    }

    /**
     * Fetch a single review by its ID
     * @param {string} reviewId - The ID of the review
     * @returns {Promise<Object>} The review document
     */
    async getById(reviewId) {
        return this.collection.findOne({ _id: new ObjectId(reviewId) })
    }

    /**
     * Insert a new review into the database
     * @param {Object} reviewData - The review object
     * @returns {Promise<ObjectId>} Inserted review ID
     */
    async insert(reviewData) {
        const result = await this.collection.insertOne(reviewData)
        return result.insertedId
    }

    /**
     * Update a review's content, rating, and media
     * @param {string} reviewId - The ID of the review
     * @param {Object} updatedData - New review data
     * @returns {Promise<Object>} MongoDB update result
     */
    async update(reviewId, updatedData) {
        return this.collection.updateOne(
            { _id: new ObjectId(reviewId) },
            { $set: updatedData }
        )
    }

    /**
     * Delete a review from the database
     * @param {string} reviewId - The ID of the review
     * @returns {Promise<Object>} MongoDB delete result
     */
    async delete(reviewId) {
        return this.collection.deleteOne({ _id: new ObjectId(reviewId) })
    }

    /**
     * Like a review (add userId to likes array)
     * @param {string} reviewId - The ID of the review
     * @param {string} userId - The ID of the user liking the review
     * @returns {Promise<Object>} MongoDB update result
     */
    async like(reviewId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(reviewId) },
            {
                $addToSet: { likes: new ObjectId(userId) },
                $pull: { dislikes: new ObjectId(userId) }, // Remove from dislikes if it exists
            }
        )
    }

    /**
     * Unlike a review (remove userId from likes array)
     * @param {string} reviewId - The ID of the review
     * @param {string} userId - The ID of the user unliking the review
     * @returns {Promise<Object>} MongoDB update result
     */
    async unlike(reviewId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(reviewId) },
            { $pull: { likes: new ObjectId(userId) } }
        )
    }

    /**
     * Dislike a review (add userId to dislikes array)
     * @param {string} reviewId - The ID of the review
     * @param {string} userId - The ID of the user disliking the review
     * @returns {Promise<Object>} MongoDB update result
     */
    async dislike(reviewId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(reviewId) },
            {
                $addToSet: { dislikes: new ObjectId(userId) },
                $pull: { likes: new ObjectId(userId) }, // Remove from likes if it exists
            }
        )
    }

    /**
     * Remove dislike from a review (remove userId from dislikes array)
     * @param {string} reviewId - The ID of the review
     * @param {string} userId - The ID of the user removing dislike
     * @returns {Promise<Object>} MongoDB update result
     */
    async undislike(reviewId, userId) {
        return this.collection.updateOne(
            { _id: new ObjectId(reviewId) },
            { $pull: { dislikes: new ObjectId(userId) } }
        )
    }

    async getReviewsByUserId(userId) {
        return await this.collection.find({ userId: new ObjectId(userId) }).toArray();
    }
}

export default new ReviewGateway()
