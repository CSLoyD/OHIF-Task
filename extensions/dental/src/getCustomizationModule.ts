import DentalPracticeHeader from './components/DentalPracticeHeader';

export default function getCustomizationModule() {
  return [
    {
      name: 'dental',
      value: {
        'ohif.viewerHeaderComponent': DentalPracticeHeader,
      },
    },
  ];
}
