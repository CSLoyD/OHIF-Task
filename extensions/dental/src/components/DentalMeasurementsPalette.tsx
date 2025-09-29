import React from 'react';
import { Button, Icons, DialogTitle, DialogDescription } from '@ohif/ui-next';
import {
  DENTAL_MEASUREMENT_PRESETS,
  getActiveDentalPresetId,
  getActiveDentalTooth,
} from '../dentalMeasurementsManager';

type DentalMeasurementsPaletteProps = {
  onSelectPreset: (presetId: string) => void;
};

const DentalMeasurementsPalette: React.FC<DentalMeasurementsPaletteProps> = ({ onSelectPreset }) => {
  const activePresetId = getActiveDentalPresetId();
  const activeTooth = getActiveDentalTooth();

  return (
    <>
      {/* Accessibility Title - Hidden but accessible to screen readers */}
      <DialogTitle className="sr-only">Dental Measurements Palette</DialogTitle>
      <DialogDescription className="sr-only">
        Choose a dental measurement preset to activate the corresponding tool and create standardized measurements.
      </DialogDescription>
      
      <div className="min-w-[480px] max-w-[600px] rounded-lg p-6 text-white" style={{ backgroundColor: 'rgba(12, 24, 40, 0.95)' }}>
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-wide mb-3" style={{ color: '#7fdff5' }}>
            Dental measurements
          </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
          Choose a preset to activate the corresponding tool. Measurements will be auto-labelled and
          exported with standardized metadata.
        </p>
        <div 
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{ backgroundColor: 'rgba(127, 223, 245, 0.1)', color: '#7fdff5', border: '1px solid rgba(127, 223, 245, 0.2)' }}
        >
          Active tooth: {activeTooth ? `${activeTooth.system} ${activeTooth.value}` : 'Not selected'}
        </div>
      </div>

      {/* Presets Section */}
      <div className="space-y-3">
        {DENTAL_MEASUREMENT_PRESETS.map(preset => {
          const isActive = preset.id === activePresetId;
          return (
            <Button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className="w-full p-0 h-auto"
              style={{
                border: isActive ? '2px solid #7fdff5' : '1px solid rgba(127, 223, 245, 0.25)',
                backgroundColor: isActive ? 'rgba(127, 223, 245, 0.08)' : 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 0 1px rgba(127, 223, 245, 0.3)' : 'none',
              }}
            >
              <div className="flex items-center w-full p-4">
                {/* Icon */}
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: isActive ? 'rgba(127, 223, 245, 0.25)' : 'rgba(127, 223, 245, 0.15)', 
                    color: '#7fdff5' 
                  }}
                >
                  <Icons.ToolLength className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1 ml-4 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">
                        {preset.label}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {preset.description}
                      </p>
                    </div>
                    
                    {/* Unit Badge */}
                    <div 
                      className="ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex-shrink-0"
                      style={{ 
                        backgroundColor: 'rgba(127, 223, 245, 0.2)', 
                        color: '#7fdff5',
                        border: '1px solid rgba(127, 223, 245, 0.3)'
                      }}
                    >
                      {preset.unit}
                    </div>
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
    </>
  );
};

export default DentalMeasurementsPalette;
