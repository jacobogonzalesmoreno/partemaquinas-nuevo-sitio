const CK = 'ck_d6f713f837ed2fce72418048e64a3e257671d5c5';
const CS = 'cs_df98a4520ad4c5109f05cec61d65d22a23f11b8a';
const BASE = 'https://partemaquinas.com/wp-json/wc/v3/products';

const ids = [700,1023,1028,1074,1078,1140,1904,2015,2161,2163,2165,2263,2475,2477,2506,2558,2783,2784,2785,2786,2787,2788,2789,2790,2791,3783,3784,3785,3786,3787,3788,3789,3790,3791];

async function main() {
  for (const id of ids) {
    const url = BASE + '/' + id + '?consumer_key=' + CK + '&consumer_secret=' + CS;
    const res = await fetch(url);
    const p = await res.json();
    const desc = p.description || '';
    const tieneImg = desc.includes('<img');
    const tieneBWG = desc.includes('photo-gallery');
    const tieneGallery = desc.includes('gallery-item');
    const imagenes = p.images ? p.images.length : 0;
    console.log(`ID ${id} | ${p.name} | imgs API: ${imagenes} | <img>: ${tieneImg} | BWG: ${tieneBWG} | gallery: ${tieneGallery}`);
  }
}

main().catch(console.error);