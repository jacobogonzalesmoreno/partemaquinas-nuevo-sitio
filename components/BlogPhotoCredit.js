const credits = {
  'excavadora-general.jpg': { author: 'Wikideas1', source: 'Wikimedia Commons', page: 'https://commons.wikimedia.org/wiki/File:Excavator_side.jpg', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  'placa-yamar-sv16.jpg': { author: 'Cjp24', source: 'Wikimedia Commons', page: 'https://commons.wikimedia.org/wiki/File:Yanmar_SV16_(3).jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  'tren-rodaje-entrack.jpg': { author: 'Urjamten', source: 'Wikimedia Commons', page: 'https://commons.wikimedia.org/wiki/File:Entrack,_NTP,_Undercarriage_Excavator.jpg', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  'reemplazo-rodillo-glacier.jpg': { author: 'GlacierNPS', source: 'Wikimedia Commons', page: 'https://commons.wikimedia.org/wiki/File:4-26-12-track_roller_replacement_1_(7116884095).jpg', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' },
  'tension-oruga-manual-publico.png': { author: 'U.S. Navy, NAVEDTRA 14081A', source: 'Manual técnico oficial', page: 'https://media.defense.gov/2014/Jun/20/2002655930/-1/-1/1/140620-N-ZZ182-6570.pdf', license: 'dominio público', licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/' },
};

export default function BlogPhotoCredit({ src }) {
  const filename = String(src || '').split('/').pop();
  const credit = credits[filename];
  if (!credit) return null;
  return <small className="blog-photo-credit">Foto: <a href={credit.page} target="_blank" rel="noopener noreferrer">{credit.author} · {credit.source}</a> · <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">{credit.license}</a></small>;
}
