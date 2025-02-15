import { getDb } from "../model/conn.js";

const db = getDb();
const establishments_db = db.collection("establishments");

class EstablishmentMapper {
    static async getByUsername(username) {
        return await establishments_db.findOne({ username });
    }

    static async updateRating(establishmentId, rating) {
        await establishments_db.updateOne(
            { _id: establishmentId },
            { $set: { rating: rating } }
        );
    }
}

export default EstablishmentMapper;
