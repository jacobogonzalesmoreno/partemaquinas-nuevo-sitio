const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'djihawo6p',
  api_key: '129444119546156',
  api_secret: '4JuN_gcRl81qiQdHLSC6rfMxCYU',
});

async function main() {
  const result = await cloudinary.api.resources({ type: 'upload', max_results: 5, prefix: 'partemaquinas/wordpress' });
  console.log('Sample URLs:');
  result.resources.forEach(r => console.log(r.secure_url));
}

main();
