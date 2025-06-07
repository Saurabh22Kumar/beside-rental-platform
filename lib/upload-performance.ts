"use client"

/**
 * Performance monitoring utilities for image upload system
 * Tracks metrics, analyzes performance, and provides insights
 */

export interface UploadMetrics {
  uploadId: string
  fileName: string
  originalSize: number
  compressedSize: number
  uploadTime: number
  compressionTime: number
  networkTime: number
  totalTime: number
  success: boolean
  errorType?: string
  retryCount: number
  compressionRatio: number
  userAgent: string
  timestamp: Date
}

export interface PerformanceStats {
  totalUploads: number
  successRate: number
  averageUploadTime: number
  averageCompressionRatio: number
  averageFileSize: number
  commonErrors: { [key: string]: number }
  browserStats: { [key: string]: number }
}

class UploadPerformanceMonitor {
  private metrics: UploadMetrics[] = []
  private maxMetrics = 1000 // Keep last 1000 uploads

  startUpload(fileName: string, originalSize: number): string {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const metric: Partial<UploadMetrics> = {
      uploadId,
      fileName,
      originalSize,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      retryCount: 0
    }

    // Store partial metric with start time
    sessionStorage.setItem(`upload_start_${uploadId}`, JSON.stringify({
      ...metric,
      startTime: performance.now()
    }))

    return uploadId
  }

  recordCompression(
    uploadId: string, 
    compressedSize: number, 
    compressionTime: number
  ): void {
    const startData = sessionStorage.getItem(`upload_start_${uploadId}`)
    if (startData) {
      const data = JSON.parse(startData)
      sessionStorage.setItem(`upload_start_${uploadId}`, JSON.stringify({
        ...data,
        compressedSize,
        compressionTime,
        compressionRatio: data.originalSize / compressedSize
      }))
    }
  }

  recordRetry(uploadId: string): void {
    const startData = sessionStorage.getItem(`upload_start_${uploadId}`)
    if (startData) {
      const data = JSON.parse(startData)
      sessionStorage.setItem(`upload_start_${uploadId}`, JSON.stringify({
        ...data,
        retryCount: (data.retryCount || 0) + 1
      }))
    }
  }

  endUpload(
    uploadId: string, 
    success: boolean, 
    uploadTime: number,
    errorType?: string
  ): void {
    const startData = sessionStorage.getItem(`upload_start_${uploadId}`)
    if (!startData) return

    const data = JSON.parse(startData)
    const endTime = performance.now()
    const totalTime = endTime - data.startTime

    const finalMetric: UploadMetrics = {
      uploadId: data.uploadId,
      fileName: data.fileName,
      originalSize: data.originalSize,
      compressedSize: data.compressedSize || data.originalSize,
      uploadTime,
      compressionTime: data.compressionTime || 0,
      networkTime: uploadTime,
      totalTime,
      success,
      errorType,
      retryCount: data.retryCount || 0,
      compressionRatio: data.compressionRatio || 1,
      userAgent: data.userAgent,
      timestamp: new Date(data.timestamp)
    }

    this.addMetric(finalMetric)
    sessionStorage.removeItem(`upload_start_${uploadId}`)
  }

  private addMetric(metric: UploadMetrics): void {
    this.metrics.push(metric)
    
    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Store in localStorage for persistence
    localStorage.setItem('upload_metrics', JSON.stringify(this.metrics))
  }

  getStats(): PerformanceStats {
    const successfulUploads = this.metrics.filter(m => m.success)
    const failedUploads = this.metrics.filter(m => !m.success)

    const stats: PerformanceStats = {
      totalUploads: this.metrics.length,
      successRate: this.metrics.length > 0 ? (successfulUploads.length / this.metrics.length) * 100 : 0,
      averageUploadTime: successfulUploads.length > 0 
        ? successfulUploads.reduce((sum, m) => sum + m.totalTime, 0) / successfulUploads.length 
        : 0,
      averageCompressionRatio: successfulUploads.length > 0
        ? successfulUploads.reduce((sum, m) => sum + m.compressionRatio, 0) / successfulUploads.length
        : 1,
      averageFileSize: this.metrics.length > 0
        ? this.metrics.reduce((sum, m) => sum + m.originalSize, 0) / this.metrics.length
        : 0,
      commonErrors: {},
      browserStats: {}
    }

    // Calculate common errors
    failedUploads.forEach(upload => {
      if (upload.errorType) {
        stats.commonErrors[upload.errorType] = (stats.commonErrors[upload.errorType] || 0) + 1
      }
    })

    // Calculate browser stats
    this.metrics.forEach(metric => {
      const browser = this.getBrowserFromUserAgent(metric.userAgent)
      stats.browserStats[browser] = (stats.browserStats[browser] || 0) + 1
    })

    return stats
  }

