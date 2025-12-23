const mult = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
console.log("Cloudinary Config Check:");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "Exists" : "MISSING");
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "Exists" : "MISSING");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "Exists" : "MISSING");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'skill_swap_avatars',
        resource_type: 'auto', // Allow any image type
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
