import db from '../lib/db.js';

const normalizarTexto = texto => (texto || '').toLowerCase();
const normalizarClave = texto =>
  normalizarTexto(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const categoriasMenu = [
  'Motores','Liner kit','Bomba Inyeccion','Inyectores','Turbos','Accesorios','Tuberia Inyeccion','Correas','Soportes','Filtros','Bloques','Culatas','Cigueñales','Casquetes','Arbol de levas','Tapa Valvulas','Empaquetaduras','Coronas','Piñones','Solares','Planetario','Ventiladores','Otros'
];

const menuLookup = new Map(categoriasMenu.map(c => [normalizarClave(c), c]));
const pluralizarClave = clave => {
  if (clave.endsWith('s')) return clave;
  if (clave.endsWith('z')) return `${clave.slice(0, -1)}ces`;
  if (['l','r','n','d'].some(ch => clave.endsWith(ch))) return `${clave}es`;
  return `${clave}s`;
};
const normalizarCategoriaMenu = categoria => {
  const clave = normalizarClave(categoria);
  if (clave === 'arboles de levas' || clave === 'arbol de levas') return 'Arbol de levas';
  if (menuLookup.has(clave)) return menuLookup.get(clave);
  const singular = clave.endsWith('es') ? clave.slice(0, -2) : (clave.endsWith('s') ? clave.slice(0, -1) : clave);
  const plural = pluralizarClave(clave);
  return menuLookup.get(singular) || menuLookup.get(plural) || categoria.trim();
};

const parseCategorias = value => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value).split(/[\n\r,;|]+/).map(i => i.trim()).filter(Boolean);
};

const obtenerTokensTexto = texto => {
  const base = normalizarClave(texto);
  if (!base) return [];
  return base.split(' ').map(t => t.trim()).filter(Boolean);
};

const tokenCoincide = (nombre, token) => {
  if (!token) return false;
  if (nombre.includes(token)) return true;
  const singular = token.endsWith('es') ? token.slice(0, -2) : (token.endsWith('s') ? token.slice(0, -1) : token);
  if (singular && singular !== token && nombre.includes(singular)) return true;
  const plural = token.endsWith('s') ? token : (token.endsWith('z') ? `${token.slice(0, -1)}ces` : `${token}s`);
  return plural !== token && nombre.includes(plural);
};

const productoCoincideCategoriaPorNombre = (producto, categoria) => {
  const categoriasAsignadas = parseCategorias(producto.categorias);
  const objetivo = normalizarClave(normalizarCategoriaMenu(categoria));
  if (categoriasAsignadas.length > 0) {
    for (const item of categoriasAsignadas) {
      const itemNorm = normalizarClave(normalizarCategoriaMenu(item));
      if (!itemNorm) continue;
      if (itemNorm === objetivo) return true;
      if (itemNorm.includes(objetivo) || objetivo.includes(itemNorm)) return true;
    }
  }
  const nombre = normalizarClave(producto.nombre || '');
  if (!nombre) return false;
  const tokens = obtenerTokensTexto(categoria);
  if (tokens.length === 0) return false;
  return tokens.every(token => tokenCoincide(nombre, token));
};

(async () => {
  const [rows] = await db.query('SELECT id, nombre, categorias FROM productos');
  for (const cat of ['Accesorios', 'Bloques', 'Arbol de levas']) {
    let matched = 0;
    const samples = [];
    for (const r of rows) {
      if (productoCoincideCategoriaPorNombre(r, cat)) {
        matched++;
        if (samples.length < 5) samples.push(r);
      }
    }
    console.log({ cat, matched, samples });
  }
  await db.end();
})();
