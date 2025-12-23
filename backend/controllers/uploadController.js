const mult = require('multer');
const path = require('path');

const storage = mult.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images and Documents only!');
    }
}

const upload = mult({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

const uploadFile = (req, res) => {
    res.send(`/${req.file.path.replace(/\\/g, "/")}`);
};

module.exports = { upload, uploadFile };
