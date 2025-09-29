import { Types } from '@ohif/core';

import { id } from './id';
import init from './init';
import getPanelModule from './getPanelModule';
import getCustomizationModule from './getCustomizationModule';
import getCommandsModule from './getCommandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';

const dentalExtension: Types.Extensions.Extension = {
  id,
  preRegistration: init,
  getPanelModule,
  getCustomizationModule,
  getCommandsModule,
  getHangingProtocolModule,
};

export default dentalExtension;
export { id };
export { initializeDentalMeasurements, teardownDentalMeasurements } from './dentalMeasurementsManager';
