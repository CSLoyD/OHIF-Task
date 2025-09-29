import DentalMeasurementsPanel from './components/DentalMeasurementsPanel';

export default function getPanelModule({ servicesManager }: any) {
  const WrappedPanel = () => <DentalMeasurementsPanel />;

  return [
    {
      name: 'dentalMeasurements',
      iconName: 'tab-linear',
      iconLabel: 'Dental',
      label: 'Dental Measurements',
      component: WrappedPanel,
    },
  ];
}
