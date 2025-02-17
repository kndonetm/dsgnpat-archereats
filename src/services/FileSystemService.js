import multer from 'multer'
import path from 'path'

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
}

export default FileSystemService
