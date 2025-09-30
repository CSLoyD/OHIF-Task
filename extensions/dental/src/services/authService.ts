import apiClient from './apiClient';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    licenseNumber?: string;
    practice?: {
      name?: string;
      address?: string;
      phone?: string;
    };
  };
  preferences: {
    theme: 'standard' | 'dental';
    defaultToothSystem: 'FDI' | 'Universal';
    autoSave: boolean;
    notifications: {
      email: boolean;
      browser: boolean;
    };
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    licenseNumber?: string;
  };
  role?: 'dentist' | 'hygienist' | 'assistant' | 'admin';
}

class AuthService {
  private currentUser: User | null = null;
  private authListeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    if (apiClient.isAuthenticated()) {
      try {
        await this.loadCurrentUser();
      } catch (error) {
        console.warn('Failed to load current user:', error);
        this.logout();
      }
    }
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const response = await apiClient.getProfile();
      this.currentUser = response.user;
      this.notifyAuthListeners();
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }

  private notifyAuthListeners(): void {
    this.authListeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.login(credentials.email, credentials.password);
      this.currentUser = response.user;
      this.notifyAuthListeners();
      
      // Apply user preferences
      this.applyUserPreferences();
      
      return this.currentUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await apiClient.register(userData);
      this.currentUser = response.user;
      this.notifyAuthListeners();
      
      // Apply default preferences
      this.applyUserPreferences();
      
      return this.currentUser;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.currentUser = null;
      this.notifyAuthListeners();
      
      // Reset to default theme
      document.body.classList.remove('dental-theme');
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.updateProfile(updates);
      this.currentUser = response.user;
      this.notifyAuthListeners();
      
      // Apply updated preferences
      this.applyUserPreferences();
      
      return this.currentUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.makeRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      // Password change invalidates all tokens, so logout
      await this.logout();
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  private applyUserPreferences(): void {
    if (!this.currentUser) return;

    const { preferences } = this.currentUser;
    
    // Apply theme preference
    if (preferences.theme === 'dental') {
      document.body.classList.add('dental-theme');
    } else {
      document.body.classList.remove('dental-theme');
    }
    
    // Store preferences in localStorage for quick access
    try {
      localStorage.setItem('dental_user_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser && apiClient.isAuthenticated();
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.role);
  }

  getFullName(): string {
    if (!this.currentUser) return 'Unknown User';
    const { firstName, lastName } = this.currentUser.profile;
    return `${firstName} ${lastName}`.trim();
  }

  getPracticeName(): string {
    return this.currentUser?.profile.practice?.name || 'Dental Practice';
  }

  getUserPreferences(): User['preferences'] | null {
    return this.currentUser?.preferences || null;
  }

  onAuthChange(listener: (user: User | null) => void): () => void {
    this.authListeners.push(listener);
    
    // Immediately call with current state
    listener(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  // Utility methods for common auth checks
  requireAuth(): User {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    return this.currentUser!;
  }

  requireRole(role: string): User {
    const user = this.requireAuth();
    if (!this.hasRole(role)) {
      throw new Error(`Role '${role}' required`);
    }
    return user;
  }

  requireAnyRole(roles: string[]): User {
    const user = this.requireAuth();
    if (!this.hasAnyRole(roles)) {
      throw new Error(`One of roles [${roles.join(', ')}] required`);
    }
    return user;
  }

  // Session management
  async refreshSession(): Promise<void> {
    if (!apiClient.isAuthenticated()) {
      throw new Error('No active session to refresh');
    }
    
    try {
      await this.loadCurrentUser();
    } catch (error) {
      console.error('Session refresh failed:', error);
      await this.logout();
      throw error;
    }
  }

  getSessionInfo(): {
    isAuthenticated: boolean;
    user: User | null;
    expiresAt: Date | null;
  } {
    // Note: JWT expiration would need to be decoded from token
    // For now, we'll return basic info
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser,
      expiresAt: null, // Would need JWT decoding
    };
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AuthService };
export type { User, LoginCredentials, RegisterData };
