interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(baseURL: string = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    try {
      this.accessToken = localStorage.getItem('dental_access_token');
      this.refreshToken = localStorage.getItem('dental_refresh_token');
    } catch (error) {
      console.warn('Failed to load tokens from storage:', error);
    }
  }

  private saveTokensToStorage(tokens: AuthTokens): void {
    try {
      localStorage.setItem('dental_access_token', tokens.accessToken);
      localStorage.setItem('dental_refresh_token', tokens.refreshToken);
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
    } catch (error) {
      console.warn('Failed to save tokens to storage:', error);
    }
  }

  private clearTokensFromStorage(): void {
    try {
      localStorage.removeItem('dental_access_token');
      localStorage.removeItem('dental_refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.warn('Failed to clear tokens from storage:', error);
    }
  }

  private async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.makeRequest<{ tokens: AuthTokens }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(response => {
      const tokens = response.data!.tokens;
      this.saveTokensToStorage(tokens);
      this.refreshPromise = null;
      return tokens;
    }).catch(error => {
      this.refreshPromise = null;
      this.clearTokensFromStorage();
      throw error;
    });

    return this.refreshPromise;
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken && !options.headers?.['Authorization']) {
      defaultHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && data.error?.includes('expired') && this.refreshToken) {
          try {
            await this.refreshAccessToken();
            // Retry the original request with new token
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${this.accessToken}`,
            };
            const retryResponse = await fetch(url, config);
            const retryData = await retryResponse.json();
            
            if (!retryResponse.ok) {
              throw new Error(retryData.error || 'Request failed after token refresh');
            }
            
            return { data: retryData };
          } catch (refreshError) {
            this.clearTokensFromStorage();
            throw new Error('Authentication failed. Please log in again.');
          }
        }

        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return { data };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<any> {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.tokens) {
      this.saveTokensToStorage(response.data.tokens);
    }

    return response.data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    profile: {
      firstName: string;
      lastName: string;
      licenseNumber?: string;
    };
    role?: string;
  }): Promise<any> {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data?.tokens) {
      this.saveTokensToStorage(response.data.tokens);
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokensFromStorage();
    }
  }

  async getProfile(): Promise<any> {
    const response = await this.makeRequest('/auth/profile');
    return response.data;
  }

  async updateProfile(updates: any): Promise<any> {
    const response = await this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  // Viewer state methods
  async saveViewerState(stateData: {
    studyInstanceUID: string;
    sessionId: string;
    state: any;
    autoSaved?: boolean;
  }): Promise<any> {
    const response = await this.makeRequest('/viewer-state/save', {
      method: 'POST',
      body: JSON.stringify(stateData),
    });
    return response.data;
  }

  async getViewerState(studyInstanceUID: string, sessionId?: string): Promise<any> {
    const params = new URLSearchParams({ studyInstanceUID });
    if (sessionId) {
      params.append('sessionId', sessionId);
    }

    const response = await this.makeRequest(`/viewer-state?${params.toString()}`);
    return response.data;
  }

  async autoSaveViewerState(stateData: {
    studyInstanceUID: string;
    sessionId: string;
    state: any;
  }): Promise<any> {
    const response = await this.makeRequest('/viewer-state/auto-save', {
      method: 'POST',
      body: JSON.stringify(stateData),
    });
    return response.data;
  }

  async getRecentStudies(limit: number = 10): Promise<any> {
    const response = await this.makeRequest(`/viewer-state/recent-studies?limit=${limit}`);
    return response.data;
  }

  // Annotation methods
  async createAnnotation(annotationData: {
    studyInstanceUID: string;
    seriesInstanceUID?: string;
    sopInstanceUID?: string;
    tooth: { system: string; value: string };
    category: string;
    content: { text: string };
    metadata?: any;
    priority?: string;
    tags?: string[];
    isPrivate?: boolean;
  }, audioFile?: File): Promise<any> {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(annotationData).forEach(([key, value]) => {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    // Add audio file if provided
    if (audioFile) {
      formData.append('audio', audioFile);
    }

    const response = await this.makeRequest('/annotations', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    return response.data;
  }

  async getAnnotations(filters: {
    studyInstanceUID?: string;
    toothSystem?: string;
    toothValue?: string;
    category?: string;
    status?: string;
    priority?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await this.makeRequest(`/annotations?${params.toString()}`);
    return response.data;
  }

  async getAnnotationsByTooth(
    system: string,
    value: string,
    studyInstanceUID?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    if (studyInstanceUID) {
      params.append('studyInstanceUID', studyInstanceUID);
    }

    const response = await this.makeRequest(
      `/annotations/tooth/${system}/${value}?${params.toString()}`
    );
    return response.data;
  }

  async updateAnnotation(id: string, updates: any): Promise<any> {
    const response = await this.makeRequest(`/annotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async deleteAnnotation(id: string): Promise<any> {
    const response = await this.makeRequest(`/annotations/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async getAnnotationStats(studyInstanceUID: string): Promise<any> {
    const response = await this.makeRequest(`/annotations/stats/${studyInstanceUID}`);
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };
export type { ApiResponse, AuthTokens };
