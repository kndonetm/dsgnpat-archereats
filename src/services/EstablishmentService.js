import EstablishmentGateway from "../model/EstablishmentGateway.js";
import ReviewService from "./ReviewService.js";

// Business logic for fetching establishmet details, reviews, ratings
class EstablishmentService {
    static async getEstablishmentDetails(username, currentUser) {
        // Fetch establishment data
        const establishment = await EstablishmentGateway.getByUsername(username);
        if (!establishment) return null;

        // Fetch and process reviews
        let reviews = await ReviewService.getReviewsByEstablishment(establishment._id, currentUser);
        reviews = reviews.map(r => r.toJSON())
        const userReview = reviews.find(r => r.userId.toString() === currentUser?._id.toString()) || null
        const otherReviews = reviews.filter(r => r.userId.toString() !== currentUser?._id.toString())

        console.log(otherReviews.slice(0, 2))

        // Calculate rating
        const rating = ReviewService.calculateAverageRating(reviews);

        // Update establishment rating in database
        await EstablishmentGateway.updateRating(establishment._id, rating);

        return {
            title: establishment.displayedName,
            selectedEstab: establishment,
            rateSummary: ReviewService.getReviewSummary(reviews),
            isEstab: currentUser?.establishmentId?.toString() === establishment._id.toString(),
            userReview: userReview,
            topReviews: otherReviews.slice(0, 2),
            truncatedReviews: otherReviews.slice(2),
            currentUser: currentUser ? currentUser._id.toString() : null,
            css: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">'
        };
    }
}

export default EstablishmentService;
