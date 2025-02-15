import ReviewGateway from "../model/ReviewGateway.js";
import Review from "../model/Review.js";

// Processes reviews unraw
class ReviewService {
    static async getReviewsByEstablishment(establishmentId, currentUser) {
        // Fetch raw review data
        const reviewDataList = await ReviewGateway.getByEstablishmentId(establishmentId);

        // Convert raw data into Review objects
        let reviews = reviewDataList.map(data => new Review(data));

        // Exclude current user's review from general list
        reviews = reviews.filter(r => r.userId.toString() !== currentUser?._id.toString());

        return reviews;
    }

    static calculateAverageRating(reviews) {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }

    static getReviewSummary(reviews) {
        const totalReviews = reviews.length;
        return {
            nReviews: totalReviews,
            fiveRev: reviews.filter(r => r.rating === 5).length / totalReviews * 100,
            fourRev: reviews.filter(r => r.rating === 4).length / totalReviews * 100,
            threeRev: reviews.filter(r => r.rating === 3).length / totalReviews * 100,
            twoRev: reviews.filter(r => r.rating === 2).length / totalReviews * 100,
            oneRev: reviews.filter(r => r.rating === 1).length / totalReviews * 100,
        };
    }
}

export default ReviewService;
