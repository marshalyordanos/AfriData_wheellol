import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'REDACTED',
  api_key: 'REDACTED',
  api_secret: 'REDACTED',
});

export default cloudinary;
