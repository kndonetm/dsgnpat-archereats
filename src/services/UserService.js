import { ObjectId } from "mongodb";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import ReviewGateway from '../model/ReviewGateway.js';
import CommentGateway from '../model/CommentGateway.js';
import EstablishmentGateway from '../model/EstablishmentGateway.js';
import UserGateway from '../model/UserGateway.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
class UserService {
    async getUserByUsername(username) {
        return await UserGateway.getByUsername(username);
    }
    
    async getUserById(userId) {
        return await UserGateway.getById(userId);
    }

    async updateUser(userId, userData) {
        return await UserGateway.updateUser(userId, userData);
    }

    async verifyToken(token) {
        try {
            const decodedToken = await jwt.verify(token, "secret");
            return decodedToken._id;
        } catch (err) {
            console.log("JWT verification failed:", err);
            return null;
        }
    }
    async changeUserProfilePicture(token, file) {
        const userId = await this.verifyToken(token);
        if (!userId || !file) return null;

        const imgPath = "static/assets/user_pfp/" + file.filename;
        const user = await UserGateway.getById(userId);

        // Delete old profile picture if it exists
        if (user?.profilePicture) {
            const oldImgPath = __dirname + "../../../public/assets/user_pfp/" + user.profilePicture.substring(23);
            fs.unlink(oldImgPath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }

        await UserGateway.updateUser(userId, { profilePicture: imgPath });
        return imgPath;
    }

    async changeUserDescription(token, userDesc) {
        const userId = await this.verifyToken(token);
        if (!userId) return null;

        await UserGateway.updateUser(userId, { description: userDesc });
        return userDesc;
    }

    async getUserProfile(username, token) {
        const user = await this.getUserByUsername(username);
        if (!user) return null;

        const userId = user._id;
        const oid = new ObjectId(userId);

        // Fetch user reviews and comments
        const reviews = await ReviewGateway.getReviewsByUserId(oid);
        const comments = await CommentGateway.getByUserId(oid);

        // Process reviews for display
        await Promise.all(reviews.map(async (review) => {
            const establishment = await EstablishmentGateway.getById(review.establishmentId);
            review.user = {
                username: establishment?.displayedName,
                profilePicture: establishment?.profilePicture,
                link: "/" + establishment?.username
            };
        }));

        // Sort and trim reviews for display
        const collatedReviews = [...reviews, ...comments].sort((a, b) => b.datePosted - a.datePosted);
        const topReviews = collatedReviews.slice(0, 3);
        const truncatedReviews = collatedReviews.slice(3);

        // Verify token to determine if the user is viewing their own profile
        const currentUserId = await this.verifyToken(token);
        const isOwner = currentUserId && currentUserId === userId.toString();

        return {
            isOwner,
            username: user.username,
            profilePicture: user.profilePicture,
            description: user.description,
            topReviews,
            truncatedReviews,
        };
    }
}

export default new UserService();