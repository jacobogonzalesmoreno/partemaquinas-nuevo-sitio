const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: 'djihawo6p',
  api_key: '129444119546156',
  api_secret: '4JuN_gcRl81qiQdHLSC6rfMxCYU',
});

const UPLOAD_DIR = './public/uploads/wordpress';
const mapping = {};

async function main() {
  const files = fs.readdirSync(UPLOAD_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  console.log('Total imagenes:', files.length);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(UPLOAD_DIR, file);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'partemaquinas/wordpress',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      });
      mapping[file] = result.secure_url;
      if (i % 50 === 0) console.log('Progreso: ' + i + '/' + files.length + ' - ' + file);
    } catch(e) {
      console.log('ERROR:', file, e.message);
    }
  }
  
  fs.writeFileSync('./scripts/cloudinary-wordpress.json', JSON.stringify(mapping, null, 2));
  console.log('Listo! Total subidas:', Object.keys(mapping).length);
}

main();
