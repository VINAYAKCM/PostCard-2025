// Cloudinary Configuration for PostCard Image Hosting
// This will provide high-quality image delivery without email size limits

export const cloudinaryConfig = {
  cloudName: 'dzrwj3ydj',
  uploadPreset: 'postcard_uploads',
  apiKey: '441678468464399'
};

// ⚠️ IMPORTANT: Your upload preset must be set to "Unsigned" in Cloudinary
// Go to Settings > Upload > Upload presets > postcard_uploads
// Change "Signing mode" from "Signed" to "Unsigned"
// This allows direct browser uploads without server-side signing

// Cloudinary Setup Instructions:
// 1. Go to https://cloudinary.com/ and create a free account
// 2. Get your Cloud Name from the dashboard
// 3. Go to Settings > Upload > Upload presets
// 4. Create a new upload preset (set to "Unsigned" for client-side uploads)
// 5. Copy the preset name and cloud name
// 6. Update the values above

// Benefits of Cloudinary:
// ✅ No image size limits
// ✅ Automatic optimization
// ✅ Fast CDN delivery
// ✅ Direct download links
// ✅ Professional hosting
// ✅ Free tier: 25GB storage, 25GB bandwidth/month
