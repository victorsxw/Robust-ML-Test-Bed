require('dotenv').config();
const { spawn } = require('child_process');

// 根据环境变量决定如何启动应用
if (process.env.NODE_ENV === 'development') {
    // 本地开发环境
    console.log('Starting in development mode...');
    spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
} else {
    // Docker 或生产环境
    console.log('Starting in production mode...');
    spawn('npm', ['start'], { stdio: 'inherit' });
} 