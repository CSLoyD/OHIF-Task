# OHIF Dental Extension

A specialized dental imaging extension for the OHIF Viewer that provides dental-specific workflows, measurements, and UI customizations.

## 🦷 Features

### Dental Theme Toggle
- **Custom Color Scheme**: Cyan accent colors (`#7fdff5`) optimized for dental imaging
- **Typography**: Poppins font family for better readability
- **Dark Theme**: Specialized dark background optimized for medical imaging
- **Toggle Button**: Easy switching between standard and dental themes

### Practice Header
- **Practice Name Display**: Customizable practice/clinic name
- **Patient Information**: Patient name, ID, and date of birth
- **Tooth Selector**: Support for both FDI and Universal numbering systems
- **Undo/Redo Actions**: Quick access to measurement corrections
- **Settings Menu**: Access to preferences and about information

### 2x2 Hanging Protocol
- **Top-left**: Current study images
- **Top-right**: Prior exam comparison (same modality)
- **Bottom-left**: Bitewing placeholder (left side)
- **Bottom-right**: Bitewing placeholder (right side)

### Dental Measurements Palette
- **One-click Presets**: Pre-configured measurement tools for dental use
- **Auto-labeling**: Measurements automatically labeled with tooth information
- **Standardized Units**: Consistent measurement units (mm for length, ° for angles)

#### Available Measurement Presets:
1. **Periapical Length (PA length)** - `mm`
   - Uses distance tool for root length measurements
   - Auto-labeled as "PA length (FDI 11)" format

2. **Canal Angle** - `°`
   - Uses angle tool for canal angulation measurements
   - Auto-labeled as "Canal angle (FDI 11)" format

3. **Crown Width** - `mm`
   - Uses distance tool for buccolingual crown measurements
   - Auto-labeled as "Crown width (FDI 11)" format

4. **Root Length** - `mm`
   - Uses distance tool for root apex to CEJ measurements
   - Auto-labeled as "Root length (FDI 11)" format

### Measurements Panel
- **Measurement List**: All dental measurements with labels and values
- **Sorting Options**: Sort by newest, oldest, label, or value
- **Filtering**: Filter by measurement preset type
- **JSON Export**: Download all measurements in structured JSON format

## 🚀 Getting Started

### Prerequisites
- OHIF Viewer v3.12.0 or later
- Node.js 18+ 
- Yarn or npm

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Test-Task
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Build the dental extension**:
   ```bash
   cd extensions/dental
   yarn build
   # or
   npm run build
   ```

### Running the Application

1. **Start the development server**:
   ```bash
   # From the root directory
   yarn dev
   # or
   npm run dev
   ```

2. **Access the dental mode**:
   - Open your browser to `http://localhost:3000`
   - Navigate to a study with the dental mode URL parameter:
     ```
     http://localhost:3000/dental?StudyInstanceUIDs=<your-study-uid>
     ```

## 📖 How to Use

### Activating Dental Mode

1. **Load a Study**: Open OHIF with a DICOM study
2. **Switch to Dental Mode**: Add `/dental` to the URL or use the mode selector
3. **Enable Dental Theme**: Click the 🦷 toggle button in the header

### Using the Tooth Selector

1. **Select Numbering System**: Choose between FDI or Universal
2. **Select Tooth**: Pick the specific tooth number from the dropdown
3. **All measurements** will be automatically labeled with the selected tooth

### Making Measurements

#### Method 1: Using the Measurements Palette
1. **Click "Measurements"** button in the toolbar
2. **Select a preset** from the palette (e.g., "PA length")
3. **The appropriate tool activates** automatically
4. **Draw your measurement** on the image
5. **Measurement is auto-labeled** with preset name and tooth info

#### Method 2: Using Individual Tools
1. **Click Length or Angle** tools in the toolbar
2. **Draw your measurement** on the image
3. **If a preset is active**, measurement will be auto-labeled

### Managing Measurements

1. **View All Measurements**: Check the right panel "Dental Measurements"
2. **Sort Measurements**: Use the sort dropdown (newest, oldest, label, value)
3. **Filter by Type**: Use the preset filter to show specific measurement types
4. **Export Data**: Click "Export JSON" to download all measurements

### Exported JSON Format

```json
[
  {
    "uid": "measurement-uid-123",
    "label": "PA length",
    "value": 15.5,
    "unit": "mm",
    "tooth": {
      "system": "FDI",
      "value": "11"
    },
    "source": "periapical-length"
  }
]
```

## 🧪 Testing

### Running Unit Tests

```bash
# Navigate to dental extension directory
cd extensions/dental

# Install test dependencies
yarn install

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```

### Test Coverage

The test suite covers:
- ✅ Measurement preset configurations
- ✅ Tooth selection (FDI and Universal systems)
- ✅ Measurement value computation
- ✅ System initialization and teardown
- ✅ Integration workflows
- ✅ Export format validation

## 🛠️ Development

### Project Structure

```
extensions/dental/
├── src/
│   ├── components/
│   │   ├── DentalPracticeHeader.tsx    # Custom header component
│   │   ├── DentalMeasurementsPanel.tsx # Measurements list panel
│   │   ├── DentalMeasurementsPalette.tsx # Measurement presets palette
│   │   └── ToothSelector.tsx           # Tooth numbering selector
│   ├── dentalMeasurementsManager.ts    # Core measurement logic
│   ├── getCommandsModule.tsx           # Command definitions
│   ├── getCustomizationModule.ts       # UI customizations
│   ├── getHangingProtocolModule.ts     # 2x2 layout protocol
│   ├── getPanelModule.tsx              # Panel registrations
│   ├── init.ts                         # Extension initialization
│   ├── index.ts                        # Main extension export
│   └── __tests__/                      # Unit tests
├── jest.config.js                      # Jest configuration
├── package.json                        # Dependencies and scripts
└── README.md                           # This file
```

### Adding New Measurement Presets

1. **Edit `dentalMeasurementsManager.ts`**:
   ```typescript
   export const DENTAL_MEASUREMENT_PRESETS: DentalMeasurementPreset[] = [
     // ... existing presets
     {
       id: 'new-measurement',
       label: 'New Measurement',
       toolName: 'Length', // or 'Angle'
       unit: 'mm',
       description: 'Description of the new measurement',
     },
   ];
   ```

2. **Add corresponding tests** in `__tests__/dentalMeasurementsManager.test.ts`

3. **Update the palette UI** if needed in `DentalMeasurementsPalette.tsx`

### Customizing the Theme

Edit `platform/app/src/App.css` to modify dental theme colors:

```css
:root {
  --dental-accent: #7fdff5;           /* Main accent color */
  --dental-accent-rgb: 127, 223, 245; /* RGB values for transparency */
  --dental-muted: rgba(255, 255, 255, 0.65); /* Muted text */
  --dental-surface: rgba(12, 24, 40, 0.92);  /* Surface background */
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Measurements button not showing**:
   - Ensure you're in dental mode (`/dental` in URL)
   - Check that the extension is properly registered

2. **Theme not applying**:
   - Click the 🦷 toggle button in the header
   - Check browser console for CSS loading errors

3. **Tooth selector not working**:
   - Verify the component is receiving proper props
   - Check that the numbering system data is loaded

4. **Export not working**:
   - Ensure there are measurements to export
   - Check browser's download permissions

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'ohif:*');
```

## 📝 License

This extension is part of the OHIF project and follows the same MIT license.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [OHIF Documentation](https://docs.ohif.org/)
- Open an issue in the repository
- Join the OHIF community discussions
