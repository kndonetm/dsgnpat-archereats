// Encapsulate review with media handling and rating aggregation

class Review {
    constructor(data) {
        this.id = data._id;
        this.title = data.title;
        this.content = data.content;
        this.rating = data.rating;
        this.images = data.images || [];
        this.videos = data.videos || [];
        this.likes = data.likes || [];
        this.dislikes = data.dislikes || [];
        this.datePosted = data.datePosted;
        this.userId = data.userId;
        this.establishmentId = data.establishmentId;
        this.comments = data.comments || [];
        this.edited = data.edited || false;
    }

    getProcessedMedia() {
        const topVideos = this.videos.slice(0, 3);
        const truncatedVideos = this.videos.slice(3);
        const topImages = this.images.slice(0, Math.max(3 - topVideos.length, 0));
        const truncatedImages = this.images.slice(topImages.length);

        return {
            topVideos,
            truncatedVideos,
            topImages,
            truncatedImages,
            totalMedia: this.images.length + this.videos.length,
        };
    }

    getNetLikes() {
        return this.likes.length - this.dislikes.length;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            rating: this.rating,
            likes: this.getNetLikes(),
            images: this.images,
            videos: this.videos,
            datePosted: this.datePosted,
            edited: this.edited,
            userId: this.userId,
            establishmentId: this.establishmentId,
            media: this.getProcessedMedia(),
            comments: this.comments,
        };
    }
}

export default Review;
