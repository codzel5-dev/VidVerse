/**
 * AnonMP4 API Client
 *
 * API Documentation: https://anonmp4.to/api-docs
 * Base URL: https://anonmp4api.xyz/
 *
 * Features:
 * - Upload videos up to 20 GB (no auth required)
 * - All major video formats (MP4, AVI, MKV, MOV, etc.)
 * - Get video metadata, streaming URLs, thumbnails
 * - Completely anonymous uploads
 */

export const ANONMP4_API_URL = process.env.ANONMP4_API_URL || 'https://anonmp4api.xyz'
export const ANONMP4_BASE_URL = process.env.ANONMP4_BASE_URL || 'https://anonmp4.to'

export interface AnonMP4UploadResponse {
  success: boolean
  video_id: string
  title: string
  thumbnail: string
  watch_url: string
  embed_url: string
  delete_url: string
  upload_date: string
  message: string
}

export interface AnonMP4VideoInfo {
  success: boolean
  title: string
  duration: string
  watch_url: string
  embed_url: string
  thumbnail: string
  upload_date: string
  privacy_type: string
  status: string
  video_status: string
}

export interface AnonMP4ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

class AnonMP4API {
  private apiUrl: string
  private baseUrl: string

  constructor() {
    this.apiUrl = ANONMP4_API_URL
    this.baseUrl = ANONMP4_BASE_URL
  }

  /**
   * Upload a video file to AnonMP4
   * POST /upload — multipart/form-data
   */
  async uploadVideo(file: Blob, fileName: string): Promise<AnonMP4UploadResponse> {
    const formData = new FormData()
    formData.append('file', file, fileName)

    const response = await fetch(`${this.apiUrl}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null) as AnonMP4ErrorResponse | null
      const errorMessage = errorData?.error?.message || `Upload failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * Get video info/metadata
   * GET /info/{video_id}
   */
  async getVideoInfo(videoId: string): Promise<AnonMP4VideoInfo> {
    const response = await fetch(`${this.apiUrl}/info/${videoId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null) as AnonMP4ErrorResponse | null
      const errorMessage = errorData?.error?.message || `Failed to get video info: ${response.status}`
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * Generate embed URL for a video
   */
  getEmbedUrl(videoId: string): string {
    return `${this.baseUrl}/embed/${videoId}`
  }

  /**
   * Generate watch URL for a video
   */
  getWatchUrl(videoId: string): string {
    return `${this.baseUrl}/v/${videoId}`
  }

  /**
   * Parse duration string (e.g., "09:56" or "1:23:45") to seconds
   */
  parseDuration(durationStr: string): number {
    if (!durationStr) return 0
    const parts = durationStr.split(':').map(Number)
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1]
    }
    return 0
  }
}

export const anonMP4 = new AnonMP4API()
