"use client"

/**
 * Enhanced image compression utilities with performance optimizations
 * Provides client-side image compression, resizing, and batch processing
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maxSizeInMB?: number
  enableWebP?: boolean
  preserveMetadata?: boolean
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  metadata?: ImageMetadata
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  hasAlpha: boolean
}

export interface BatchCompressionProgress {
  completed: number
  total: number
  currentFile: string
}

// Performance optimization: Check browser capabilities
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('webp') !== -1
})()

const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined'

/**
 * Compress an image file
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maxSizeInMB = 2,
    enableWebP = supportsWebP,
    preserveMetadata = false
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        )

        canvas.width = newWidth
        canvas.height = newHeight

        if (!ctx) {
          throw new Error('Could not get canvas context')
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            const compressedFile = new File(
              [blob], 
              file.name, 
              { 
                type: `image/${format}`,
                lastModified: Date.now()
              }
            )

            const originalSize = file.size
            const compressedSize = compressedFile.size
            
            // Check if compressed file meets size requirements
            if (compressedSize > maxSizeInMB * 1024 * 1024) {
              // Try with lower quality if still too large
              const lowerQuality = Math.max(0.1, quality - 0.2)
              if (lowerQuality !== quality) {
                compressImage(file, { ...options, quality: lowerQuality })
                  .then(resolve)
                  .catch(reject)
                return
              }
            }

            // Extract metadata if required
            let metadata: ImageMetadata | undefined
            if (preserveMetadata) {
              metadata = {
                width: img.width,
                height: img.height,
                format: file.type,
                hasAlpha: compressedFile.type === 'image/png' || compressedFile.type === 'image/webp'
              }
            }

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              compressionRatio: Math.round(((originalSize - compressedSize) / originalSize) * 100),
              metadata
            })
          },
          `image/${format}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (progress: BatchCompressionProgress) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []
  
  const totalFiles = files.length
  let completedFiles = 0

  for (const file of files) {
    try {
      const result = await compressImage(file, options)
      results.push(result)
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error)
      // Return original file if compression fails
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      })
    } finally {
      completedFiles++
      if (onProgress) {
        onProgress({
          completed: completedFiles,
          total: totalFiles,
          currentFile: file.name
        })
      }
    }
  }
  
  return results
}

/**
 * Get image dimensions without loading full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Convert image to different format
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'jpeg' | 'png' | 'webp',
  quality: number = 0.8
): Promise<File> {
  const result = await compressImage(file, {
    format: targetFormat,
    quality,
    maxWidth: 9999, // Don't resize, just convert
    maxHeight: 9999
  })
  
  return result.file
}
