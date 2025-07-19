const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// exports.cloudinary = async () => {

  // Configuration
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
      public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`,
    },
  });
  
    // Upload an image
  // const uploadResult = await cloudinary.uploader
  //   .upload(
  //       'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
  //           public_id: 'shoes',
  //       }
  //   )
  //   .catch((error) => {
  //       console.log(error);
  //   });
    
  // console.log(uploadResult);
  
  // Optimize delivery by resizing and applying auto-format and auto-quality
  // const optimizeUrl = cloudinary.url('shoes', {
  //     fetch_format: 'auto',
  //     quality: 'auto'
  // });
    
  // console.log(optimizeUrl);
  
  // Transform the image: auto-crop to square aspect_ratio
  // const autoCropUrl = cloudinary.url('shoes', {
  //     crop: 'auto',
  //     gravity: 'auto',
  //     width: 500,
  //     height: 500,
  // });
    
  // console.log(autoCropUrl);    
// };
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
  storage: storage
})

module.exports = {upload}