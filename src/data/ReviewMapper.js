import { getDb } from "../model/conn.js";
import { ObjectId } from "mongodb";

const db = getDb();
const reviews_db = db.collection("reviews");

class ReviewMapper {
    /**
     * Fetch all reviews associated with a specific establishment
     * @param {ObjectId} establishmentId - The ID of the establishment
     * @returns {Array} List of reviews with user and comment data
     */
    static async getByEstablishmentId(establishmentId) {
        return await reviews_db.aggregate([
            {
                '$match': { 'establishmentId': establishmentId }
            },
            {
                '$lookup': { // Join comments collection
                    'from': 'comments',
                    'localField': '_id',
                    'foreignField': 'reviewId',
                    'as': 'comments'
                }
            },
            {
                '$unwind': {
                    'path': '$comments',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$lookup': { // Join users collection (review author)
                    'from': 'users',
                    'localField': 'userId',
                    'foreignField': '_id',
                    'as': 'user'
                }
            },
            {
                '$unwind': {
                    'path': '$user',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$lookup': { // Join users collection for comment authors
                    'from': 'users',
                    'localField': 'comments.userId',
                    'foreignField': '_id',
                    'as': 'comments.user'
                }
            },
            {
                '$unwind': {
                    'path': '$comments.user',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$group': { // Group review data
                    '_id': '$_id',
                    'title': { '$first': '$title' },
                    'content': { '$first': '$content' },
                    'rating': { '$first': '$rating' },
                    'likes': { '$first': '$likes' },
                    'dislikes': { '$first': '$dislikes' },
                    'edited': { '$first': '$edited' },
                    'images': { '$first': '$images' },
                    'videos': { '$first': '$videos' },
                    'datePosted': { '$first': '$datePosted' },
                    'estabResponse': { '$first': '$estabResponse' },
                    'establishmentId': { '$first': '$establishmentId' },
                    'userId': { '$first': '$userId' },
                    'user': { '$first': '$user' },
                    'comments': { '$push': '$comments' }
                }
            },
            {
                '$sort': { 'datePosted': -1 } // Sort by most recent reviews
            }
        ]).toArray();
    }

    /**
     * Fetch a single review by its ID
     * @param {ObjectId} reviewId - The ID of the review
     * @returns {Object} The review document
     */
    static async getById(reviewId) {
        return await reviews_db.findOne({ _id: new ObjectId(reviewId) });
    }

    /**
     * Insert a new review into the database
     * @param {Object} reviewData - The review object
     * @returns {Object} Inserted review ID
     */
    static async insert(reviewData) {
        const result = await reviews_db.insertOne(reviewData);
        return result.insertedId;
    }

    /**
     * Update a review's content, rating, and media
     * @param {ObjectId} reviewId - The ID of the review
     * @param {Object} updatedData - New review data
     * @returns {Object} MongoDB update result
     */
    static async update(reviewId, updatedData) {
        return await reviews_db.updateOne(
            { _id: new ObjectId(reviewId) },
            { $set: updatedData }
        );
    }

    /**
     * Delete a review from the database
     * @param {ObjectId} reviewId - The ID of the review
     * @returns {Object} MongoDB delete result
     */
    static async delete(reviewId) {
        return await reviews_db.deleteOne({ _id: new ObjectId(reviewId) });
    }
}

export default ReviewMapper;
