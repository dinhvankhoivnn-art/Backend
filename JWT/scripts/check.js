#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra tối ưu hóa project...\n');

// Kiểm tra các file cần thiết
const requiredFiles = [
  'package.json',
  'app.js',
  '.env',
  'views/layout.ejs',
  'views/index.ejs',
  'views/login.ejs',
  'views/register.ejs',
  'views/dashboard.ejs',
  'public/css/style.css',
  'public/js/main.js',
  'routes/webRouter.js',
  'middlewares/errorHandler.js',
  'controllers/login.controller.js',
  'controllers/user.controller.js',
  'models/User.js',
  'db/connectDB.js'
];

console.log('📁 Kiểm tra file structure:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log(`\n${allFilesExist ? '✅' : '❌'} File structure: ${allFilesExist ? 'OK' : 'MISSING FILES'}`);

// Kiểm tra package.json
console.log('\n📦 Kiểm tra dependencies:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'express', 'ejs', 'express-ejs-layouts', 'mongoose', 'bcrypt', 
  'jsonwebtoken', 'dotenv', 'cors', 'helmet', 'express-rate-limit'
];

requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep];
  console.log(`${exists ? '✅' : '❌'} ${dep}: ${exists || 'MISSING'}`);
});

// Kiểm tra .env
console.log('\n🔧 Kiểm tra environment variables:');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'PORT', 'NODE_ENV'];
  
  requiredEnvVars.forEach(envVar => {
    const exists = envContent.includes(envVar);
    console.log(`${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'SET' : 'MISSING'}`);
  });
} else {
  console.log('❌ .env file not found');
}

console.log('\n🎯 Tối ưu hóa hoàn tất!');
console.log('\n📋 Hướng dẫn sử dụng:');
console.log('1. npm install');
console.log('2. npm run seed');
console.log('3. npm run dev');
console.log('4. Truy cập: http://localhost:3000');
console.log('\n🔐 Admin login:');
console.log('Email: dinhvankhoi.vnn@gmail.com');
console.log('Password: 10061998');
