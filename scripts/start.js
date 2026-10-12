#!/usr/bin/env node
/**
 * Memmori - Script khởi động thông minh
 * Dùng: node scripts/start.js
 * - Tự động kill process node cũ
 * - Xóa cache Metro
 * - Chạy expo start --android --clear
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

console.log('🗺️  Memmori - Khởi động...\n');

// 1. Kill node cũ (Windows)
try {
  execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE ne scripts*"', { stdio: 'ignore' });
  console.log('✅ Đã dọn process cũ');
} catch { /* không có process cũ */ }

// 2. Kiểm tra syntax
console.log('🔍 Kiểm tra syntax...');
const { readdirSync, statSync } = require('fs');

function checkDir(dir) {
  let errors = 0;
  try {
    readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (statSync(full).isDirectory() && f !== 'node_modules') {
        errors += checkDir(full);
      } else if (f.endsWith('.js') && !full.includes('node_modules')) {
        try {
          execSync(`node --check "${full}"`, { stdio: 'pipe' });
        } catch (e) {
          console.error(`❌ Lỗi syntax: ${full}`);
          console.error(e.stderr?.toString() || e.message);
          errors++;
        }
      }
    });
  } catch {}
  return errors;
}

const errs = checkDir(ROOT);
if (errs > 0) {
  console.error(`\n❌ Có ${errs} lỗi syntax. Vui lòng sửa trước khi chạy.\n`);
  process.exit(1);
}
console.log('✅ Syntax OK\n');

// 3. Khởi động Expo
console.log('🚀 Khởi động Expo...\n');
const expo = spawn('npx', ['expo', 'start', '--android', '--clear'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
});

expo.on('error', err => {
  console.error('❌ Không thể khởi động Expo:', err.message);
  process.exit(1);
});
