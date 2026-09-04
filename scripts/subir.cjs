const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

console.log('✅ Script iniciado');

cloudinary.config({
  cloud_name: 'djihawo6p',
  api_key: '129444119546156',
  api_secret: '4JuN_gcRl81q1QdHLSC6rfMxCYU',
});

console.log('✅ Cloudinary configurado');

const archivos = fs.readdirSync('./public/logo');
console.log('Archivos en logo:', archivos);