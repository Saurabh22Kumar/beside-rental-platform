"use client"

import { AlertCircle, RefreshCw, X, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface UploadError {
  id: string
  fileName: string
  message: string
  type: 'size' | 'format' | 'network' | 'server' | 'unknown'
  retryable: boolean
  timestamp: Date
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'compressing' | 'editing' | 'completed' | 'error'
  retryCount?: number
}

interface EnhancedErrorHandlerProps {
  errors: UploadError[]
  uploads: UploadProgress[]
  onRetry: (errorId: string) => void
  onDismiss: (errorId: string) => void
  onRetryAll: () => void
  onClearAll: () => void
  className?: string
}

export function EnhancedErrorHandler({
  errors,
  uploads,
  onRetry,
  onDismiss,
  onRetryAll,
  onClearAll,
  className
}: EnhancedErrorHandlerProps) {
  const retryableErrors = errors.filter(error => error.retryable)
  const hasActiveUploads = uploads.some(upload => 
    upload.status === 'uploading' || upload.status === 'compressing'
  )

  if (errors.length === 0 && !hasActiveUploads) return null

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Active Uploads Progress */}
        {hasActiveUploads && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-sm">Upload Progress</h4>
            </div>
            {uploads.map((upload, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[200px]">{upload.fileName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      upload.status === 'completed' ? 'default' :
                      upload.status === 'error' ? 'destructive' :
                      'secondary'
                    }>
                      {upload.status}
                    </Badge>
                    {upload.retryCount && upload.retryCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Retry {upload.retryCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={upload.progress} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-sm">Upload Errors ({errors.length})</h4>
              </div>
              <div className="flex gap-2">
                {retryableErrors.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetryAll}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry All
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClearAll}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-red-900 truncate">
                        {error.fileName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {error.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700">{error.message}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {error.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {error.retryable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRetry(error.id)}
                        className="h-7 px-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDismiss(error.id)}
                      className="h-7 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Messages */}
        {uploads.some(upload => upload.status === 'completed') && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-700">
              {uploads.filter(upload => upload.status === 'completed').length} file(s) uploaded successfully
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Error type helpers
export function createUploadError(
  fileName: string,
  message: string,
  type: UploadError['type'] = 'unknown',
  retryable = false
): UploadError {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fileName,
    message,
    type,
    retryable,
    timestamp: new Date()
  }
}

export function getErrorType(error: any): UploadError['type'] {
  if (error.message?.includes('size') || error.message?.includes('large')) {
    return 'size'
  }
  if (error.message?.includes('format') || error.message?.includes('type')) {
    return 'format'
  }
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'network'
  }
  if (error.message?.includes('server') || error.message?.includes('500')) {
    return 'server'
  }
  return 'unknown'
}

export function isRetryableError(type: UploadError['type']): boolean {
  return ['network', 'server'].includes(type)
}
