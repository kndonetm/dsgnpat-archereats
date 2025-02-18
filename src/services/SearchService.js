import ReviewGateway from '../model/ReviewGateway.js'
import EstablishmentGateway from '../model/EstablishmentGateway.js'

export const search = async (req, res) => {
    const query = req.query.q;
    const filter = req.query.filter ? parseInt(req.query.filter) : null;
    
    const estabQueryPipe = {
        $or: [
            { "displayed-name": { $regex: new RegExp(query, "i") } },
            { description: { $regex: new RegExp(query, "i") } }
        ]
    };
    
    if (filter) {
        estabQueryPipe.$and = [{ rating: { $gt: filter, $lt: filter + 1 } }];
    }
    
    const reviewQueryPipe = [
        { $match: { $or: [ { title: { $regex: new RegExp(query, "i") } }, { content: { $regex: new RegExp(query, "i") } } ] } },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $unwind: "$user" }
    ];
    
    try {
        const establishmentsArray = await EstablishmentGateway.getAllEstablishments(estabQueryPipe);
        const reviewsArray = await ReviewGateway.collection.aggregate(reviewQueryPipe).toArray();
        
        reviewsArray.forEach(async (review) => {
            const establishment = await EstablishmentGateway.getById(review.establishmentId);
            review.estabUsername = establishment.username;
            review.id = review._id.toString();
        });
        
        res.render("search", {
            title: `${query} - Search Results`,
            css: '<link href="static/css/search-result.css" rel="stylesheet">',
            js: '<script defer src="static/js/search-result.js"></script>',
            key: query,
            establishments: establishmentsArray,
            reviews: reviewsArray,
            starFilter: filter ? `${filter} Stars` : 'No filter'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};