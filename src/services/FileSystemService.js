import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const DIRNAME = path.dirname(fileURLToPath(import.meta.url))

const uploadPfpMiddleware = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'public/assets/user_pfp/')
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname))
        },
    }),
})

const uploadMediaMiddleware = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/assets/reviewPics/')
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '_' + file.originalname)
        },
    }),
})

class FileSystemService {
    static uploadPfp(req, res, next) {
        uploadPfpMiddleware.single('file')(req, res, next)
    }

    static uploadMedia(req, res, next) {
        uploadMediaMiddleware.array('mediaInput')(req, res, next)
    }

    static splitImagesVideos(files) {
        let imageURLs = []
        let videoURLs = []

        for (let file of files) {
            let type = file.mimetype
            if (type.split('/')[0] == 'image')
                imageURLs.push('/static/assets/reviewPics/' + file.filename)
            else videoURLs.push('/static/assets/reviewPics/' + file.filename)
        }

        return { imageURLs: imageURLs, videoURLs: videoURLs }
    }
}

export default FileSystemService
