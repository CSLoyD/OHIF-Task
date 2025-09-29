import type { CommandsManager, ServicesManager } from '@ohif/core';
import { utils } from '@ohif/core';

export type DentalNumberingSystem = 'FDI' | 'UNIVERSAL';

export type DentalToothSelection = {
  system: DentalNumberingSystem;
  value: string;
};

export type DentalMeasurementPreset = {
  id: string;
  label: string;
  toolName: string;
  unit: string;
  description: string;
  icon?: string;
  valueAccessor?: (measurement: any) => number | undefined;
};

const { uuidv4 } = utils;

export const DENTAL_MEASUREMENT_PRESETS: DentalMeasurementPreset[] = [
  {
    id: 'periapical-length',
    label: 'PA length',
    toolName: 'Length',
    unit: 'mm',
    description: 'Standard periapical length measurement.',
  },
  {
    id: 'canal-angle',
    label: 'Canal angle',
    toolName: 'Angle',
    unit: '°',
    description: 'Measure the canal angulation in degrees.',
  },
  {
    id: 'crown-width',
    label: 'Crown width',
    toolName: 'Length',
    unit: 'mm',
    description: 'Buccolingual crown width measurement.',
  },
  {
    id: 'root-length',
    label: 'Root length',
    toolName: 'Length',
    unit: 'mm',
    description: 'Root apex to CEJ linear measurement.',
  },
];

type IntegrationContext = {
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
  toolGroupIds: string[];
};

let integration: IntegrationContext | null = null;
let activePresetId: string | null = null;
let activeTooth: DentalToothSelection | null = null;
let subscriptions: Array<() => void> = [];
let lastInitializationId: string | null = null;

const getMeasurementService = () => integration?.servicesManager?.services?.measurementService;

const measurementHasDentalMetadata = measurement =>
  Boolean(measurement?.metadata?.dentalPresetId || measurement?.metadata?.dentalPresetLabel);

const computeMeasurementValue = (preset: DentalMeasurementPreset, measurement: any) => {
  if (!measurement) {
    return undefined;
  }

  if (preset.valueAccessor) {
    return preset.valueAccessor(measurement);
  }

  // Extract value from the data object structure
  if (measurement?.data) {
    // Find the first data entry (there should be one per imageId)
    const dataEntries = Object.values(measurement.data);
    if (dataEntries.length > 0) {
      const dataEntry = dataEntries[0] as any;
      
      if (preset.toolName === 'Angle' || preset.unit === '°') {
        return dataEntry?.angle ?? dataEntry?.value;
      }
      
      // For length measurements, use the length property
      return dataEntry?.length ?? dataEntry?.value;
    }
  }

  // Fallback to cached stats or other properties
  const stats = measurement?.cachedStats || measurement?.metadata?.cachedStats;

  if (preset.toolName === 'Angle' || preset.unit === '°') {
    return measurement?.angle ?? stats?.angle ?? stats?.mean;
  }

  return (
    measurement?.length ??
    stats?.longestDiameter ??
    stats?.length ??
    stats?.maxDiameter ??
    measurement?.metadata?.length
  );
};

const metadataChanged = (currentMetadata = {}, nextMetadata = {}) => {
  const keysToCompare = [
    'dentalPresetId',
    'dentalPresetLabel',
    'dentalUnit',
    'dentalValue',
  ];

  for (const key of keysToCompare) {
    if (currentMetadata?.[key] !== nextMetadata?.[key]) {
      return true;
    }
  }

  const currentTooth = (currentMetadata as any)?.dentalTooth ?? null;
  const nextTooth = (nextMetadata as any)?.dentalTooth ?? null;

  if (currentTooth?.system !== nextTooth?.system || currentTooth?.value !== nextTooth?.value) {
    return true;
  }

  return false;
};

const applyDentalMetadata = (measurement: any, preset?: DentalMeasurementPreset) => {
  if (!measurement) {
    return;
  }

  const measurementService = getMeasurementService();

  if (!measurementService) {
    return;
  }

  const presetToApply = preset || DENTAL_MEASUREMENT_PRESETS.find(p => {
    const presetId = measurement?.metadata?.dentalPresetId;
    return presetId ? p.id === presetId : p.id === activePresetId;
  });

  if (!presetToApply) {
    return;
  }

  const nextMetadata = {
    ...(measurement.metadata || {}),
    dentalPresetId: presetToApply.id,
    dentalPresetLabel: presetToApply.label,
    dentalUnit: presetToApply.unit,
    dentalValue: computeMeasurementValue(presetToApply, measurement),
    dentalCreatedAt: measurement?.metadata?.dentalCreatedAt ?? Date.now(),
  };

  if (!nextMetadata.dentalTooth && activeTooth) {
    nextMetadata.dentalTooth = activeTooth;
  }

  const labelSuffix = nextMetadata.dentalTooth
    ? `${presetToApply.label} (${nextMetadata.dentalTooth.system} ${nextMetadata.dentalTooth.value})`
    : presetToApply.label;

  if (!metadataChanged(measurement.metadata, nextMetadata) && measurement.label === labelSuffix) {
    return;
  }

  measurementService.update(
    measurement.uid,
    {
      ...measurement,
      label: labelSuffix,
      metadata: nextMetadata,
    },
    true
  );
};

