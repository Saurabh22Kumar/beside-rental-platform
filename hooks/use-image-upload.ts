import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  url: string;
  publicId: string;
}

interface UseImageUploadOptions {
  folder?: string;
  maxFiles?: number;
  maxSizeInMB?: number;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const { folder = 'rental-platform', maxFiles = 5, maxSizeInMB = 5 } = options;
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  /**
   * Upload multiple images
   */
  const uploadImages = async (files: FileList | File[]): Promise<UploadResult[]> => {
    if (!files || files.length === 0) {
      throw new Error('No files selected');
    }

    if (files.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed`);
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      // Add files to form data
      Array.from(files).forEach((file) => {
        // Validate file size
        if (file.size > maxSizeInMB * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is ${maxSizeInMB}MB`);
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }
        
        formData.append('images', file);
      });

      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Upload failed:', error);
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`,
      });

      return result.images;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Upload a single image (for profile photos)
   */
  const uploadSingleImage = async (file: File): Promise<UploadResult> => {
    if (!file) {
      throw new Error('No file selected');
    }

    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      throw new Error(`File is too large. Maximum size is ${maxSizeInMB}MB`);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: "Image uploaded successfully",
      });

      return result.image;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle file input change for multiple files
   */
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (results: UploadResult[]) => void
  ) => {
    const files = event.target.files;
    if (!files) return;

    try {
      const results = await uploadImages(files);
      onSuccess(results);
    } catch (error) {
      console.error('Upload error:', error);
    }

    // Reset input
    event.target.value = '';
  };

  /**
   * Handle file input change for single file
   */
  const handleSingleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (result: UploadResult) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadSingleImage(file);
      onSuccess(result);
    } catch (error) {
      console.error('Upload error:', error);
    }

    // Reset input
    event.target.value = '';
  };

  return {
    uploading,
    uploadImages,
    uploadSingleImage,
    handleFileChange,
    handleSingleFileChange,
  };
};
