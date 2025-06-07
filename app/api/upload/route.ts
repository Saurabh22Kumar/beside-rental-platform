import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, uploadMultipleToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    
    const contentType = request.headers.get('content-type');
    
    // Check if this is a valid FormData request
    if (!contentType || !contentType.includes('multipart/form-data')) {
      console.error('❌ Invalid content type:', contentType);
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const folder = (formData.get('folder') as string) || 'rental-platform';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 5MB.` },
          { status: 400 }
        );
      }
    }

    // Convert files to base64 for Cloudinary upload
    const fileBuffers: Buffer[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      fileBuffers.push(Buffer.from(bytes));
    }

    // Upload to Cloudinary
    let uploadResults;
    if (fileBuffers.length === 1) {
      const result = await uploadToCloudinary(fileBuffers[0], folder);
      uploadResults = [result];
    } else {
      uploadResults = await uploadMultipleToCloudinary(fileBuffers, folder);
    }

    return NextResponse.json({
      success: true,
      images: uploadResults
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload images' },
      { status: 500 }
    );
  }
}

// Handle single image upload for profile photos
export async function PUT(request: NextRequest) {
  try {
    
    const contentType = request.headers.get('content-type');
    
    // Check if this is a valid FormData request
    if (!contentType || !contentType.includes('multipart/form-data')) {
      console.error('❌ Invalid content type:', contentType);
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const folder = (formData.get('folder') as string) || 'profiles';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
        { status: 400 }
      );
    }

    // Check file size (max 2MB for profile photos)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB for profile photos.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with profile-specific transformations
    const result = await uploadToCloudinary(buffer, folder);

    return NextResponse.json({
      success: true,
      image: result
    });

  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload profile image' },
      { status: 500 }
    );
  }
}
