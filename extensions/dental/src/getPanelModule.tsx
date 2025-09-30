import DentalMeasurementsPanel from './components/DentalMeasurementsPanel';
import DentalAnnotationPanel from './components/DentalAnnotationPanel';
import { getActiveDentalTooth } from './dentalMeasurementsManager';

export default function getPanelModule({ servicesManager }: any) {
  const WrappedMeasurementsPanel = () => <DentalMeasurementsPanel />;
  
  const WrappedAnnotationPanel = () => {
    const currentTooth = getActiveDentalTooth();
    const toothLabel = currentTooth ? `${currentTooth.system} ${currentTooth.value}` : 'FDI 11';
    
    return (
      <DentalAnnotationPanel 
        currentTooth={toothLabel}
        onSave={(annotations) => {
          // Save annotations to local storage or backend
          const key = `dental-annotations-${toothLabel.replace(' ', '-')}`;
          localStorage.setItem(key, JSON.stringify(annotations));
        }}
        initialAnnotations={(() => {
          try {
            const key = `dental-annotations-${toothLabel.replace(' ', '-')}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
          } catch {
            return [];
          }
        })()}
      />
    );
  };

  return [
    {
      name: 'dentalMeasurements',
      iconName: 'tab-linear',
      iconLabel: 'Measurements',
      label: 'Dental Measurements',
      component: WrappedMeasurementsPanel,
    },
    {
      name: 'dentalAnnotations',
      iconName: 'tab-annotation',
      iconLabel: 'Annotations',
      label: 'Dental Annotations',
      component: WrappedAnnotationPanel,
    },
  ];
}
