import type { CommandsManager, ServicesManager } from '@ohif/core';
import {
  initializeDentalMeasurements,
  teardownDentalMeasurements,
} from './dentalMeasurementsManager';

export default function init({
  servicesManager,
  commandsManager,
}: {
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
}): void {
  const { toolGroupService } = servicesManager.services;
  const existing = toolGroupService?.getToolGroupIds?.() || [];
  const toolGroupIds = Array.from(new Set([...existing, 'dental', 'default']));

  initializeDentalMeasurements({
    servicesManager,
    commandsManager,
    toolGroupIds,
  });
}

export function onDentalModeExit(): void {
  teardownDentalMeasurements();
}
