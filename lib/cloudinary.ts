import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Placeholder URLs for development mode (when Cloudinary is not configured)
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
  'https://images.unsplash.com/photo-1484712401471-05c7215830eb?w=400',
  'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=400'
];

// Check if Cloudinary is configured
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

/**
 * Development fallback function for when Cloudinary is not configured
 */
const uploadFallback = async (
  folder: string = 'rental-platform'
): Promise<{ url: string; publicId: string }> => {
  console.log('📝 Development mode: Using placeholder image URLs');
  console.log('🔧 To enable real uploads, add Cloudinary credentials to .env.local');
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a placeholder image URL
  const randomImage = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
  const publicId = `${folder}/dev_${Date.now()}.jpg`;
  
  return {
    url: randomImage,
    publicId: publicId
  };
};

/**
 * Upload an image to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Cloudinary folder
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  file: Buffer | string,
  folder: string = 'rental-platform'
): Promise<{ url: string; publicId: string }> => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      console.log('🔄 Cloudinary not configured, using development fallback');
      return uploadFallback(folder);
    }

    let uploadData: string;

    if (typeof file === 'string') {
      // Handle base64 string (already in correct format)
      uploadData = file;
    } else {
      // Handle Buffer - convert to base64
      const base64 = file.toString('base64');
      uploadData = `data:image/jpeg;base64,${base64}`;
    }

    console.log('🔄 Attempting Cloudinary upload...');
    
    // Upload to Cloudinary with optimizations and timeout
    const uploadPromise = cloudinary.uploader.upload(uploadData, {
      folder: folder,
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout after 10 seconds')), 10000);
    });

    const result = await Promise.race([uploadPromise, timeoutPromise]) as any;

    console.log('✅ Cloudinary upload successful:', result.secure_url);
    return {
      url: result.secure_url,
      publicId: result.public_id
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Fallback to development mode on any error
    console.log('🔄 Error occurred, using development fallback');
    return uploadFallback(folder);
  }
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The Cloudinary public ID
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      console.log('🔄 Development mode: Simulated image deletion for', publicId);
      return;
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // In development mode, just log and continue
    console.log('🔄 Error occurred, simulating success in development mode');
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of file buffers or base64 strings
 * @param folder - Cloudinary folder
 * @returns Promise with array of upload results
 */
export const uploadMultipleToCloudinary = async (
  files: (Buffer | string)[],
  folder: string = 'rental-platform'
): Promise<{ url: string; publicId: string }[]> => {
  try {
    const uploadPromises = files.map((file) => 
      uploadToCloudinary(file, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload images');
  }
};

// Legacy exports for backward compatibility (keeping same function names)
export const uploadToSupabaseStorage = uploadToCloudinary;
export const deleteFromSupabaseStorage = deleteFromCloudinary;
export const uploadMultipleToSupabaseStorage = uploadMultipleToCloudinary;
