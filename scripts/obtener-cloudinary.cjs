const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: 'djihawo6p',
  api_key: '129444119546156',
  api_secret: '4JuN_gcRl81qiQdHLSC6rfMxCYU',
});

async function main() {
  const mapping = {};
  let nextCursor = undefined;
  let total = 0;

  do {
    const options = { 
      type: 'upload', 
      prefix: 'partemaquinas/wordpress', 
      max_results: 500,
      next_cursor: nextCursor
    };
    const result = await cloudinary.api.resources(options);
    for (const resource of result.resources) {
      const fileName = resource.public_id.split('/').pop() + '.' + resource.format;
      mapping[fileName] = resource.secure_url;
      total++;
    }
    nextCursor = result.next_cursor;
    console.log('Obtenidas:', total);
  } while (nextCursor);

  fs.writeFileSync('./scripts/cloudinary-wordpress.json', JSON.stringify(mapping, null, 2));
  console.log('Listo! Total:', total);
}

main();
