const mult = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'skill_swap_avatars', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional resize
    },
});

const upload = mult({ storage: storage });

const uploadFile = (req, res) => {
    // Cloudinary returns the URL in req.file.path
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(req.file.path);
};

module.exports = { upload, uploadFile };
