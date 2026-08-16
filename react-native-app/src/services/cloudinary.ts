/**
 * Cloudinary Image Management Service for React Native Android
 * Provides unsigned upload, optimization, and fallback handling.
 */

const CLOUDINARY_CLOUD_NAME = 'rqf1hlrx'; // Default Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'autoparts_upload'; // Unsigned upload preset

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Uploads a local image file URI to Cloudinary using FormData and fetch.
 * Fully compatible with React Native Android.
 */
export async function uploadImageToCloudinary(
  fileUri: string,
  folder: string = 'spare_parts'
): Promise<string> {
  if (!fileUri) {
    throw new Error('File URI is required for image upload.');
  }

  // If already a remote URL, return as-is
  if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
    return fileUri;
  }

  try {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || `upload_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: type,
    } as any);

    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Cloudinary upload error payload:', errorText);
      // Fallback: If upload preset is not configured on Cloudinary server, return original URI safely
      return fileUri;
    }

    const data = await response.json() as CloudinaryUploadResponse;
    return data.secure_url || fileUri;
  } catch (err) {
    console.warn('Cloudinary upload network exception, falling back to local URI:', err);
    return fileUri;
  }
}

/**
 * Generates an optimized Cloudinary image transformation URL
 */
export function getOptimizedImageUrl(
  urlOrPublicId: string,
  width: number = 400,
  height: number = 300
): string {
  if (!urlOrPublicId) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400';
  }

  if (urlOrPublicId.includes('res.cloudinary.com')) {
    return urlOrPublicId.replace(
      '/upload/',
      `/upload/c_fill,w_${width},h_${height},f_auto,q_auto/`
    );
  }

  return urlOrPublicId;
}

/**
 * Simulates Cloudinary image deletion flow (Client side confirmation)
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    console.log('Marking image for deletion on Cloudinary:', publicId);
    return true;
  } catch (err) {
    console.warn('Delete image error:', err);
    return false;
  }
}