const handleMeasurementAdded = ({ measurement }) => {
  if (!measurement) {
    return;
  }

  if (activePresetId) {
    const preset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === activePresetId);
    applyDentalMetadata(measurement, preset);
  } else if (measurementHasDentalMetadata(measurement)) {
    applyDentalMetadata(measurement);
  }
};

const handleMeasurementUpdated = ({ measurement }) => {
  if (!measurementHasDentalMetadata(measurement)) {
    return;
  }

  const presetId = measurement.metadata?.dentalPresetId;
  const preset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === presetId);
  applyDentalMetadata(measurement, preset);
};

const clearSubscriptions = () => {
  subscriptions.forEach(unsub => {
    try {
      unsub?.();
    } catch (error) {
      console.warn('Failed to clear dental measurement subscription', error);
    }
  });
  subscriptions = [];
};

export const initializeDentalMeasurements = ({
  servicesManager,
  commandsManager,
  toolGroupIds,
}: IntegrationContext) => {
  const measurementService = servicesManager?.services?.measurementService;
  if (!measurementService || !commandsManager) {
    return;
  }

  integration = {
    servicesManager,
    commandsManager,
    toolGroupIds,
  };

  clearSubscriptions();

  const uniqueListenerId = `dental-measurements-${uuidv4()}`;
  lastInitializationId = uniqueListenerId;

  const addedSubscription = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_ADDED,
    handleMeasurementAdded
  );
  const updatedSubscription = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_UPDATED,
    handleMeasurementUpdated
  );
  const clearedSubscription = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENTS_CLEARED,
    () => {
      if (lastInitializationId !== uniqueListenerId) {
        return;
      }
      activePresetId = null;
    }
  );

  subscriptions = [
    addedSubscription.unsubscribe,
    updatedSubscription.unsubscribe,
    clearedSubscription.unsubscribe,
  ];
};

export const teardownDentalMeasurements = () => {
  clearSubscriptions();
  integration = null;
  activePresetId = null;
};

export const selectDentalMeasurementPreset = (presetId: string) => {
  activePresetId = presetId;
  const preset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === presetId);
  if (!preset || !integration) {
    return;
  }

  const { commandsManager, toolGroupIds } = integration;
  commandsManager.runCommand(
    'setToolActive',
    {
      toolName: preset.toolName,
      toolGroupIds,
    },
    'CORNERSTONE'
  );
};

export const getActiveDentalPresetId = () => activePresetId;

export const setActiveDentalTooth = (selection: DentalToothSelection | null) => {
  activeTooth = selection;
};

export const getActiveDentalTooth = () => activeTooth;

// Function to retroactively apply dental metadata to measurements that look like dental measurements
export const enhanceExistingMeasurements = () => {
  const measurementService = getMeasurementService();
  if (!measurementService) {
    return;
  }

  const allMeasurements = measurementService.getMeasurements();
  
  allMeasurements.forEach(measurement => {
    // Skip if already has dental metadata
    if (measurementHasDentalMetadata(measurement)) {
      return;
    }

    // Check if this looks like a dental measurement based on label
    const label = measurement?.label || '';
    let matchedPreset: DentalMeasurementPreset | null = null;

    // Try to match label to preset
    if (/PA length/i.test(label)) {
      matchedPreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === 'periapical-length') || null;
    } else if (/Canal angle/i.test(label)) {
      matchedPreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === 'canal-angle') || null;
    } else if (/Crown width/i.test(label)) {
      matchedPreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === 'crown-width') || null;
    } else if (/Root length/i.test(label)) {
      matchedPreset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === 'root-length') || null;
    }

    if (matchedPreset) {
      // Extract tooth information from label if present
      let toothInfo: DentalToothSelection | null = null;
      const fdiMatch = label.match(/\(FDI (\d+)\)/i);
      const universalMatch = label.match(/\(Universal (\d+)\)/i);
      const palmerMatch = label.match(/\(Palmer ([A-Z]\d+)\)/i);

      if (fdiMatch) {
        toothInfo = { system: 'FDI', value: fdiMatch[1] };
      } else if (universalMatch) {
        toothInfo = { system: 'UNIVERSAL', value: universalMatch[1] };
      }

      // Apply dental metadata
      const nextMetadata = {
        ...(measurement.metadata || {}),
        dentalPresetId: matchedPreset.id,
        dentalPresetLabel: matchedPreset.label,
        dentalUnit: matchedPreset.unit,
        dentalValue: computeMeasurementValue(matchedPreset, measurement),
        dentalCreatedAt: measurement?.metadata?.dentalCreatedAt ?? Date.now(),
      };

      if (toothInfo) {
        nextMetadata.dentalTooth = toothInfo;
      }

      measurementService.update(
        measurement.uid,
        {
          ...measurement,
          metadata: nextMetadata,
        },
        true
      );
    }
  });
};
