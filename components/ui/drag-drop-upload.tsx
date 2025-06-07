"use client"

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, Zap, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { compressImages, CompressionOptions } from '@/lib/image-compression'
import { ImageEditor } from './image-editor'

interface DragDropUploadProps {
  onImagesChange: (images: string[]) => void
  maxFiles?: number
  maxSizeInMB?: number
  acceptedTypes?: string[]
  disabled?: boolean
  className?: string
  currentImages?: string[]
  enableCompression?: boolean
  compressionOptions?: CompressionOptions
  enableImageEditing?: boolean
}

export function DragDropUpload({
  onImagesChange,
  maxFiles = 5,
  maxSizeInMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false,
  className,
  currentImages = [],
  enableCompression = true,
  compressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg'
  },
  enableImageEditing = true
}: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use JPEG, PNG, or WebP.`
    }
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File size too large. Maximum size is ${maxSizeInMB}MB.`
    }
    return null
  }

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return

    const fileArray = Array.from(files)
    const remainingSlots = maxFiles - currentImages.length
    
    if (fileArray.length > remainingSlots) {
      toast({
        title: "Too many files",
        description: `You can only upload ${remainingSlots} more image(s). Maximum is ${maxFiles}.`,
        variant: "destructive"
      })
      return
    }

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        toast({
          title: "Invalid file",
          description: error,
          variant: "destructive"
        })
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      let filesToUpload = fileArray

      // Compress images if enabled
      if (enableCompression) {
        setIsCompressing(true)
        toast({
          title: "Compressing images...",
          description: "Optimizing images for faster upload",
        })

        const compressionResults = await compressImages(fileArray, {
          ...compressionOptions,
          maxSizeInMB
        })
        
        filesToUpload = compressionResults.map(result => result.file)
        
        // Show compression stats
        const totalSaved = compressionResults.reduce((acc, result) => 
          acc + (result.originalSize - result.compressedSize), 0
        )
        const avgCompression = Math.round(
          compressionResults.reduce((acc, result) => acc + result.compressionRatio, 0) / 
          compressionResults.length
        )

        if (totalSaved > 0) {
          toast({
            title: "Images compressed",
            description: `Reduced size by ${avgCompression}% (saved ${(totalSaved / 1024 / 1024).toFixed(1)}MB)`,
          })
        }
        
        setIsCompressing(false)
      }

      const formData = new FormData()
      filesToUpload.forEach(file => formData.append('images', file))
      formData.append('folder', 'rental-platform')

      // Simulate progress (since fetch doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      const newImageUrls = result.images.map((img: any) => img.url)
      
      onImagesChange([...currentImages, ...newImageUrls])
      
      toast({
        title: "Upload successful",
        description: `${filesToUpload.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setIsCompressing(false)
      setUploadProgress(0)
    }
  }, [currentImages, maxFiles, maxSizeInMB, acceptedTypes, disabled, onImagesChange, toast, enableCompression, compressionOptions])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const handleRemoveImage = useCallback((index: number) => {
    const newImages = [...currentImages]
    newImages.splice(index, 1)
    onImagesChange(newImages)
  }, [currentImages, onImagesChange])

  const handleEditImage = useCallback((imageUrl: string, index: number) => {
    setEditingImageUrl(imageUrl)
    setEditingImageIndex(index)
  }, [])

  const handleSaveEditedImage = useCallback((editedImageUrl: string) => {
    if (editingImageIndex !== null) {
      const newImages = [...currentImages]
      newImages[editingImageIndex] = editedImageUrl
      onImagesChange(newImages)
    }
    setEditingImageUrl(null)
    setEditingImageIndex(null)
  }, [currentImages, editingImageIndex, onImagesChange])

  const handleCloseEditor = useCallback(() => {
    setEditingImageUrl(null)
    setEditingImageIndex(null)
  }, [])

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragOver && !disabled
            ? "border-primary bg-primary/5 scale-102"
            : "border-muted-foreground/25",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50",
          isUploading && "border-primary bg-primary/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {isUploading || isCompressing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isCompressing ? "Compressing images..." : "Uploading images..."}
              </p>
              {isUploading && !isCompressing && (
                <>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                </>
              )}
              {isCompressing && (
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">Optimizing images for faster upload...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragOver ? (
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <div className="p-4 rounded-full bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragOver ? "Drop images here" : "Drop images or click to upload"}
              </p>
              <p className="text-sm text-muted-foreground">
                Upload up to {maxFiles - currentImages.length} more images (max {maxSizeInMB}MB each)
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
              </p>
            </div>

            {currentImages.length >= maxFiles && (
              <div className="flex items-center justify-center space-x-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Maximum number of images reached</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              
              {!disabled && (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveImage(index)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  {enableImageEditing && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 left-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditImage(image, index)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
              
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  Image {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Editor */}
      {editingImageUrl && (
        <ImageEditor
          imageUrl={editingImageUrl}
          isOpen={!!editingImageUrl}
          onClose={handleCloseEditor}
          onSave={handleSaveEditedImage}
        />
      )}
    </div>
  )
}
