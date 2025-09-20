// Simple script to check if all required files exist
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking file structure...');
console.log('📁 Current directory:', __dirname);

const requiredFiles = [
    'server.js',
    'package.json',
    'requirements.txt',
    'public/submit.html',
    'public/board.html',
    'public/login.html',
    'public/submit-script.js',
    'public/board-script.js',
    'public/login-script.js',
    'public/submit-styles.css',
    'public/board-styles.css',
    'public/login-styles.css'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log('✅', file);
    } else {
        console.log('❌', file, '- MISSING!');
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('\n🎉 All required files are present!');
} else {
    console.log('\n⚠️ Some files are missing. Please check your project structure.');
}

// List all files in public directory
console.log('\n📁 Files in public directory:');
try {
    const publicFiles = fs.readdirSync(path.join(__dirname, 'public'));
    publicFiles.forEach(file => {
        console.log('  -', file);
    });
} catch (error) {
    console.log('❌ Could not read public directory:', error.message);
}
