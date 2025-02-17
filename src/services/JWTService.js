import jwt from 'jsonwebtoken'

class JWTService {
    static async assertLoggedIn(req, res, next) {
        let userID = null
        let token = req.cookies.jwt
        if (token) {
            try {
                const decodedToken = await jwt.verify(token, 'secret')
                userID = decodedToken._id
            } catch (err) {
                console.log('Error occurred:', err)
            }
        }

        if (userID == null) {
            res.sendStatus(401)
        } else {
            req.body.userID = userID
        }

        next()
    }
}

export default JWTService
