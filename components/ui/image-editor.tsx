"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { RotateCcw, RotateCw, Crop, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImageEditorProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
  onSave: (editedImageUrl: string) => void
  aspectRatio?: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageEditor({ imageUrl, isOpen, onClose, onSave, aspectRatio }: ImageEditorProps) {
  const [brightness, setBrightness] = useState([100])
  const [contrast, setContrast] = useState([100])
  const [saturation, setSaturation] = useState([100])
  const [rotation, setRotation] = useState(0)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()

  const applyFilters = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imgRef.current

    if (!canvas || !ctx || !img) return

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    // Apply filters
    ctx.filter = `
      brightness(${brightness[0]}%) 
      contrast(${contrast[0]}%) 
      saturate(${saturation[0]}%)
    `

    // Apply rotation
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()
  }, [brightness, contrast, saturation, rotation])

  const handleRotate = (direction: 'left' | 'right') => {
    const newRotation = direction === 'left' ? rotation - 90 : rotation + 90
    setRotation(newRotation % 360)
  }

  const handleCrop = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imgRef.current

    if (!canvas || !ctx || !img) return

    const cropX = (cropArea.x / 100) * img.naturalWidth
    const cropY = (cropArea.y / 100) * img.naturalHeight
    const cropWidth = (cropArea.width / 100) * img.naturalWidth
    const cropHeight = (cropArea.height / 100) * img.naturalHeight

    // Create new canvas for cropped image
    const croppedCanvas = document.createElement('canvas')
    const croppedCtx = croppedCanvas.getContext('2d')

    if (!croppedCtx) return

    croppedCanvas.width = cropWidth
    croppedCanvas.height = cropHeight

    // Apply filters to cropped area
    croppedCtx.filter = `
      brightness(${brightness[0]}%) 
      contrast(${contrast[0]}%) 
      saturate(${saturation[0]}%)
    `

    croppedCtx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    )

    return croppedCanvas.toDataURL('image/jpeg', 0.9)
  }

  const handleSave = async () => {
    setIsProcessing(true)

    try {
      // Apply all filters and get final image
      applyFilters()
      const canvas = canvasRef.current
      
      if (!canvas) {
        throw new Error('Canvas not available')
      }

      const editedImageUrl = canvas.toDataURL('image/jpeg', 0.9)
      onSave(editedImageUrl)
      onClose()

      toast({
        title: "Image edited successfully",
        description: "Your image has been processed and saved",
      })
    } catch (error) {
      toast({
        title: "Failed to edit image",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setBrightness([100])
    setContrast([100])
    setSaturation([100])
    setRotation(0)
    setCropArea({ x: 0, y: 0, width: 100, height: 100 })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Edit preview"
                className="w-full h-auto"
                style={{
                  filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturation[0]}%)`,
                  transform: `rotate(${rotation}deg)`
                }}
                onLoad={applyFilters}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>

            {/* Rotation Controls */}
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate('left')}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Rotate Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate('right')}
                disabled={isProcessing}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate Right
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Brightness */}
            <div className="space-y-2">
              <Label>Brightness: {brightness[0]}%</Label>
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                min={0}
                max={200}
                step={1}
                disabled={isProcessing}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <Label>Contrast: {contrast[0]}%</Label>
              <Slider
                value={contrast}
                onValueChange={setContrast}
                min={0}
                max={200}
                step={1}
                disabled={isProcessing}
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <Label>Saturation: {saturation[0]}%</Label>
              <Slider
                value={saturation}
                onValueChange={setSaturation}
                min={0}
                max={200}
                step={1}
                disabled={isProcessing}
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isProcessing}
              className="w-full"
            >
              Reset All
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
