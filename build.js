const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Starting PinIT Career OS Custom Build Pipeline ---');

// 1. Clean directories
function cleanDirectory(dirName) {
  const dirPath = path.join(__dirname, dirName);
  if (fs.existsSync(dirPath)) {
    console.log(`Cleaning existing '${dirName}' directory...`);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Successfully removed '${dirName}' directory.`);
    } catch (err) {
      console.warn(`\n[WARNING] Could not clean the '${dirName}' directory: ${err.message}`);
      console.warn(`This usually happens when a file is locked by a running development server.`);
      console.warn(`Please stop any running development servers ('npm run dev') and try again.\n`);
    }
  }
}

cleanDirectory('.next');
cleanDirectory('out');

// 2. Set environment variable and run next build
console.log('Running Next.js build...');
try {
  // Set NODE_TLS_REJECT_UNAUTHORIZED="0" cross-platform for the spawned process
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    }
  });
  console.log('\n--- Build completed successfully! ---');
} catch (err) {
  console.error('\n[ERROR] Next.js build execution failed.');
  process.exit(1);
}
