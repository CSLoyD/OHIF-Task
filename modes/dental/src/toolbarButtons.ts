import type { Button } from '@ohif/core/types';

export const setToolActiveToolbar = {
  commandName: 'setToolActive',
  commandOptions: {
    toolGroupIds: ['dental'],
  },
  context: 'CORNERSTONE',
};

const toolbarButtons: Button[] = [
  { id: 'MeasurementTools', uiType: 'ohif.toolButtonList', props: { buttonSection: true } },
  { id: 'DentalUtilities', uiType: 'ohif.toolButtonList', props: { buttonSection: true } },
  {
    id: 'DentalMeasurements',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tab-linear',
      label: 'Measurements',
      tooltip: 'Open dental measurement palette',
      commands: {
        commandName: 'openDentalMeasurementsPalette',
        context: 'DENTAL',
      },
    },
  },
  {
    id: 'Length',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Length',
      tooltip: 'Periapical length tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Length',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Angle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: 'Angle',
      tooltip: 'Canal angle tool',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Angle',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      tooltip: 'Pan',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Pan',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      tooltip: 'Zoom',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Zoom',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'WindowLevel',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-window-level',
      label: 'Window/Level',
      tooltip: 'Window/Level',
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'WindowLevel',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      tooltip: 'Capture viewport',
      commands: 'showDownloadViewportModal',
      evaluate: [
        'evaluate.action',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video', 'wholeSlide'],
        },
      ],
    },
  },
  {
    id: 'Layout',
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 2,
      columns: 2,
      evaluate: 'evaluate.action',
      commands: 'setViewportGridLayout',
    },
  },
  {
    id: 'Reset',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-reset',
      label: 'Reset',
      tooltip: 'Reset view',
      commands: 'resetViewport',
    },
  },
];

export default toolbarButtons;
