import DentalMeasurementsPalette from './components/DentalMeasurementsPalette';
import { selectDentalMeasurementPreset } from './dentalMeasurementsManager';

export default function getCommandsModule({ servicesManager }: any) {
  const { uiModalService } = servicesManager.services;

  const actions = {
    openDentalMeasurementsPalette: () => {
      if (!uiModalService) {
        console.error('uiModalService not available');
        return;
      }

      uiModalService.show({
        content: DentalMeasurementsPalette,
        contentProps: {
          onSelectPreset: (presetId: string) =>
            actions.selectDentalMeasurementPreset({ presetId }),
        },
        title: 'Dental Measurements',
        containerClassName: 'max-w-2xl',
        shouldCloseOnEsc: true,
        shouldCloseOnOverlayClick: true,
      });
    },
    selectDentalMeasurementPreset: ({ presetId }: { presetId: string }) => {
      selectDentalMeasurementPreset(presetId);
      uiModalService?.hide();
    },
  };

  const definitions = {
    openDentalMeasurementsPalette: {
      commandFn: actions.openDentalMeasurementsPalette,
    },
    selectDentalMeasurementPreset: {
      commandFn: actions.selectDentalMeasurementPreset,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DENTAL',
  };
}
