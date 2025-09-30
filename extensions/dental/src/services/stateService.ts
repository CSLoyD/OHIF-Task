import apiClient from './apiClient';
import authService from './authService';

interface ViewerState {
  viewports: Array<{
    viewportId: string;
    displaySetInstanceUID: string;
    imageIndex: number;
    zoom: number;
    pan: { x: number; y: number };
    rotation: number;
    flip: { horizontal: boolean; vertical: boolean };
    windowLevel: { width: number; center: number };
    colormap?: string;
    invert: boolean;
  }>;
  layout: {
    numRows: number;
    numCols: number;
    activeViewportId: string;
  };
  tools: {
    activeTool: string;
    toolStates: any;
  };
  measurements: Array<{
    id: string;
    toolName: string;
    data: any;
    metadata: {
      tooth?: string;
      category?: string;
      notes?: string;
    };
  }>;
  dental: {
    selectedTooth: {
      system: 'FDI' | 'Universal';
      value: string;
    };
    theme: 'standard' | 'dental';
    hangingProtocol: string;
  };
  metadata?: any;
}

interface SavedState {
  stateId: string;
  version: number;
  sessionId: string;
  autoSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
  state: ViewerState;
}

class StateService {
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private autoSaveDelay: NodeJS.Timeout | null = null;
  private lastSavedState: string | null = null;
  private currentStudyUID: string | null = null;
  private currentSessionId: string | null = null;
  private isAutoSaveEnabled: boolean = true;

  constructor() {
    this.initializeAutoSave();
  }

