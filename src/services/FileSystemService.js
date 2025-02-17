import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const DIRNAME = path.dirname(fileURLToPath(import.meta.url)) // directory URL

// kind of a hacky solution, since this depends on the file's location in the source tree
// node.js doesn't implement any easy ways to get the root directory of the folder
// ultimately, the real solution to this problem is to not store images directly on the
// server filesystem, but can't really change that as of yet
const PUBLIC_DIRNAME = DIRNAME + '../../../public'

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

    static deleteMedia(filename) {
        fs.unlink(PUBLIC_DIRNAME + filename, (err) => {
            if (err) console.error('Error deleting file:', err)
        })
    }
}

export default FileSystemService
