const createDentalToolGroup = (extensionManager, toolGroupService) => {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
      },
    ],
    passive: [
      { toolName: toolNames.Length },
      { toolName: toolNames.Angle },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.ArrowAnnotate },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.CircleROI },
    ],
    enabled: [{ toolName: toolNames.ImageOverlayViewer }],
  };

  toolGroupService.createToolGroupAndAddTools('dental', tools);
};

export default function initToolGroups(extensionManager, toolGroupService) {
  createDentalToolGroup(extensionManager, toolGroupService);
}
