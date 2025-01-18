const multer = require("multer");
const path = require("path");

// Set storage engine to store files locally
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/productImages/"); // Specify the folder to store uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to allow only image files (jpg, jpeg, png)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images are allowed."), false);
  }
};

// Initialize multer with storage options and file filter
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter,
});

// Export middleware for multiple image uploads
const uploadMultiple = upload.array("images", 5); // Accept up to 5 images with the field name "images"

module.exports =uploadMultiple;
