import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface UploadResult {
  url: string
  publicId: string
}

export interface UploadError {
  message: string
  code?: string
  retry?: boolean
}

export interface EnhancedUploadOptions {
  folder?: string
  maxFiles?: number
  maxSizeInMB?: number
  retryAttempts?: number
  retryDelay?: number
  enableCompression?: boolean
  onProgress?: (progress: number) => void
  onRetry?: (attempt: number, maxAttempts: number) => void
}

export function useEnhancedImageUpload(options: EnhancedUploadOptions = {}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()

  const {
    folder = 'rental-platform',
    maxFiles = 10,
    maxSizeInMB = 5,
    retryAttempts = 3,
    retryDelay = 1000,
    onProgress,
    onRetry
  } = options

  const validateFile = (file: File): UploadError | null => {
    if (!file.type.startsWith('image/')) {
      return { message: 'File must be an image', code: 'INVALID_TYPE' }
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      return { 
        message: `File size must be less than ${maxSizeInMB}MB`, 
        code: 'FILE_TOO_LARGE' 
      }
    }

    return null
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const uploadWithRetry = async (
    formData: FormData,
    attempt: number = 1
  ): Promise<UploadResult[]> => {
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Check if error is retryable
        const isRetryable = response.status >= 500 || 
                           response.status === 429 || 
                           response.status === 408
        
        if (isRetryable && attempt < retryAttempts) {
          throw new Error(`Retryable error: ${error.error || 'Upload failed'}`)
        }
        
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.images || []

    } catch (error) {
      if (attempt < retryAttempts) {
        setRetryCount(attempt)
        onRetry?.(attempt, retryAttempts)
        
        toast({
          title: `Upload attempt ${attempt} failed`,
          description: `Retrying in ${retryDelay / 1000} seconds... (${retryAttempts - attempt} attempts remaining)`,
        })
        
        await sleep(retryDelay * attempt) // Exponential backoff
        return uploadWithRetry(formData, attempt + 1)
      }
      
      throw error
    }
  }

  const uploadImages = async (files: File[]): Promise<UploadResult[]> => {
    if (files.length === 0) {
      throw new Error('No files selected')
    }

    if (files.length > maxFiles) {
      throw new Error(`Cannot upload more than ${maxFiles} files`)
    }

    // Validate all files
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        throw new Error(error.message)
      }
    }

    setUploading(true)
    setUploadProgress(0)
    setRetryCount(0)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('images', file))
      formData.append('folder', folder)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90)
          onProgress?.(newProgress)
          return newProgress
        })
      }, 300)

      const results = await uploadWithRetry(formData)

      clearInterval(progressInterval)
      setUploadProgress(100)
      onProgress?.(100)

      toast({
        title: "Upload successful",
        description: `${files.length} image(s) uploaded successfully`,
      })

      return results

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setRetryCount(0)
    }
  }

  const uploadSingleImage = async (file: File): Promise<UploadResult> => {
    const results = await uploadImages([file])
    return results[0]
  }

  return {
    uploading,
    uploadProgress,
    retryCount,
    uploadImages,
    uploadSingleImage,
    validateFile,
  }
}
