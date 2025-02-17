import { ObjectId } from 'mongodb'

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import searchRouter from './search-router.js'
import userRouter from './user-router.js'
import establishmentRouter from './establishment-router.js'

import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import loginRegisterRouter from '../routes/login-register-router.js'

import Review from '../model/Review.js'
import ReviewGateway from '../model/ReviewGateway.js'
import EstablishmentGateway from '../model/EstablishmentGateway.js'
import UserGateway from '../model/UserGateway.js'
import CommentGateway from '../model/CommentGateway.js'

import FileSystemService from '../services/FileSystemService.js'

const __dirname = dirname(fileURLToPath(import.meta.url)) // directory URL
const router = Router()

router.get('/', async function (req, res) {
    const establishments = await EstablishmentGateway.getAllEstablishments()

    res.render('index', {
        title: 'Home',
        establishments: establishments,
        css: `<link rel="stylesheet" href="/static/css/style.css">
        <link rel="stylesheet" href="/static/css/index.css">`,
    })
})

router.get('/about', (req, res) => {
    res.render('about', {
        title: 'About',
    })
})

router.use(userRouter)
router.use(searchRouter)
router.use(establishmentRouter)
router.use(loginRegisterRouter)

router
    .route('/review')
    .post(FileSystemService.uploadMedia, async function (req, res) {
        const { estabID, title, rate, content } = req.body
        const { imageURLs, videoURLs } = FileSystemService.splitImagesVideos(
            req.files
        )

        let userID
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
        } else if (title && rate && content) {
            let theUSER = await UserGateway.getById(userID)
            const newReview = new Review({
                title: title,
                rating: rate,
                content: content,
                likes: [],
                dislikes: [],
                edited: false,
                images: imageURLs,
                videos: videoURLs,
                datePosted: new Date(),
                estabResponse: null,
                establishmentId: new ObjectId(estabID),
                userId: new ObjectId(userID),
            })
            try {
                let resp = await ReviewGateway.insert(newReview.toJSON())
                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200).send({ review: newReview, user: theUSER })
        } else {
            res.sendStatus(400)
        }
    })
    .patch(FileSystemService.uploadMedia, async function (req, res) {
        const { title, rate, content, reviewID } = req.body

        let userID
        let token = req.cookies.jwt
        if (token) {
            try {
                const decodedToken = await jwt.verify(token, 'secret')
                userID = decodedToken._id
            } catch (err) {
                console.log('Error occurred:', err)
            }
        }

        let imageURls = []
        let videoUrls = []
        for (let files of req.files) {
            let type = files.mimetype
            if (type.split('/')[0] == 'image')
                imageURls.push('/static/assets/reviewPics/' + files.filename)
            else videoUrls.push('/static/assets/reviewPics/' + files.filename)
        }
        let review = await ReviewGateway.getById(reviewID)

        if (review != null) {
            for (let img of review.images)
                fs.unlink(
                    __dirname + '../../../public' + img.substring(7),
                    (err) => {
                        if (err) console.error('Error deleting file:', err)
                    }
                )
            for (let vid of review.videos)
                fs.unlink(
                    __dirname + '../../../public' + vid.substring(7),
                    (err) => {
                        if (err) console.error('Error deleting file:', err)
                    }
                )
        }

        if (userID == null) {
            res.sendStatus(401)
        } else if (title && rate && content) {
            let theUSER = await UserGateway.getById(userID)

            try {
                let resp = await ReviewGateway.update(reviewID, {
                    title: title,
                    rating: rate,
                    content: content,
                    edited: true,
                    images: imageURls,
                    videos: videoUrls,
                })

                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send({
                title: title,
                content: content,
                rating: rate,
                images: imageURls,
                videos: videoUrls,
                user: theUSER,
            })
        } else {
            res.sendStatus(400)
        }
    })
    .delete(async function (req, res) {
        let { reviewId } = req.body

        if (reviewId) {
            let __iod = new ObjectId(reviewId)
            let review = await ReviewGateway.getById(__iod)

            if (review != null) {
                for (let img of review.images)
                    fs.unlink(
                        __dirname + '../../../public' + img.substring(7),
                        (err) => {
                            if (err) console.error('Error deleting file:', err)
                        }
                    )
                for (let vid of review.videos)
                    fs.unlink(
                        __dirname + '../../../public' + vid.substring(7),
                        (err) => {
                            if (err) console.error('Error deleting file:', err)
                        }
                    )
            }

            try {
                let resp = await ReviewGateway.delete(__iod)
                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send('review Deleted')
        } else {
            res.sendStatus(400)
        }
    })

router.patch('/', async (req, res) => {
    let userId
    let token = req.cookies.jwt
    if (token) {
        try {
            const decodedToken = await jwt.verify(token, 'secret')
            userId = decodedToken._id
        } catch (err) {
            console.log('Error occurred:', err)
        }
    }

    if (userId == null) {
        res.sendStatus(401)
    } else {
        let { reviewId, updateH: updateCode } = req.body
        reviewId = new ObjectId(reviewId)

        const x = await ReviewGateway.getById(reviewId)

        let usedGateway

        if (x) {
            usedGateway = ReviewGateway
            console.log('Review gateway')
        } else {
            usedGateway = CommentGateway
            console.log('Comment gateway')
        }
        let reviewOrComment = await usedGateway.getById(reviewId)
        let resp
        switch (updateCode) {
            case 'up':
                if (reviewOrComment.likes.includes(userId) == false)
                    resp = await usedGateway.like(reviewId, userId)
                break
            case 'up_':
                resp = await usedGateway.unlike(reviewId, userId)
                break
            case 'down':
                if (reviewOrComment.dislikes.includes(userId) == false)
                    resp = await usedGateway.dislike(reviewId, userId)
                break
            case 'down_':
                resp = await usedGateway.undislike(reviewId, userId)
                break
        }
        console.log(resp)
        res.status(200)
        res.send('done')
    }
})

router
    .route('/comment')
    .post(async function (req, res) {
        let { revID, parID, text } = req.body
        let userID
        let token = req.cookies.jwt
        if (token) {
            try {
                const decodedToken = await jwt.verify(token, 'secret')
                userID = decodedToken._id
            } catch (err) {
                console.log('Error occurred:', err)
            }
        }

        let par_id = null
        if (parID != 'null') par_id = new ObjectId(parID)
        if (revID == 'null') {
            let parComment = await comments_db.findOne({
                _id: new ObjectId(par_id),
            })
            revID = parComment.reviewId
        }

        if (userID == null) {
            res.sendStatus(401)
        } else if (revID && userID && text) {
            let theUSER = await UserGateway.getById(userID)
            const newComment = {
                content: text,
                likes: [],
                dislikes: [],
                comments: [],
                datePosted: new Date(),
                userId: new ObjectId(userID),
                parent: par_id,
                reviewId: new ObjectId(revID),
                edited: false,
            }
            try {
                let resp = await comments_db.insertOne(newComment)
                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send({
                content: newComment.content,
                _id: newComment._id,
                user: theUSER,
            })
        } else {
            res.sendStatus(400)
        }
    })
    .patch(async function (req, res) {
        const { commID, text } = req.body

        if (commID && text) {
            try {
                let resp = await comments_db.updateOne(
                    { _id: new ObjectId(commID) },
                    {
                        $set: {
                            content: text,
                            edited: true,
                        },
                    }
                )
                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send('edited comment')
        } else {
            res.sendStatus(400)
        }
    })
    .delete(async function (req, res) {
        const { commID } = req.body
        try {
            const resp = await comments_db.deleteOne({
                _id: new ObjectId(commID),
            })
            console.log(resp)
        } catch (err) {
            console.log('Error occurred:', err)
            res.sendStatus(500)
        }
        res.status(200)
        res.send('deleted comment')
    })

router
    .route('/estabRespo')
    .post(async function (req, res) {
        const { revID, text } = req.body

        if (revID && text) {
            const newEstabRespo = {
                content: text,
                likes: [],
                dislikes: [],
                comments: [],
                edited: false,
                datePosted: new Date(),
            }
            try {
                let resp = await ReviewGateway.update(revID, {
                    estabResponse: newEstabRespo,
                })

                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send('done estab respo')
        } else {
            res.sendStatus(400)
        }
    })
    .patch(async function (req, res) {
        const { revID, text } = req.body

        if (revID && text) {
            try {
                let resp = await ReviewGateway.update(revID, {
                    'estabResponse.content': text,
                    'estabResponse.edited': true,
                })

                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send('edited estab respo')
        }
    })
    .delete(async function (req, res) {
        const { revID } = req.body
        try {
            let resp = await ReviewGateway.update(revID, {
                estabResponse: null,
            })
            console.log(resp)
        } catch (err) {
            console.log('Error occurred:', err)
            res.sendStatus(500)
        }
        res.status(200)
        res.send('deleted estab respo')
    })

router.post('/upload', FileSystemService.uploadPfp, (req, res) => {
    let filePath
    try {
        filePath = req.file.path

        const updatedPath = filePath.replace('public', 'static')
        console.log(updatedPath)
        console.log('File uploaded successfully:', req.file)
        res.json({ path: updatedPath })
    } catch (error) {
        console.log('No file was uploaded.')
        res.status(400).json({ error: 'No file was uploaded.' })
    }
})

router.use((req, res) => {
    res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title> 404 | ArcherEats</title>
  </head>
  <body>
    <h1>for oh for | resource aint found! </h1>
  </body>
  </html>
  `)
})

export default router
