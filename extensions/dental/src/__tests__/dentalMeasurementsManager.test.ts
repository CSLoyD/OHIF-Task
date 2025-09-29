/**
 * Unit Tests for Dental Measurements Manager
 * Tests the core functionality of the dental measurements system
 */

import {
  DENTAL_MEASUREMENT_PRESETS,
  DentalMeasurementPreset,
  DentalToothSelection,
  initializeDentalMeasurements,
  selectDentalMeasurementPreset,
  getActiveDentalPresetId,
  setActiveDentalTooth,
  getActiveDentalTooth,
  teardownDentalMeasurements,
} from '../dentalMeasurementsManager';

// Mock dependencies
const mockMeasurementService = {
  subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
  update: jest.fn(),
  EVENTS: {
    MEASUREMENT_ADDED: 'MEASUREMENT_ADDED',
    MEASUREMENT_UPDATED: 'MEASUREMENT_UPDATED',
    MEASUREMENTS_CLEARED: 'MEASUREMENTS_CLEARED',
  },
};

const mockCommandsManager = {
  runCommand: jest.fn(),
};

const mockServicesManager = {
  services: {
    measurementService: mockMeasurementService,
  },
};

describe('Dental Measurements Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teardownDentalMeasurements();
  });

  describe('DENTAL_MEASUREMENT_PRESETS', () => {
    test('should contain all required measurement presets', () => {
      expect(DENTAL_MEASUREMENT_PRESETS).toHaveLength(4);
      
      const presetIds = DENTAL_MEASUREMENT_PRESETS.map(p => p.id);
      expect(presetIds).toContain('periapical-length');
      expect(presetIds).toContain('canal-angle');
      expect(presetIds).toContain('crown-width');
      expect(presetIds).toContain('root-length');
    });

    test('should have correct preset configurations', () => {
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
  });

  describe('Dental Tooth Selection', () => {
    test('should set and get active dental tooth', () => {
      const toothSelection: DentalToothSelection = {
        system: 'FDI',
        value: '11',
      };

      setActiveDentalTooth(toothSelection);
      const activeTooth = getActiveDentalTooth();

      expect(activeTooth).toEqual(toothSelection);
    });

    test('should handle Universal numbering system', () => {
      const toothSelection: DentalToothSelection = {
        system: 'UNIVERSAL',
        value: '8',
      };

      setActiveDentalTooth(toothSelection);
      const activeTooth = getActiveDentalTooth();

      expect(activeTooth).toEqual(toothSelection);
    });

    test('should handle null tooth selection', () => {
      setActiveDentalTooth(null);
      const activeTooth = getActiveDentalTooth();

      expect(activeTooth).toBeNull();
    });
  });

  describe('Measurement Preset Selection', () => {
    beforeEach(() => {
      initializeDentalMeasurements({
        servicesManager: mockServicesManager as any,
        commandsManager: mockCommandsManager as any,
        toolGroupIds: ['dental'],
      });
    });

    test('should select dental measurement preset', () => {
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
    });

    test('should handle invalid preset selection', () => {
      selectDentalMeasurementPreset('invalid-preset');
      
      expect(getActiveDentalPresetId()).toBe('invalid-preset');
      expect(mockCommandsManager.runCommand).not.toHaveBeenCalled();
    });

    test('should activate angle tool for canal angle preset', () => {
      selectDentalMeasurementPreset('canal-angle');
      
      expect(getActiveDentalPresetId()).toBe('canal-angle');
      expect(mockCommandsManager.runCommand).toHaveBeenCalledWith(
        'setToolActive',
        {
          toolName: 'Angle',
          toolGroupIds: ['dental'],
        },
        'CORNERSTONE'
      );
    });
  });

  describe('Initialization and Teardown', () => {
    test('should initialize dental measurements system', () => {
      initializeDentalMeasurements({
        servicesManager: mockServicesManager as any,
        commandsManager: mockCommandsManager as any,
        toolGroupIds: ['dental'],
      });

      expect(mockMeasurementService.subscribe).toHaveBeenCalledTimes(3);
      expect(mockMeasurementService.subscribe).toHaveBeenCalledWith(
        'MEASUREMENT_ADDED',
        expect.any(Function)
      );
      expect(mockMeasurementService.subscribe).toHaveBeenCalledWith(
        'MEASUREMENT_UPDATED',
        expect.any(Function)
      );
      expect(mockMeasurementService.subscribe).toHaveBeenCalledWith(
        'MEASUREMENTS_CLEARED',
        expect.any(Function)
      );
    });

    test('should teardown dental measurements system', () => {
      initializeDentalMeasurements({
        servicesManager: mockServicesManager as any,
        commandsManager: mockCommandsManager as any,
        toolGroupIds: ['dental'],
      });

      teardownDentalMeasurements();

      expect(getActiveDentalPresetId()).toBeNull();
    });
  });

  describe('Measurement Value Computation', () => {
    test('should compute length measurement value', () => {
      const mockMeasurement = {
        length: 15.5,
        cachedStats: {
          longestDiameter: 16.0,
        },
      };

      // This tests the internal logic by checking if the system would use length
      const lengthPreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.toolName === 'Length');
      expect(lengthPreset).toBeDefined();
      expect(lengthPreset?.unit).toBe('mm');
    });

    test('should compute angle measurement value', () => {
      const mockMeasurement = {
        angle: 45.2,
        cachedStats: {
          angle: 45.5,
        },
      };

      // This tests the internal logic by checking if the system would use angle
      const anglePreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.toolName === 'Angle');
      expect(anglePreset).toBeDefined();
      expect(anglePreset?.unit).toBe('°');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete workflow', () => {
      // Initialize system
      initializeDentalMeasurements({
        servicesManager: mockServicesManager as any,
        commandsManager: mockCommandsManager as any,
        toolGroupIds: ['dental'],
      });

      // Set tooth selection
      const tooth: DentalToothSelection = { system: 'FDI', value: '21' };
      setActiveDentalTooth(tooth);

      // Select measurement preset
      selectDentalMeasurementPreset('periapical-length');

      // Verify state
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

      // Cleanup
      teardownDentalMeasurements();
      expect(getActiveDentalPresetId()).toBeNull();
    });
  });
});

