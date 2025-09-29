import React, { useMemo } from 'react';
import type { DentalToothSelection, DentalNumberingSystem } from '../dentalMeasurementsManager';

const FDI_VALUES = [
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
];

const UNIVERSAL_VALUES = Array.from({ length: 32 }).map((_, index) => `${index + 1}`);

const numberingSystems: Record<DentalNumberingSystem, string[]> = {
  FDI: FDI_VALUES,
  UNIVERSAL: UNIVERSAL_VALUES,
};

type ToothSelectorProps = {
  selection: DentalToothSelection;
  onChange: (selection: DentalToothSelection) => void;
};

const ToothSelector: React.FC<ToothSelectorProps> = ({ selection, onChange }) => {
  const options = useMemo(() => numberingSystems[selection.system], [selection.system]);

  return (
    <div className="dental-tooth-selector">
      <span className="text-xs uppercase tracking-wide text-dental-muted">Tooth selector</span>
      <div className="dental-tooth-selector-controls">
        <select
          value={selection.system}
          onChange={event =>
            onChange({
              system: event.target.value as DentalNumberingSystem,
              value: numberingSystems[event.target.value as DentalNumberingSystem][0],
            })
          }
          className="dental-select"
        >
          <option value="FDI">FDI</option>
          <option value="UNIVERSAL">Universal</option>
        </select>
        <select
          value={selection.value}
          onChange={event =>
            onChange({
              ...selection,
              value: event.target.value,
            })
          }
          className="dental-select"
        >
          {options.map(value => (
            <option
              key={value}
              value={value}
            >
              {value}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ToothSelector;