  private initializeAutoSave(): void {
    // Check user preferences for auto-save
    const preferences = authService.getUserPreferences();
    this.isAutoSaveEnabled = preferences?.autoSave !== false;

    // Set up periodic auto-save (every 30 seconds)
    if (this.isAutoSaveEnabled) {
      this.autoSaveInterval = setInterval(() => {
        this.performAutoSave();
      }, 30000);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async performAutoSave(): Promise<void> {
    if (!this.currentStudyUID || !this.currentSessionId || !authService.isAuthenticated()) {
      return;
    }

    try {
      const currentState = this.getCurrentViewerState();
      if (!currentState) return;

      const stateString = JSON.stringify(currentState);
      
      // Only save if state has changed
      if (stateString === this.lastSavedState) {
        return;
      }

      await apiClient.autoSaveViewerState({
        studyInstanceUID: this.currentStudyUID,
        sessionId: this.currentSessionId,
        state: currentState,
      });

      this.lastSavedState = stateString;
      console.log('Auto-saved viewer state');
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }

  private getCurrentViewerState(): ViewerState | null {
    // This would integrate with OHIF's state management
    // For now, we'll return a mock state structure
    try {
      // In a real implementation, this would extract state from:
      // - ViewportService for viewport configurations
      // - ToolGroupService for tool states
      // - MeasurementService for measurements
      // - CustomizationService for dental-specific state
      
      return {
        viewports: [],
        layout: {
          numRows: 2,
          numCols: 2,
          activeViewportId: 'viewport-1',
        },
        tools: {
          activeTool: 'Length',
          toolStates: {},
        },
        measurements: [],
        dental: {
          selectedTooth: {
            system: 'FDI',
            value: '11',
          },
          theme: 'dental',
          hangingProtocol: '@ohif/hpDental2x2',
        },
      };
    } catch (error) {
      console.error('Failed to get current viewer state:', error);
      return null;
    }
  }

  async initializeForStudy(studyInstanceUID: string): Promise<void> {
    this.currentStudyUID = studyInstanceUID;
    this.currentSessionId = this.generateSessionId();
    this.lastSavedState = null;

    // Try to load existing state
    try {
      const savedState = await this.loadViewerState(studyInstanceUID);
      if (savedState) {
        await this.applyViewerState(savedState.state);
        this.currentSessionId = savedState.sessionId;
        console.log('Loaded saved viewer state');
      }
    } catch (error) {
      console.warn('Failed to load saved state:', error);
    }
  }

  async saveViewerState(studyInstanceUID: string, state?: ViewerState): Promise<SavedState> {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to save state');
    }

    const stateToSave = state || this.getCurrentViewerState();
    if (!stateToSave) {
      throw new Error('No state to save');
    }

    const sessionId = this.currentSessionId || this.generateSessionId();

    try {
      const response = await apiClient.saveViewerState({
        studyInstanceUID,
        sessionId,
        state: stateToSave,
        autoSaved: false,
      });

      this.lastSavedState = JSON.stringify(stateToSave);
      this.currentStudyUID = studyInstanceUID;
      this.currentSessionId = sessionId;

      return {
        stateId: response.stateId,
        version: response.version,
        sessionId,
        autoSaved: false,
        createdAt: new Date(response.timestamp),
        updatedAt: new Date(response.timestamp),
        state: stateToSave,
      };
    } catch (error) {
      console.error('Failed to save viewer state:', error);
      throw error;
    }
  }

  async loadViewerState(studyInstanceUID: string, sessionId?: string): Promise<SavedState | null> {
    if (!authService.isAuthenticated()) {
      return null;
    }

    try {
      const response = await apiClient.getViewerState(studyInstanceUID, sessionId);
      
      return {
        stateId: response.stateId,
        version: response.version,
        sessionId: response.sessionId,
        autoSaved: response.autoSaved,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
        state: response.state,
      };
    } catch (error) {
      if (error.message?.includes('not found')) {
        return null;
      }
      console.error('Failed to load viewer state:', error);
      throw error;
    }
  }

  private async applyViewerState(state: ViewerState): Promise<void> {
    try {
      // This would integrate with OHIF services to apply the state
      // For now, we'll just apply dental-specific state
      
      if (state.dental) {
        // Apply theme
        if (state.dental.theme === 'dental') {
          document.body.classList.add('dental-theme');
        } else {
          document.body.classList.remove('dental-theme');
        }

        // Apply selected tooth (this would integrate with dental measurements manager)
        // setActiveDentalTooth(state.dental.selectedTooth);
      }

      console.log('Applied viewer state');
    } catch (error) {
      console.error('Failed to apply viewer state:', error);
      throw error;
    }
  }

  async getStateHistory(studyInstanceUID: string, limit: number = 10): Promise<Array<Omit<SavedState, 'state'>>> {
    if (!authService.isAuthenticated()) {
      return [];
    }

    try {
      const response = await apiClient.makeRequest(`/viewer-state/history?studyInstanceUID=${studyInstanceUID}&limit=${limit}`);
      
      return response.data.states.map((state: any) => ({
        stateId: state._id,
        version: state.version,
        sessionId: state.sessionId,
        autoSaved: state.autoSaved,
        createdAt: new Date(state.createdAt),
        updatedAt: new Date(state.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to get state history:', error);
      return [];
    }
  }

  async getRecentStudies(limit: number = 10): Promise<Array<{
    studyInstanceUID: string;
    lastAccessed: Date;
    sessionCount: number;
    hasAutoSave: boolean;
  }>> {
    if (!authService.isAuthenticated()) {
      return [];
    }

    try {
      const response = await apiClient.getRecentStudies(limit);
      
      return response.studies.map((study: any) => ({
        studyInstanceUID: study.studyInstanceUID,
        lastAccessed: new Date(study.lastAccessed),
        sessionCount: study.sessionCount,
        hasAutoSave: study.hasAutoSave,
      }));
    } catch (error) {
      console.error('Failed to get recent studies:', error);
      return [];
    }
  }

  // Debounced state change handler
  onStateChange(): void {
    if (!this.isAutoSaveEnabled || !authService.isAuthenticated()) {
      return;
    }

    // Clear existing delay
    if (this.autoSaveDelay) {
      clearTimeout(this.autoSaveDelay);
    }

    // Set new delay (save after 2 seconds of inactivity)
    this.autoSaveDelay = setTimeout(() => {
      this.performAutoSave();
    }, 2000);
  }

  setAutoSaveEnabled(enabled: boolean): void {
    this.isAutoSaveEnabled = enabled;
    
    if (enabled && !this.autoSaveInterval) {
      this.autoSaveInterval = setInterval(() => {
        this.performAutoSave();
      }, 30000);
    } else if (!enabled && this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  isAutoSaveActive(): boolean {
    return this.isAutoSaveEnabled && authService.isAuthenticated();
  }

  getCurrentStudyUID(): string | null {
    return this.currentStudyUID;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    
    if (this.autoSaveDelay) {
      clearTimeout(this.autoSaveDelay);
      this.autoSaveDelay = null;
    }
    
    this.currentStudyUID = null;
    this.currentSessionId = null;
    this.lastSavedState = null;
  }
}

// Create singleton instance
const stateService = new StateService();

export default stateService;
export { StateService };
export type { ViewerState, SavedState };