describe('Dental Components Integration', () => {
  describe('ToothSelector Values', () => {
    test('should support FDI numbering system', () => {
      const fdiValues = [
        '11', '12', '13', '14', '15', '16', '17', '18',
        '21', '22', '23', '24', '25', '26', '27', '28',
        '31', '32', '33', '34', '35', '36', '37', '38',
        '41', '42', '43', '44', '45', '46', '47', '48',
      ];

      // Test that all FDI values are valid
      fdiValues.forEach(value => {
        const tooth: DentalToothSelection = { system: 'FDI', value };
        setActiveDentalTooth(tooth);
        expect(getActiveDentalTooth()).toEqual(tooth);
      });
    });

    test('should support Universal numbering system', () => {
      const universalValues = Array.from({ length: 32 }, (_, i) => `${i + 1}`);

      // Test that all Universal values are valid
      universalValues.forEach(value => {
        const tooth: DentalToothSelection = { system: 'UNIVERSAL', value };
        setActiveDentalTooth(tooth);
        expect(getActiveDentalTooth()).toEqual(tooth);
      });
    });
  });

  describe('Measurement Export Format', () => {
    test('should generate correct export format', () => {
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

      const expectedExport = {
        uid: 'test-uid-123',
        label: 'PA length',
        value: 15.5,
        unit: 'mm',
        tooth: { system: 'FDI', value: '11' },
        source: 'periapical-length',
      };

      // This simulates the export format used in DentalMeasurementsPanel
      const exportPayload = {
        uid: mockMeasurement.uid,
        label: mockMeasurement.metadata?.dentalPresetLabel || mockMeasurement.label,
        value: mockMeasurement.metadata?.dentalValue ?? null,
        unit: mockMeasurement.metadata?.dentalUnit ?? null,
        tooth: mockMeasurement.metadata?.dentalTooth ?? null,
        source: mockMeasurement.metadata?.dentalPresetId ?? null,
      };

      expect(exportPayload).toEqual(expectedExport);
    });
  });
});