  private getBrowserFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }

  getRecentMetrics(limit = 50): UploadMetrics[] {
    return this.metrics.slice(-limit)
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2)
  }

  importMetrics(data: string): void {
    try {
      const imported = JSON.parse(data) as UploadMetrics[]
      this.metrics = imported
      localStorage.setItem('upload_metrics', JSON.stringify(this.metrics))
    } catch (error) {
      console.error('Failed to import metrics:', error)
    }
  }

  clearMetrics(): void {
    this.metrics = []
    localStorage.removeItem('upload_metrics')
    // Clear any pending uploads
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('upload_start_')) {
        sessionStorage.removeItem(key)
      }
    })
  }

  loadMetricsFromStorage(): void {
    try {
      const stored = localStorage.getItem('upload_metrics')
      if (stored) {
        this.metrics = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load metrics from storage:', error)
      this.metrics = []
    }
  }

  // Performance insights
  getPerformanceInsights(): {
    slowUploads: UploadMetrics[]
    highFailureFiles: string[]
    compressionEfficiency: 'good' | 'average' | 'poor'
    recommendations: string[]
  } {
    const slowThreshold = 10000 // 10 seconds
    const slowUploads = this.metrics.filter(m => m.totalTime > slowThreshold)
    
    // Find files with high failure rates
    const fileFailures: { [fileName: string]: { total: number, failures: number } } = {}
    this.metrics.forEach(metric => {
      if (!fileFailures[metric.fileName]) {
        fileFailures[metric.fileName] = { total: 0, failures: 0 }
      }
      fileFailures[metric.fileName].total++
      if (!metric.success) {
        fileFailures[metric.fileName].failures++
      }
    })

    const highFailureFiles = Object.entries(fileFailures)
      .filter(([, stats]) => stats.total > 1 && stats.failures / stats.total > 0.5)
      .map(([fileName]) => fileName)

    const stats = this.getStats()
    const compressionEfficiency = 
      stats.averageCompressionRatio > 2 ? 'good' :
      stats.averageCompressionRatio > 1.5 ? 'average' : 'poor'

    const recommendations: string[] = []
    if (stats.successRate < 95) {
      recommendations.push('Consider improving error handling and retry logic')
    }
    if (stats.averageUploadTime > 8000) {
      recommendations.push('Upload times are high - consider increasing compression')
    }
    if (compressionEfficiency === 'poor') {
      recommendations.push('Compression ratio is low - review compression settings')
    }
    if (slowUploads.length > stats.totalUploads * 0.1) {
      recommendations.push('Many slow uploads detected - check network optimization')
    }

    return {
      slowUploads,
      highFailureFiles,
      compressionEfficiency,
      recommendations
    }
  }
}

// Global instance
export const uploadMonitor = new UploadPerformanceMonitor()

// Initialize on load
if (typeof window !== 'undefined') {
  uploadMonitor.loadMetricsFromStorage()
}

// Helper hook for React components
export function useUploadMonitoring() {
  return {
    startUpload: uploadMonitor.startUpload.bind(uploadMonitor),
    recordCompression: uploadMonitor.recordCompression.bind(uploadMonitor),
    recordRetry: uploadMonitor.recordRetry.bind(uploadMonitor),
    endUpload: uploadMonitor.endUpload.bind(uploadMonitor),
    getStats: uploadMonitor.getStats.bind(uploadMonitor),
    getInsights: uploadMonitor.getPerformanceInsights.bind(uploadMonitor),
    clearMetrics: uploadMonitor.clearMetrics.bind(uploadMonitor)
  }
}
