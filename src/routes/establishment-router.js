import { Router } from 'express';
import EstablishmentService from '../services/EstablishmentService.js';

const establishmentRouter = Router();

// GET establishment details
// Now only handles requests and delegates work to the service layer -- EstablishmentService
establishmentRouter.get("/:username", async (req, res, next) => {
    try {
        const establishmentDetails = await EstablishmentService.getEstablishmentDetails(req.params.username, res.locals.user);
        if (!establishmentDetails) return next(); // If establishment not found

        res.render("establishment-view", establishmentDetails);
    } catch (err) {
        console.error("Error fetching establishment details:", err);
        next(err);
    }
});

export default establishmentRouter;
