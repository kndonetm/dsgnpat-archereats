import { ObjectId } from 'mongodb'
import { Router } from 'express'

import searchRouter from './search-router.js'
import userRouter from './user-router.js'
import establishmentRouter from './establishment-router.js'
import loginRegisterRouter from '../routes/login-register-router.js'

import Review from '../model/Review.js'
import ReviewGateway from '../model/ReviewGateway.js'
import EstablishmentGateway from '../model/EstablishmentGateway.js'
import UserGateway from '../model/UserGateway.js'
import CommentGateway from '../model/CommentGateway.js'

import FileSystemService from '../services/FileSystemService.js'
import JWTService from '../services/JWTService.js'

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
    .post(
        FileSystemService.uploadMedia,
        JWTService.assertLoggedIn,
        async function (req, res) {
            const { estabID, title, rate, content, userID } = req.body
            const { imageURLs, videoURLs } =
                FileSystemService.splitImagesVideos(req.files)

            if (title && rate && content) {
                let currentUser = await UserGateway.getById(userID)

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

                res.status(200).send({ review: newReview, user: currentUser })
            } else {
                res.sendStatus(400)
            }
        }
    )
    .patch(
        FileSystemService.uploadMedia,
        JWTService.assertLoggedIn,
        async function (req, res) {
            const { title, rate, content, reviewID, userID } = req.body
            const { imageURLs, videoURLs } =
                FileSystemService.splitImagesVideos(req.files)

            let review = await ReviewGateway.getById(reviewID)
            if (review != null) {
                for (let img of review.images)
                    FileSystemService.deleteMedia(img.substring(7))
                for (let vid of review.videos)
                    FileSystemService.deleteMedia(vid.substring(7))
            }

            if (title && rate && content) {
                let currentUser = await UserGateway.getById(userID)

                try {
                    let resp = await ReviewGateway.update(reviewID, {
                        title: title,
                        rating: rate,
                        content: content,
                        edited: true,
                        images: imageURLs,
                        videos: videoURLs,
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
                    images: imageURLs,
                    videos: videoURLs,
                    user: currentUser,
                })
            } else {
                res.sendStatus(400)
            }
        }
    )
    .delete(async function (req, res) {
        let { reviewId } = req.body

        if (reviewId) {
            let review = await ReviewGateway.getById(reviewId)

            if (review != null) {
                for (let img of review.images)
                    FileSystemService.deleteMedia(img.substring(7))
                for (let vid of review.videos)
                    FileSystemService.deleteMedia(vid.substring(7))
            }

            try {
                let resp = await ReviewGateway.delete(reviewId)
                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send('Review Deleted')
        } else {
            res.sendStatus(400)
        }
    })

router.patch('/', JWTService.assertLoggedIn, async (req, res) => {
    let { reviewId, updateH: updateCode, userID } = req.body

    const isReview = await ReviewGateway.getById(reviewId)
    let usedGateway
    if (isReview) {
        usedGateway = ReviewGateway
    } else {
        usedGateway = CommentGateway
    }

    let reviewOrComment = await usedGateway.getById(reviewId)
    let response
    switch (updateCode) {
        case 'up':
            if (reviewOrComment.likes.includes(userID) == false)
                response = await usedGateway.like(reviewId, userID)
            break
        case 'up_':
            response = await usedGateway.unlike(reviewId, userID)
            break
        case 'down':
            if (reviewOrComment.dislikes.includes(userID) == false)
                response = await usedGateway.dislike(reviewId, userID)
            break
        case 'down_':
            response = await usedGateway.undislike(reviewId, userID)
            break
    }

    console.log(response)
    res.status(200)
    res.send('done')
})

router
    .route('/comment')
    .post(JWTService.assertLoggedIn, async function (req, res) {
        let { revID, parID, text, userID } = req.body

        if (parID == 'null') {
            parID = null
        }

        if (revID == 'null') {
            let parComment = await CommentGateway.getById(parID)
            revID = parComment.reviewId
        }

        if (revID && userID && text) {
            let currentUser = await UserGateway.getById(userID)
            const newComment = {
                content: text,
                likes: [],
                dislikes: [],
                comments: [],
                datePosted: new Date(),
                userId: new ObjectId(userID),
                parent: new ObjectId(parID),
                reviewId: new ObjectId(revID),
                edited: false,
            }
            try {
                let resp = await CommentGateway.insertComment(newComment)
                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send({
                content: newComment.content,
                _id: newComment._id,
                user: currentUser,
            })
        } else {
            res.sendStatus(400)
        }
    })
    .patch(async function (req, res) {
        const { commID, text } = req.body

        if (commID && text) {
            try {
                let resp = await CommentGateway.updateComment(commID, {
                    content: text,
                    edited: true,
                })
                console.log(resp)
            } catch (err) {
                console.log('Error occurred:', err)
                res.sendStatus(500)
            }
            res.status(200)
            res.send('Edited comment')
        } else {
            res.sendStatus(400)
        }
    })
    .delete(async function (req, res) {
        const { commID } = req.body
        try {
            const resp = await CommentGateway.deleteComment(commID)
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
