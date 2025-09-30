import i18n from 'i18next';
import toolbarButtons from './toolbarButtons';
import initToolGroups from './initToolGroups';
import { id } from './id';
import { initializeDentalMeasurements, teardownDentalMeasurements } from '@ohif/extension-dental';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const dental = {
  measurementsPanel: '@ohif/extension-dental.panelModule.dentalMeasurements',
  annotationsPanel: '@ohif/extension-dental.panelModule.dentalAnnotations',
};

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  '@ohif/extension-dental': '^0.1.0',
};

function modeFactory() {
  return {
    id,
    routeName: 'dental',
    displayName: i18n.t('Modes:Dental Viewer'),
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }: any) => {
      const { toolbarService, toolGroupService, customizationService, measurementService } =
        servicesManager.services;

      measurementService.clearMeasurements();
      initToolGroups(extensionManager, toolGroupService);

      // Initialize dental measurements manager
      const toolGroupIds = toolGroupService.getToolGroupIds() || [];
      initializeDentalMeasurements({
        servicesManager,
        commandsManager,
        toolGroupIds: [...toolGroupIds, 'dental'],
      });

      customizationService.setCustomizations([
        '@ohif/extension-dental.customizationModule.dental',
      ]);

      toolbarService.register(toolbarButtons);
      toolbarService.updateSection(toolbarService.sections.primary, [
        'DentalMeasurements',
        'MeasurementTools',
        'Pan',
        'Zoom',
        'WindowLevel',
        'Layout',
        'Capture',
        'Reset',
      ]);
      toolbarService.updateSection('MeasurementTools', ['Length', 'Angle']);
    },
    onModeExit: ({ servicesManager }: any) => {
      const { toolGroupService, uiDialogService, uiModalService } = servicesManager.services;
      
      // Teardown dental measurements manager
      teardownDentalMeasurements();
      
      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
    },
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: () => ({ valid: true, description: '' }),
    routes: [
      {
        path: 'dental',
        init: ({ servicesManager, studyInstanceUIDs }) => {
          // If no studies are loaded, redirect to worklist
          if (!studyInstanceUIDs || studyInstanceUIDs.length === 0) {
            // Use setTimeout to avoid navigation during render
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
            return;
          }
        },
        layoutTemplate: ({ location, servicesManager, studyInstanceUIDs }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [ohif.thumbnailList],
              leftPanelResizable: true,
              rightPanels: [dental.measurementsPanel, dental.annotationsPanel],
              rightPanelResizable: true,
              rightPanelInitialExpandedWidth: 340,
              viewports: [
                { namespace: cornerstone.viewport, displaySetsToDisplay: [ohif.sopClassHandler] },
                { namespace: cornerstone.viewport, displaySetsToDisplay: [ohif.sopClassHandler] },
                { namespace: cornerstone.viewport, displaySetsToDisplay: [ohif.sopClassHandler] },
                { namespace: cornerstone.viewport, displaySetsToDisplay: [ohif.sopClassHandler] },
              ],
            },
          };
        },
      },
    ],
    extensions: extensionDependencies,
    hangingProtocol: '@ohif/hpDental2x2',
    sopClassHandlers: [ohif.sopClassHandler],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
