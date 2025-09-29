import React, { useMemo, useState, useEffect } from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useMeasurements } from '@ohif/extension-cornerstone';
import {
  DENTAL_MEASUREMENT_PRESETS,
  DentalMeasurementPreset,
  enhanceExistingMeasurements,
} from '../dentalMeasurementsManager';

const presetLookup: Record<string, DentalMeasurementPreset> = DENTAL_MEASUREMENT_PRESETS.reduce(
  (acc, preset) => ({
    ...acc,
    [preset.id]: preset,
  }),
  {}
);

const DentalMeasurementsPanel: React.FC = () => {
  const [presetFilter, setPresetFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'label' | 'value'>('newest');

  const measurements = useMeasurements({
    measurementFilter: measurement => {
      // Show measurements with dental metadata
      if (measurement?.metadata?.dentalPresetId) {
        return true;
      }
      
      // Also show measurements that look like dental measurements based on label patterns
      const label = measurement?.label || '';
      const dentalPatterns = [
        /PA length/i,
        /Canal angle/i, 
        /Crown width/i,
        /Root length/i,
        /\(FDI \d+\)/i,  // FDI notation
        /\(Universal \d+\)/i  // Universal notation
      ];
      
      return dentalPatterns.some(pattern => pattern.test(label));
    },
  });

  // Automatically enhance existing measurements when component mounts
  useEffect(() => {
    enhanceExistingMeasurements();
  }, []);

  // Re-enhance measurements when measurements change (to catch new ones)
  useEffect(() => {
    if (measurements.length > 0) {
      enhanceExistingMeasurements();
    }
  }, [measurements.length]);

  const filteredMeasurements = useMemo(() => {
    if (presetFilter === 'all') {
      return measurements;
    }

    return measurements.filter(measurement => {
      // First check if measurement has dentalPresetId
      if (measurement?.metadata?.dentalPresetId === presetFilter) {
        return true;
      }

      // For measurements without dentalPresetId, try to infer from label
      const label = measurement?.label || '';
      const preset = DENTAL_MEASUREMENT_PRESETS.find(p => p.id === presetFilter);
      
      if (preset) {
        // Check if label contains the preset label
        const presetLabelRegex = new RegExp(preset.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return presetLabelRegex.test(label);
      }

      return false;
    });
  }, [measurements, presetFilter]);

  const sortedMeasurements = useMemo(() => {
    const items = [...filteredMeasurements];
    return items.sort((a, b) => {
      const aMeta = a.metadata || {};
      const bMeta = b.metadata || {};
      switch (sortOrder) {
        case 'oldest':
          return (aMeta.dentalCreatedAt || 0) - (bMeta.dentalCreatedAt || 0);
        case 'label':
          return (a.label || '').localeCompare(b.label || '');
        case 'value':
          return (aMeta.dentalValue || 0) - (bMeta.dentalValue || 0);
        case 'newest':
        default:
          return (bMeta.dentalCreatedAt || 0) - (aMeta.dentalCreatedAt || 0);
      }
    });
  }, [filteredMeasurements, sortOrder]);

  const handleExport = () => {
    const exportPayload = sortedMeasurements.map(measurement => ({
      uid: measurement.uid,
      label: measurement.metadata?.dentalPresetLabel || measurement.label,
      value: measurement.metadata?.dentalValue ?? null,
      unit: measurement.metadata?.dentalUnit ?? null,
      tooth: measurement.metadata?.dentalTooth ?? null,
      source: measurement.metadata?.dentalPresetId ?? null,
    }));

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dental-measurements.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-black/60 text-white">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-dental-accent">Dental measurements</h3>
            <p className="text-xs text-dental-muted">Auto-labelled annotations with one-click presets.</p>
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => enhanceExistingMeasurements()}
              className="dental-outline-button p-2"
              title="Refresh and enhance measurements"
            >
              <Icons.Refresh className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleExport}
              className="dental-outline-button px-3 py-2 text-xs"
            >
              <Icons.Download className="mr-1 h-3 w-3" />
              Export
            </Button>
          </div>
        </div>
      </div>
      <div className="border-b border-white/10 px-4 py-3">
        <div className="grid grid-cols-2 gap-3 text-xs text-white">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-dental-muted">Preset</span>
            <select
              value={presetFilter}
              onChange={event => setPresetFilter(event.target.value)}
              className="dental-select"
            >
              <option value="all">All presets</option>
              {DENTAL_MEASUREMENT_PRESETS.map(preset => (
                <option
                  key={preset.id}
                  value={preset.id}
                >
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-dental-muted">Sort</span>
            <select
              value={sortOrder}
              onChange={event => setSortOrder(event.target.value as typeof sortOrder)}
              className="dental-select"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="label">Label (A-Z)</option>
              <option value="value">Value</option>
            </select>
          </label>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sortedMeasurements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-dental-accent/10 flex items-center justify-center mb-4">
              <Icons.ToolLength className="w-8 h-8 text-dental-accent/50" />
            </div>
            <div className="text-sm text-white mb-2">No measurements found</div>
            <div className="text-xs text-dental-muted max-w-48">
              Start by choosing a preset from the Measurements palette, then create measurements on your images.
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedMeasurements.map(measurement => {
              const metadata = measurement.metadata || {};
              const preset = metadata.dentalPresetId ? presetLookup[metadata.dentalPresetId] : null;
              const value = metadata.dentalValue;
              return (
                <li
                  key={measurement.uid}
                  className="dental-panel-item rounded-lg p-3 bg-black/20 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {metadata.dentalPresetLabel || measurement.label || 'Unnamed measurement'}
                      </div>
                      <div className="text-xs text-dental-muted">
                        {metadata.dentalTooth
                          ? `${metadata.dentalTooth.system} ${metadata.dentalTooth.value}`
                          : 'No tooth selected'}
                      </div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <div className="text-lg font-bold text-dental-accent">
                        {value != null ? value.toFixed(1) : '--'}
                      </div>
                      <div className="text-xs text-dental-muted">
                        {preset?.unit || metadata.dentalUnit || 'mm'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-dental-muted/60 truncate">
                    {measurement.uid}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DentalMeasurementsPanel;
