const { execSync } = require('child_process');

console.log('🎭 Installing Playwright browsers...');

try {
  // Install Chromium browser
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✅ Playwright Chromium installed successfully!');
} catch (error) {
  console.error('❌ Failed to install Playwright browsers:', error.message);
  process.exit(1);
}
