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
    params: async (req, file) => {
        // Check if file is image based on mimetype
        const isImage = file.mimetype.startsWith('image');
        // Extract plain filename without extension
        const originalName = file.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
        // Extract extension
        const ext = file.originalname.split('.').pop();

        return {
            folder: 'skill_swap_avatars',
            resource_type: isImage ? 'image' : 'raw',
            access_mode: 'public', // Explicitly request public access
            type: 'upload',        // Standard upload type
            // For non-image files (Raw), we MUST append extension to public_id 
            // so the URL ends in .docx/.zip etc.
            // For images, Cloudinary handles it.
            public_id: `${originalName}_${Date.now()}${isImage ? '' : `.${ext}`}`,
        };
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
