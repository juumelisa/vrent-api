const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
    
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'VRent', // optional folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => {
      return `${Date.now()}`
    },
  },
});

const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
  storage: storage
})

module.exports = {upload}