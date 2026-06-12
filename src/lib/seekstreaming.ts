export const SEEKSTREAMING_API_URL = 'https://seekstreaming.com'
export const SEEKSTREAMING_TOKEN = '0cb3add5ab77cf8c3f1d1dcf'
export const SEEKSTREAMING_TUS_URL = 'https://sic.up-seekstreaming.com/upload/'
export const SEEKSTREAMING_TUS_ACCESS_TOKEN = 'MnhSMEQzd0Ezdm1xNmZOTXltVjVqZG1DTGZLSW1kVzhWNUhVNy9zVkt3PT06MG5LMUZwZlYvS0JlODIwRzRpOVQ0Zz09'

export interface SeekStreamingVideo {
  id: string
  name: string
  poster: string
  subtitle: number
  impression: number
  play: number
  premiumPlay: number
  download: number
  premiumDownload: number
  size: number
  duration: number
  width: number
  height: number
  resolution: string
  bitrate: number
  framerate: number
  codec: string
  audioBitrate: number
  audioChannels: number
  audioSampleRate: number
  audioCodec: string
  status: string
  updatedAt: string
  createdAt: string
}

export interface SeekStreamingUploadInfo {
  tusUrl: string
  accessToken: string
}

export interface SeekStreamingPlayer {
  id: string
  domain: string
  logo: string
  isPremium: boolean
  allowDownload: boolean
  isDefault: boolean
  impression: number
  play: number
  premiumPlay: number
  download: number
  premiumDownload: number
  configuration: any
  status: string
  updatedAt: string
  createdAt: string
}

class SeekStreamingAPI {
  private token: string
  private baseUrl: string

  constructor() {
    this.token = SEEKSTREAMING_TOKEN
    this.baseUrl = SEEKSTREAMING_API_URL
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SeekStreaming API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async getUploadEndpoint(): Promise<SeekStreamingUploadInfo> {
    return this.request('/api/v1/video/upload')
  }

  async getVideoList(params?: { page?: number; perPage?: number; status?: string; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.perPage) searchParams.set('perPage', String(params.perPage))
    if (params?.status) searchParams.set('status', params.status)
    if (params?.search) searchParams.set('search', params.search)
    
    const query = searchParams.toString()
    return this.request(`/api/v1/video/manage${query ? `?${query}` : ''}`)
  }

  async getVideoDetail(videoId: string): Promise<SeekStreamingVideo> {
    return this.request(`/api/v1/video/manage/${videoId}`)
  }

  async deleteVideo(videoId: string) {
    return this.request(`/api/v1/video/manage/${videoId}`, { method: 'DELETE' })
  }

  async renameVideo(videoId: string, name: string) {
    return this.request(`/api/v1/video/manage/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
  }

  async getVideoFiles(videoId: string) {
    return this.request(`/api/v1/video/manage/${videoId}/files`)
  }

  async createPlayer(domain: string) {
    return this.request('/api/v1/video/player', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    })
  }

  async getPlayerList(params?: { page?: number; perPage?: number; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.perPage) searchParams.set('perPage', String(params.perPage))
    if (params?.search) searchParams.set('search', params.search)
    
    const query = searchParams.toString()
    return this.request(`/api/v1/video/player${query ? `?${query}` : ''}`)
  }

  async getPlayerDetail(playerId: string): Promise<SeekStreamingPlayer> {
    return this.request(`/api/v1/video/player/${playerId}`)
  }

  async getVideoSummary() {
    return this.request('/api/v1/video')
  }

  async getFolderList() {
    return this.request('/api/v1/video/folder')
  }

  async createFolder(name: string, description?: string, parentId?: string) {
    return this.request('/api/v1/video/folder', {
      method: 'POST',
      body: JSON.stringify({ name, description, parentId }),
    })
  }

  async getVideoRealtime() {
    return this.request('/api/v1/video/realtime')
  }

  async getVideoReport(params?: { from?: string; to?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    const query = searchParams.toString()
    return this.request(`/api/v1/video/report${query ? `?${query}` : ''}`)
  }

  async getVideoRevenue(params?: { from?: string; to?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    const query = searchParams.toString()
    return this.request(`/api/v1/video/revenue${query ? `?${query}` : ''}`)
  }

  // Generate embed URL for a video
  getEmbedUrl(videoId: string): string {
    return `${this.baseUrl}/embed/${videoId}`
  }

  // Get player embed URL
  getPlayerEmbedUrl(playerId: string, videoId: string): string {
    return `${this.baseUrl}/p/${playerId}/${videoId}`
  }

  async createAdvanceUpload(url: string, name?: string) {
    return this.request('/api/v1/video/advance-upload', {
      method: 'POST',
      body: JSON.stringify({ url, name }),
    })
  }

  async getAdvanceUploadDetail(taskId: string) {
    return this.request(`/api/v1/video/advance-upload/${taskId}`)
  }
}

export const seekStreaming = new SeekStreamingAPI()
