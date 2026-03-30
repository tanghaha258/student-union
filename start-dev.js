const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';

// 启动后端服务
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  shell: isWindows,
  stdio: 'pipe'
});

// 启动前端服务
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: isWindows,
  stdio: 'pipe'
});

console.log('🚀 正在启动学生会信息管理系统...\n');
console.log('📦 后端服务: http://localhost:3000');
console.log('💻 前端服务: http://localhost:5173\n');

// 后端输出
backend.stdout.on('data', (data) => {
  process.stdout.write(`[Backend] ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`[Backend Error] ${data}`);
});

// 前端输出
frontend.stdout.on('data', (data) => {
  process.stdout.write(`[Frontend] ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[Frontend Error] ${data}`);
});

// 进程退出处理
backend.on('close', (code) => {
  console.log(`[Backend] 进程退出，代码: ${code}`);
  frontend.kill();
  process.exit(code);
});

frontend.on('close', (code) => {
  console.log(`[Frontend] 进程退出，代码: ${code}`);
  backend.kill();
  process.exit(code);
});

// 捕获 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 正在关闭服务...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

// Windows 下捕获 Ctrl+C
if (isWindows) {
  process.on('SIGTERM', () => {
    console.log('\n\n👋 正在关闭服务...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}
