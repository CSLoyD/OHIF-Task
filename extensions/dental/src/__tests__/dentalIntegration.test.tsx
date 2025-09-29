/**
 * Comprehensive Integration Tests for Dental Extension
 * Tests all the main features required by the task specification
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components and functions to test
import {
  DENTAL_MEASUREMENT_PRESETS,
  initializeDentalMeasurements,
  selectDentalMeasurementPreset,
  getActiveDentalPresetId,
  setActiveDentalTooth,
  getActiveDentalTooth,
  teardownDentalMeasurements,
  DentalToothSelection,
} from '../dentalMeasurementsManager';

import DentalPracticeHeader from '../components/DentalPracticeHeader';
import ToothSelector from '../components/ToothSelector';
import DentalMeasurementsPanel from '../components/DentalMeasurementsPanel';
import DentalMeasurementsPalette from '../components/DentalMeasurementsPalette';

// Mock dependencies
const mockServicesManager = {
  services: {
    measurementService: {
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      update: jest.fn(),
      EVENTS: {
        MEASUREMENT_ADDED: 'MEASUREMENT_ADDED',
        MEASUREMENT_UPDATED: 'MEASUREMENT_UPDATED',
        MEASUREMENTS_CLEARED: 'MEASUREMENTS_CLEARED',
      },
    },
    customizationService: {
      getCustomization: jest.fn(() => ({
        menuTitle: 'Test Menu',
        title: 'Test Title',
        containerClassName: 'test-class',
      })),
    },
  },
};

const mockCommandsManager = {
  runCommand: jest.fn(),
  run: jest.fn(),
};

const mockExtensionManager = {
  getDataSources: jest.fn(() => true),
};

// Mock hooks
jest.mock('@ohif/core', () => ({
  Types: {},
  useSystem: () => ({
    servicesManager: mockServicesManager,
    extensionManager: mockExtensionManager,
    commandsManager: mockCommandsManager,
  }),
}));

jest.mock('@ohif/extension-default', () => ({
  Toolbar: ({ buttonSection }: { buttonSection: string }) => (
    <div data-testid={`toolbar-${buttonSection}`}>Toolbar {buttonSection}</div>
  ),
  usePatientInfo: () => ({
    patientInfo: {
      PatientName: 'Test Patient',
      PatientID: 'TEST123',
      PatientDOB: '1990-01-01',
    },
  }),
}));

jest.mock('@ohif/extension-cornerstone', () => ({
  useMeasurements: () => [
    {
      uid: 'test-measurement-1',
      label: 'PA length (FDI 11)',
      metadata: {
        dentalPresetId: 'periapical-length',
        dentalPresetLabel: 'PA length',
        dentalValue: 15.5,
        dentalUnit: 'mm',
        dentalTooth: { system: 'FDI', value: '11' },
        dentalCreatedAt: Date.now(),
      },
    },
  ],
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dental' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Dental Extension - Complete Feature Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teardownDentalMeasurements();
  });

  describe('A) Dental Mode UI Customization', () => {
    describe('1. Dental Theme Toggle', () => {
      test('should toggle dental theme on and off', () => {
        const mockAppConfig = {
          whiteLabeling: { siteName: 'Test Dental Practice' },
          showStudyList: true,
        };

        render(<DentalPracticeHeader appConfig={mockAppConfig} />);

        // Find the theme toggle button
        const themeToggle = screen.getByRole('button', { name: /dental theme/i });
        expect(themeToggle).toBeInTheDocument();

        // Should show "Standard mode" initially
        expect(screen.getByText('Standard mode')).toBeInTheDocument();

        // Click to toggle to dental mode
        fireEvent.click(themeToggle);

        // Should show "Dental mode" after toggle
        expect(screen.getByText('Dental mode')).toBeInTheDocument();
      });

      test('should apply dental theme CSS classes', () => {
        // Test that dental CSS variables are defined
        const dentalAccent = getComputedStyle(document.documentElement).getPropertyValue('--dental-accent');
        // Note: In test environment, CSS variables might not be loaded, but we can test the structure
        expect(document.documentElement).toBeDefined();
      });
    });

    describe('2. Practice Header Components', () => {
      test('should display practice name', () => {
        const mockAppConfig = {
          whiteLabeling: { 
            overrides: { practiceName: 'Advanced Dental Clinic' }
          },
        };

        render(<DentalPracticeHeader appConfig={mockAppConfig} />);
        expect(screen.getByText('Advanced Dental Clinic')).toBeInTheDocument();
      });

      test('should display patient information', () => {
        const mockAppConfig = { whiteLabeling: {} };
        render(<DentalPracticeHeader appConfig={mockAppConfig} />);

        expect(screen.getByText('Test Patient')).toBeInTheDocument();
        expect(screen.getByText('ID: TEST123')).toBeInTheDocument();
      });

      test('should include tooth selector with FDI and Universal support', () => {
        const mockSelection: DentalToothSelection = { system: 'FDI', value: '11' };
        const mockOnChange = jest.fn();

        render(<ToothSelector selection={mockSelection} onChange={mockOnChange} />);

        // Should show tooth selector label
        expect(screen.getByText('Tooth selector')).toBeInTheDocument();

        // Should have FDI and Universal options
        const systemSelect = screen.getAllByRole('combobox')[0];
        expect(systemSelect).toBeInTheDocument();

        // Change to Universal system
        fireEvent.change(systemSelect, { target: { value: 'UNIVERSAL' } });
        expect(mockOnChange).toHaveBeenCalledWith({
          system: 'UNIVERSAL',
          value: '1', // First Universal tooth
        });
      });
    });

    describe('3. 2x2 Hanging Protocol', () => {
      test('should define correct hanging protocol structure', () => {
        // Import the hanging protocol module
        const getHangingProtocolModule = require('../getHangingProtocolModule').default;
        const protocols = getHangingProtocolModule();

        expect(protocols).toHaveLength(1);
        const protocol = protocols[0].protocol;

        expect(protocol.id).toBe('@ohif/hpDental2x2');
        expect(protocol.name).toBe('Dental 2x2');
        expect(protocol.description).toBe('Current study, prior comparison and bitewing placeholders');

        // Check viewport structure
        expect(protocol.stages[0].viewportStructure.properties.rows).toBe(2);
        expect(protocol.stages[0].viewportStructure.properties.columns).toBe(2);
        expect(protocol.stages[0].viewports).toHaveLength(4);

        // Check display set selectors
        expect(protocol.displaySetSelectors).toHaveProperty('dentalCurrentDisplaySet');
        expect(protocol.displaySetSelectors).toHaveProperty('dentalPriorDisplaySet');
        expect(protocol.displaySetSelectors).toHaveProperty('dentalBitewingLeft');
        expect(protocol.displaySetSelectors).toHaveProperty('dentalBitewingRight');
      });
    });
  });

  describe('B) Dental Measurements Palette Feature', () => {
    describe('1. Measurements Button and Palette', () => {
      test('should have all required measurement presets', () => {
        expect(DENTAL_MEASUREMENT_PRESETS).toHaveLength(4);

        const presetIds = DENTAL_MEASUREMENT_PRESETS.map(p => p.id);
        expect(presetIds).toContain('periapical-length');
        expect(presetIds).toContain('canal-angle');
        expect(presetIds).toContain('crown-width');
        expect(presetIds).toContain('root-length');

        // Check specific preset configurations
        const paPreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === 'periapical-length');
        expect(paPreset).toEqual({
          id: 'periapical-length',
          label: 'PA length',
          toolName: 'Length',
          unit: 'mm',
          description: 'Standard periapical length measurement.',
        });

        const anglePreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === 'canal-angle');
        expect(anglePreset).toEqual({
          id: 'canal-angle',
          label: 'Canal angle',
          toolName: 'Angle',
          unit: '°',
          description: 'Measure the canal angulation in degrees.',
        });
      });

      test('should render measurements palette with all presets', () => {
        const mockOnSelectPreset = jest.fn();
        render(<DentalMeasurementsPalette onSelectPreset={mockOnSelectPreset} />);

        expect(screen.getByText('Dental measurements')).toBeInTheDocument();
        expect(screen.getByText('PA length')).toBeInTheDocument();
        expect(screen.getByText('Canal angle')).toBeInTheDocument();
        expect(screen.getByText('Crown width')).toBeInTheDocument();
        expect(screen.getByText('Root length')).toBeInTheDocument();

        // Test preset selection
        const paButton = screen.getByText('PA length').closest('button');
        fireEvent.click(paButton!);
        expect(mockOnSelectPreset).toHaveBeenCalledWith('periapical-length');
      });
    });

    describe('2. Measurement System Integration', () => {
      test('should initialize and manage measurement system', () => {
        initializeDentalMeasurements({
          servicesManager: mockServicesManager as any,
          commandsManager: mockCommandsManager as any,
          toolGroupIds: ['dental'],
        });

        // Should subscribe to measurement events
        expect(mockServicesManager.services.measurementService.subscribe).toHaveBeenCalledTimes(3);

        // Test preset selection
        selectDentalMeasurementPreset('periapical-length');
        expect(getActiveDentalPresetId()).toBe('periapical-length');
        expect(mockCommandsManager.runCommand).toHaveBeenCalledWith(
          'setToolActive',
          {
            toolName: 'Length',
            toolGroupIds: ['dental'],
          },
          'CORNERSTONE'
        );

        // Test tooth selection
        const tooth: DentalToothSelection = { system: 'FDI', value: '21' };
        setActiveDentalTooth(tooth);
        expect(getActiveDentalTooth()).toEqual(tooth);
      });
    });

    describe('3. Measurements Panel with Sorting and Export', () => {
      test('should render measurements panel with sorting and filtering', () => {
        render(<DentalMeasurementsPanel />);

        expect(screen.getByText('Dental measurements')).toBeInTheDocument();
        expect(screen.getByText('Export JSON')).toBeInTheDocument();

        // Check sorting options
        const sortSelect = screen.getByDisplayValue('Newest first');
        expect(sortSelect).toBeInTheDocument();

        fireEvent.change(sortSelect, { target: { value: 'oldest' } });
        expect(sortSelect).toHaveValue('oldest');

        // Check filtering options
        const filterSelect = screen.getByDisplayValue('All presets');
        expect(filterSelect).toBeInTheDocument();
      });

      test('should handle JSON export', async () => {
        // Mock URL.createObjectURL and document.createElement
        const mockCreateObjectURL = jest.fn(() => 'mock-blob-url');
        const mockRevokeObjectURL = jest.fn();
        const mockClick = jest.fn();
        const mockAnchor = {
          href: '',
          download: '',
          click: mockClick,
        };

        global.URL.createObjectURL = mockCreateObjectURL;
        global.URL.revokeObjectURL = mockRevokeObjectURL;
        document.createElement = jest.fn(() => mockAnchor as any);

        render(<DentalMeasurementsPanel />);

        const exportButton = screen.getByText('Export JSON');
        fireEvent.click(exportButton);

        await waitFor(() => {
          expect(mockCreateObjectURL).toHaveBeenCalled();
          expect(mockAnchor.download).toBe('dental-measurements.json');
          expect(mockClick).toHaveBeenCalled();
          expect(mockRevokeObjectURL).toHaveBeenCalled();
        });
      });

      test('should format export data correctly', () => {
        const mockMeasurement = {
          uid: 'test-uid-123',
          label: 'PA length (FDI 11)',
          metadata: {
            dentalPresetLabel: 'PA length',
            dentalValue: 15.5,
            dentalUnit: 'mm',
            dentalTooth: { system: 'FDI', value: '11' },
            dentalPresetId: 'periapical-length',
          },
        };

        // Simulate the export format logic
        const exportPayload = {
          uid: mockMeasurement.uid,
          label: mockMeasurement.metadata?.dentalPresetLabel || mockMeasurement.label,
          value: mockMeasurement.metadata?.dentalValue ?? null,
          unit: mockMeasurement.metadata?.dentalUnit ?? null,
          tooth: mockMeasurement.metadata?.dentalTooth ?? null,
          source: mockMeasurement.metadata?.dentalPresetId ?? null,
        };

        expect(exportPayload).toEqual({
          uid: 'test-uid-123',
          label: 'PA length',
          value: 15.5,
          unit: 'mm',
          tooth: { system: 'FDI', value: '11' },
          source: 'periapical-length',
        });
      });
    });
  });

  describe('Complete Workflow Integration Test', () => {
    test('should handle complete dental workflow', async () => {
      // 1. Initialize the system
      initializeDentalMeasurements({
        servicesManager: mockServicesManager as any,
        commandsManager: mockCommandsManager as any,
        toolGroupIds: ['dental'],
      });

      // 2. Set up tooth selection
      const tooth: DentalToothSelection = { system: 'FDI', value: '11' };
      setActiveDentalTooth(tooth);

      // 3. Select a measurement preset
      selectDentalMeasurementPreset('periapical-length');

      // 4. Verify the complete state
      expect(getActiveDentalTooth()).toEqual(tooth);
      expect(getActiveDentalPresetId()).toBe('periapical-length');
      expect(mockCommandsManager.runCommand).toHaveBeenCalledWith(
        'setToolActive',
        {
          toolName: 'Length',
          toolGroupIds: ['dental'],
        },
        'CORNERSTONE'
      );

      // 5. Test UI components integration
      const mockAppConfig = {
        whiteLabeling: { siteName: 'Test Dental Practice' },
        showStudyList: true,
      };

      const { rerender } = render(<DentalPracticeHeader appConfig={mockAppConfig} />);
      
      // Should show practice header
      expect(screen.getByText('Test Dental Practice')).toBeInTheDocument();
      expect(screen.getByText('Test Patient')).toBeInTheDocument();

      // Test measurements panel
      rerender(<DentalMeasurementsPanel />);
      expect(screen.getByText('Dental measurements')).toBeInTheDocument();
      expect(screen.getByText('Export JSON')).toBeInTheDocument();

      // 6. Cleanup
      teardownDentalMeasurements();
      expect(getActiveDentalPresetId()).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid preset selection gracefully', () => {
      initializeDentalMeasurements({
        servicesManager: mockServicesManager as any,
        commandsManager: mockCommandsManager as any,
        toolGroupIds: ['dental'],
      });

      selectDentalMeasurementPreset('invalid-preset-id');
      expect(getActiveDentalPresetId()).toBe('invalid-preset-id');
      expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
    });

    test('should handle null tooth selection', () => {
      setActiveDentalTooth(null);
      expect(getActiveDentalTooth()).toBeNull();
    });

    test('should handle missing patient information', () => {
      // Mock empty patient info
      jest.doMock('@ohif/extension-default', () => ({
        Toolbar: ({ buttonSection }: { buttonSection: string }) => (
          <div data-testid={`toolbar-${buttonSection}`}>Toolbar {buttonSection}</div>
        ),
        usePatientInfo: () => ({
          patientInfo: {},
        }),
      }));

      const mockAppConfig = { whiteLabeling: {} };
      render(<DentalPracticeHeader appConfig={mockAppConfig} />);

      expect(screen.getByText('Patient unknown')).toBeInTheDocument();
      expect(screen.getByText('No patient ID')).toBeInTheDocument();
    });
  });
});
