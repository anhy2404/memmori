/**
 * Script khởi động tự động - chạy khi gõ "npm start"
 * Tự động: kiểm tra môi trường → cài packages → kết nối máy ảo → chạy app
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ===== MÀU SẮC LOG =====
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  ok: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}══ ${msg} ══${colors.reset}\n`),
};

// ===== CHẠY LỆNH AN TOÀN =====
function run(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (e) {
    return null;
  }
}

// ===== KIỂM TRA ADB (Android Debug Bridge) =====
function checkAdb() {
  // Tìm adb trong các đường dẫn phổ biến
  const possiblePaths = [
    process.env.ANDROID_HOME
      ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe')
      : null,
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    'C:\\Android\\Sdk\\platform-tools\\adb.exe',
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  // Thử gọi adb từ PATH
  const result = run('adb version');
  if (result) return 'adb';

  return null;
}

// ===== KIỂM TRA MÁY ẢO ĐANG CHẠY =====
function getRunningEmulators(adbPath) {
  try {
    const result = run(`"${adbPath}" devices`);
    if (!result) return [];
    
    const lines = result.split('\n').slice(1); // bỏ dòng đầu "List of devices"
    const emulators = lines
      .filter(line => line.includes('emulator') && line.includes('device'))
      .map(line => line.split('\t')[0].trim());
    
    return emulators;
  } catch (e) {
    return [];
  }
}

// ===== KIỂM TRA NODE_MODULES =====
function checkNodeModules() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const expoPath = path.join(nodeModulesPath, 'expo');
  return fs.existsSync(expoPath);
}

// ===== MAIN =====
async function main() {
  log.title('MemoryMap - Khởi động dự án');

  // 1. Kiểm tra node_modules
  log.info('Kiểm tra dependencies...');
  if (!checkNodeModules()) {
    log.warn('Chưa có node_modules, đang cài đặt...');
    try {
      execSync('npm install --legacy-peer-deps', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      });
      log.ok('Cài đặt dependencies thành công!');
    } catch (e) {
      log.error('Lỗi cài dependencies: ' + e.message);
      log.warn('Thử chạy: npm install --legacy-peer-deps');
      process.exit(1);
    }
  } else {
    log.ok('Dependencies đã sẵn sàng');
  }

  // 2. Kiểm tra ADB
  log.info('Kiểm tra kết nối Android...');
  
  // Đường dẫn ADB cố định cho Windows
  const adbFixed = path.join(
    process.env.LOCALAPPDATA || 'C:\\Users\\ADMIN\\AppData\\Local',
    'Android', 'Sdk', 'platform-tools', 'adb.exe'
  );
  const adbPath = fs.existsSync(adbFixed) ? adbFixed : checkAdb();

  if (!adbPath) {
    log.warn('Không tìm thấy ADB. Chạy ở chế độ QR code...');
    startExpo(false);
    return;
  }

  // 3. Kiểm tra máy ảo
  const emulators = getRunningEmulators(adbPath);

  if (emulators.length === 0) {
    log.warn('Không tìm thấy máy ảo đang chạy!');
    log.warn('Hãy bật máy ảo trong Android Studio trước');
    log.info('Chờ máy ảo kết nối (tối đa 60 giây)...');
    
    // Đợi máy ảo trong 60 giây
    const found = await waitForEmulator(adbPath, 60);
    
    if (found) {
      log.ok(`Đã tìm thấy máy ảo: ${found}`);
      startExpo(true);
    } else {
      log.warn('Không tìm thấy máy ảo sau 60 giây');
      log.info('Khởi động ở chế độ QR code (quét bằng Expo Go)...');
      startExpo(false);
    }
  } else {
    log.ok(`Máy ảo đang chạy: ${emulators[0]}`);
    startExpo(true);
  }
}

// ===== ĐỢI MÁY ẢO =====
function waitForEmulator(adbPath, timeoutSec) {
  return new Promise((resolve) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 3;
      process.stdout.write(`\r${colors.yellow}⏳ Đang chờ máy ảo... ${elapsed}s/${timeoutSec}s${colors.reset}`);
      
      const emulators = getRunningEmulators(adbPath);
      if (emulators.length > 0) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve(emulators[0]);
      } else if (elapsed >= timeoutSec) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve(null);
      }
    }, 3000);
  });
}

// ===== KHỞI ĐỘNG EXPO =====
function startExpo(withAndroid) {
  const projectRoot = path.join(__dirname, '..');
  
  if (withAndroid) {
    log.title('Khởi động app trên máy ảo Android');
    log.info('App sẽ tự động cài và mở trên máy ảo...');
    log.info('Nhấn R để reload | Nhấn Ctrl+C để thoát\n');
    
    const child = spawn('npx', ['expo', 'start', '--android', '--clear'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (err) => {
      log.error('Lỗi khởi động Expo: ' + err.message);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        log.error('Expo thoát với mã lỗi: ' + code);
      }
    });
  } else {
    log.title('Khởi động Expo (chế độ QR)');
    log.info('Quét QR bằng Expo Go hoặc mở http://localhost:8081\n');
    
    const child = spawn('npx', ['expo', 'start'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (err) => {
      log.error('Lỗi khởi động Expo: ' + err.message);
    });
  }
}

// Chạy
main().catch((err) => {
  console.error('Lỗi không xác định:', err);
  process.exit(1);
});
