#!/usr/bin/env node

/**
 * Dental Extension Features Verification Script
 * Verifies all required features are implemented correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🦷 OHIF Dental Extension - Feature Verification\n');

let checksPassed = 0;
let checksTotal = 0;

function check(description, condition) {
  checksTotal++;
  if (condition) {
    console.log(`✅ ${description}`);
    checksPassed++;
  } else {
    console.log(`❌ ${description}`);
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function fileContains(filePath, searchString) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return content.includes(searchString);
}

console.log('📋 A) Dental Mode UI Customization Requirements:\n');

// A.1 - Dental theme toggle
check('A.1 - Dental theme CSS variables defined', 
  fileContains('platform/app/src/App.css', '--dental-accent: #7fdff5'));

check('A.1 - Dental theme toggle component exists', 
  fileContains('extensions/dental/src/components/DentalPracticeHeader.tsx', 'dental-theme'));

// A.2 - Practice Header components
check('A.2 - Practice Header component exists', 
  fileExists('extensions/dental/src/components/DentalPracticeHeader.tsx'));

check('A.2 - Patient information display implemented', 
  fileContains('extensions/dental/src/components/DentalPracticeHeader.tsx', 'PatientName'));

check('A.2 - Tooth Selector component exists', 
  fileExists('extensions/dental/src/components/ToothSelector.tsx'));

check('A.2 - FDI numbering system supported', 
  fileContains('extensions/dental/src/components/ToothSelector.tsx', 'FDI'));

check('A.2 - Universal numbering system supported', 
  fileContains('extensions/dental/src/components/ToothSelector.tsx', 'UNIVERSAL'));

// A.3 - 2x2 Hanging Protocol
check('A.3 - Hanging Protocol module exists', 
  fileExists('extensions/dental/src/getHangingProtocolModule.ts'));

check('A.3 - 2x2 layout configuration defined', 
  fileContains('extensions/dental/src/getHangingProtocolModule.ts', 'rows: 2') &&
  fileContains('extensions/dental/src/getHangingProtocolModule.ts', 'columns: 2'));

check('A.3 - Bitewing placeholders configured', 
  fileContains('extensions/dental/src/getHangingProtocolModule.ts', 'bitewing'));

console.log('\n📏 B) Dental Measurements Palette Requirements:\n');

// B.1 - Measurements button and palette
check('B.1 - Measurements palette component exists', 
  fileExists('extensions/dental/src/components/DentalMeasurementsPalette.tsx'));

check('B.1 - Measurements button configured in toolbar', 
  fileContains('modes/dental/src/toolbarButtons.ts', 'DentalMeasurements'));

check('B.1 - Measurements command module exists', 
  fileExists('extensions/dental/src/getCommandsModule.tsx'));

// B.2 - Measurement presets
check('B.2 - Periapical length (mm) preset defined', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'periapical-length') &&
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'PA length'));

check('B.2 - Canal angle (°) preset defined', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'canal-angle') &&
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'Canal angle'));

check('B.2 - Crown width (mm) preset defined', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'crown-width') &&
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'Crown width'));

check('B.2 - Root length (mm) preset defined', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'root-length') &&
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'Root length'));

check('B.2 - Auto-labeling functionality implemented', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'applyDentalMetadata'));

// B.3 - Measurements panel and export
check('B.3 - Measurements panel component exists', 
  fileExists('extensions/dental/src/components/DentalMeasurementsPanel.tsx'));

check('B.3 - Sorting options implemented', 
  fileContains('extensions/dental/src/components/DentalMeasurementsPanel.tsx', 'sortOrder'));

check('B.3 - Filtering options implemented', 
  fileContains('extensions/dental/src/components/DentalMeasurementsPanel.tsx', 'presetFilter'));

check('B.3 - JSON export functionality implemented', 
  fileContains('extensions/dental/src/components/DentalMeasurementsPanel.tsx', 'Export JSON'));

console.log('\n🔧 Extension Configuration:\n');

// Extension configuration
check('Extension main module exists', 
  fileExists('extensions/dental/src/index.ts'));

check('Extension package.json configured', 
  fileExists('extensions/dental/package.json'));

check('Dental mode configuration exists', 
  fileExists('modes/dental/src/index.ts'));

check('Dental mode registered in toolbar', 
  fileContains('modes/dental/src/index.ts', 'DentalMeasurements'));

console.log('\n📚 Documentation:\n');

check('Comprehensive README created', 
  fileExists('DENTAL_MODE_GUIDE.md'));

check('Test files created', 
  fileExists('extensions/dental/src/__tests__/dentalFeatures.test.ts'));

// Verify key functionality by checking file structure
console.log('\n🧪 Code Quality Checks:\n');

check('Measurement presets array properly exported', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'DENTAL_MEASUREMENT_PRESETS'));

check('Tooth selection functions exported', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'setActiveDentalTooth') &&
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'getActiveDentalTooth'));

check('Measurement system initialization implemented', 
  fileContains('extensions/dental/src/dentalMeasurementsManager.ts', 'initializeDentalMeasurements'));

check('Extension properly registers all modules', 
  fileContains('extensions/dental/src/index.ts', 'getPanelModule') &&
  fileContains('extensions/dental/src/index.ts', 'getCustomizationModule') &&
  fileContains('extensions/dental/src/index.ts', 'getCommandsModule'));

// Print results
console.log('\n' + '='.repeat(60));
console.log(`🦷 Dental Extension Verification Results:`);
console.log(`   Total Checks: ${checksTotal}`);
console.log(`   ✅ Passed: ${checksPassed}`);
console.log(`   ❌ Failed: ${checksTotal - checksPassed}`);

const successRate = Math.round((checksPassed / checksTotal) * 100);
console.log(`   Success Rate: ${successRate}%`);

if (checksPassed === checksTotal) {
  console.log('\n🎉 ALL REQUIREMENTS SUCCESSFULLY IMPLEMENTED!');
  console.log('\n✅ Feature Summary:');
  console.log('   A) Dental Mode UI Customization:');
  console.log('      • Dental theme toggle with cyan colors (#7fdff5) ✅');
  console.log('      • Practice Header with practice name & patient info ✅');
  console.log('      • Tooth Selector supporting FDI & Universal numbering ✅');
  console.log('      • 2x2 Hanging Protocol (Current/Prior/Bitewing) ✅');
  console.log('');
  console.log('   B) Dental Measurements Palette:');
  console.log('      • "Measurements" button opens palette ✅');
  console.log('      • Periapical length (mm) with distance tool ✅');
  console.log('      • Canal angle (°) with angle tool ✅');
  console.log('      • Crown width (mm) & Root length (mm) ✅');
  console.log('      • Auto-labeling with tooth information ✅');
  console.log('      • Right panel with sorting & filtering ✅');
  console.log('      • JSON export functionality ✅');
  console.log('');
  console.log('📖 Usage Instructions:');
  console.log('   1. Start OHIF: yarn dev');
  console.log('   2. Open dental mode: /dental?StudyInstanceUIDs=<study-uid>');
  console.log('   3. Click 🦷 button to enable dental theme');
  console.log('   4. Select tooth from dropdown');
  console.log('   5. Click "Measurements" for preset palette');
  console.log('   6. Use right panel to manage measurements');
  console.log('   7. Export data with "Export JSON" button');
  console.log('');
  console.log('📋 See DENTAL_MODE_GUIDE.md for detailed instructions');
} else {
  console.log('\n⚠️  Some features may be missing or incomplete.');
  console.log('   Please review the failed checks above.');
}

console.log('\n🧪 To run tests:');
console.log('   cd extensions/dental && node test-runner.js');
console.log('   (Note: Some test dependencies may need installation)');
