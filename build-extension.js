#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Building Leet2Git Chrome Extension...');

// Ensure dist-extension directory exists
const distDir = 'dist-extension';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy icon files
const iconSizes = ['16', '32', '128'];
iconSizes.forEach(size => {
  const srcPath = path.join('icons', `${size}.png`);
  const destPath = path.join(distDir, `${size}.png`);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${size}.png`);
  } else {
    console.log(`⚠️ Warning: ${srcPath} not found`);
  }
});

// Files that should already exist in dist-extension
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 Extension build complete!');
  console.log('\nInstallation Instructions:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode" toggle');
  console.log('3. Click "Load unpacked"');
  console.log(`4. Select the ${distDir}/ folder`);
  console.log('5. Extension will be loaded and ready to use');
} else {
  console.log('\n❌ Build incomplete - some files are missing');
}

console.log('\nExtension Features:');
console.log('- Automatic LeetCode solution detection');
console.log('- GitHub repository synchronization');
console.log('- Statistics tracking and progress monitoring');
console.log('- Configurable folder structure and options');