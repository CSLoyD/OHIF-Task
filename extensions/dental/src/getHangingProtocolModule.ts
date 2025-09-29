import { Types } from '@ohif/core';

const currentDisplaySetId = 'dentalCurrentDisplaySet';
const priorDisplaySetId = 'dentalPriorDisplaySet';
const bitewingLeftDisplaySetId = 'dentalBitewingLeft';
const bitewingRightDisplaySetId = 'dentalBitewingRight';

const stackViewport = (displaySetId: string, options: Record<string, unknown> = {}) => ({
  viewportOptions: {
    viewportType: 'stack',
    toolGroupId: 'dental',
    allowUnmatchedView: true,
    ...options,
  },
  displaySets: [
    {
      id: displaySetId,
      matchedDisplaySetsIndex: -1,
    },
  ],
});

const dentalProtocol: Types.HangingProtocol.Protocol = {
  id: '@ohif/hpDental2x2',
  name: 'Dental 2x2',
  description: 'Current study, prior comparison and bitewing placeholders',
  numberOfPriorsReferenced: 1,
  protocolMatchingRules: [
    {
      id: 'HasPrior',
      weight: 1000,
      attribute: 'StudyInstanceUID',
      from: 'prior',
      required: false,
      constraint: {
        notNull: true,
      },
    },
  ],
  toolGroupIds: ['dental'],
  displaySetSelectors: {
    [currentDisplaySetId]: {
      studyMatchingRules: [
        {
          attribute: 'studyInstanceUIDsIndex',
          from: 'options',
          required: true,
          constraint: {
            equals: { value: 0 },
          },
        },
      ],
      seriesMatchingRules: [
        {
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
        },
      ],
    },
    [priorDisplaySetId]: {
      studyMatchingRules: [
        {
          attribute: 'studyInstanceUIDsIndex',
          from: 'options',
          required: true,
          constraint: {
            equals: { value: 1 },
          },
        },
      ],
      seriesMatchingRules: [
        {
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
        },
      ],
    },
    [bitewingLeftDisplaySetId]: {
      seriesMatchingRules: [
        {
          attribute: 'SeriesDescription',
          constraint: {
            contains: { value: 'Bitewing' },
          },
        },
      ],
    },
    [bitewingRightDisplaySetId]: {
      seriesMatchingRules: [
        {
          attribute: 'SeriesDescription',
          constraint: {
            contains: { value: 'Bitewing' },
          },
        },
      ],
    },
  },
  defaultViewport: stackViewport(currentDisplaySetId),
  stages: [
    {
      name: 'Dental',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
        },
      },
      viewports: [
        stackViewport(currentDisplaySetId, { viewportId: 'dental-current' }),
        stackViewport(priorDisplaySetId, { viewportId: 'dental-prior' }),
        stackViewport(bitewingLeftDisplaySetId, {
          viewportId: 'dental-bitewing-left',
        }),
        stackViewport(bitewingRightDisplaySetId, {
          viewportId: 'dental-bitewing-right',
        }),
      ],
    },
  ],
};

export default function getHangingProtocolModule() {
  return [
    {
      name: dentalProtocol.id,
      protocol: dentalProtocol,
    },
  ];
}
