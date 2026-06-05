import { MENU_CATEGORIAS, MENU_CATEGORIAS_FLAT } from '@/lib/menu-categorias';

const splitPattern = /[\n\r,;|]+/;

export const CATEGORIAS_MENU = MENU_CATEGORIAS_FLAT;

const PALABRAS_IGNORADAS = new Set([
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'y',
  'para',
  'por',
  'con',
  'sin',
  'en',
  'al',
]);

const pluralizarBasico = palabra => (palabra.endsWith('s') ? palabra : `${palabra}s`);

const pluralizarClave = clave => {
  if (clave.endsWith('s')) {
    return clave;
  }
  if (clave.endsWith('z')) {
    return `${clave.slice(0, -1)}ces`;
  }
  if (clave.endsWith('l') || clave.endsWith('r') || clave.endsWith('n') || clave.endsWith('d')) {
    return `${clave}es`;
  }
  return `${clave}s`;
};

const normalizarTexto = texto => String(texto || '').toLowerCase();

export const normalizarClave = texto =>
  normalizarTexto(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const slugifyCategoria = texto => normalizarClave(texto).replace(/\s+/g, '-');

const categoriasRelacionadasIndex = new Map();

const registrarCategoriasRelacionadas = categoria => {
  const nombre = String(categoria?.nombre || '').trim();
  if (!nombre) {
    return new Set();
  }

  const relacionadas = new Set([nombre]);
  for (const hijo of categoria.hijos || []) {
    registrarCategoriasRelacionadas(hijo).forEach(item => relacionadas.add(item));
  }

  const claveNormalizada = normalizarClave(nombre);
  const claveSlug = slugifyCategoria(nombre);
  if (claveNormalizada) {
    categoriasRelacionadasIndex.set(claveNormalizada, relacionadas);
  }
  if (claveSlug) {
    categoriasRelacionadasIndex.set(claveSlug, relacionadas);
  }

  return relacionadas;
};

MENU_CATEGORIAS.forEach(registrarCategoriasRelacionadas);

const menuLookup = new Map(CATEGORIAS_MENU.map(categoria => [normalizarClave(categoria), categoria]));

export const normalizarCategoriaMenu = categoria => {
  const clave = normalizarClave(categoria);
  if (clave === 'arboles de levas' || clave === 'arbol de levas') {
    return 'Arbol de levas';
  }
  if (menuLookup.has(clave)) {
    return menuLookup.get(clave);
  }
  const singular = clave.endsWith('es') ? clave.slice(0, -2) : (clave.endsWith('s') ? clave.slice(0, -1) : clave);
  const plural = pluralizarClave(clave);
  return menuLookup.get(singular) || menuLookup.get(plural) || categoria.trim();
};

export const encontrarCategoriaCatalogo = texto => {
  const objetivoNormalizado = normalizarClave(texto);
  const objetivoSlug = slugifyCategoria(texto);
  if (!objetivoNormalizado && !objetivoSlug) return null;

  return CATEGORIAS_MENU.find(categoria => {
    const categoriaNormalizada = normalizarClave(categoria);
    const categoriaSlug = slugifyCategoria(categoria);
    return categoriaNormalizada === objetivoNormalizado || categoriaSlug === objetivoSlug;
  }) || null;
};

export const obtenerCategoriasRelacionadas = texto => {
  const valor = String(texto || '').trim();
  if (!valor) {
    return [];
  }

  const claveNormalizada = normalizarClave(valor);
  const claveSlug = slugifyCategoria(valor);
  const relacionadas = categoriasRelacionadasIndex.get(claveNormalizada) || categoriasRelacionadasIndex.get(claveSlug);
  if (relacionadas) {
    return Array.from(relacionadas);
  }

  return [valor];
};

export const resolverRutaBusquedaCatalogo = texto => {
  const valor = String(texto || '').trim();
  if (!valor) return '/productos';
  const categoria = encontrarCategoriaCatalogo(valor);
  if (categoria) {
    return `/productos/categorias/${slugifyCategoria(categoria)}`;
  }
  return `/productos?buscar=${encodeURIComponent(valor)}`;
};

const obtenerTokens = texto => {
  const base = normalizarClave(texto);
  if (!base) return [];
  return base
    .split(' ')
    .map(token => token.trim())
    .filter(token => token && !PALABRAS_IGNORADAS.has(token));
};

const tokenCoincide = (nombre, token) => {
  if (!token) return false;
  if (nombre.includes(token)) return true;
  const singular = token.endsWith('es')
    ? token.slice(0, -2)
    : (token.endsWith('s') ? token.slice(0, -1) : token);
  if (singular && singular !== token && nombre.includes(singular)) return true;
  const plural = token.endsWith('s')
    ? token
    : (token.endsWith('z') ? `${token.slice(0, -1)}ces` : `${token}s`);
  return plural !== token && nombre.includes(plural);
};

const parseCategorias = value => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(splitPattern)
    .map(categoria => categoria.trim())
    .filter(Boolean);
};

export const productoCoincideCategoriaPorNombre = (producto, categoria) => {
  const categoriasAsignadas = parseCategorias(producto?.categorias);
  const categoriasObjetivo = obtenerCategoriasRelacionadas(categoria)
    .map(item => normalizarClave(normalizarCategoriaMenu(item)))
    .filter(Boolean);
  if (categoriasAsignadas.length > 0) {
    for (const item of categoriasAsignadas) {
      const itemNorm = normalizarClave(normalizarCategoriaMenu(item));
      if (!itemNorm) continue;
      for (const categoriaObjetivo of categoriasObjetivo) {
        if (itemNorm === categoriaObjetivo) return true;
        if (itemNorm.includes(categoriaObjetivo) || categoriaObjetivo.includes(itemNorm)) return true;
      }
    }
    return false;
  }
  const nombre = normalizarClave(producto?.nombre || '');
  if (!nombre) return false;
  const tokens = obtenerTokens(categoria);
  if (tokens.length === 0) return false;
  return tokens.every(token => tokenCoincide(nombre, token));
};

export const inferirCategoriaPorNombre = nombreProducto => {
  const nombre = normalizarClave(nombreProducto || '');
  if (!nombre) {
    return 'Otros';
  }
  if (nombre.includes('arbol de levas') || nombre.includes('arboles de levas')) {
    return 'Arbol de levas';
  }
  const primeraPalabra = nombre
    .split(/\s+/)
    .map(palabra => palabra.trim())
    .filter(palabra => palabra.length > 3 && !PALABRAS_IGNORADAS.has(palabra))[0];
  if (!primeraPalabra) {
    return 'Otros';
  }
  const capitalizada = primeraPalabra.charAt(0).toUpperCase() + primeraPalabra.slice(1);
  return normalizarCategoriaMenu(pluralizarBasico(capitalizada));
};

export const getCategoriasProducto = producto => {
  const nombreLower = normalizarTexto(producto?.nombre || '');
  const categoriasBase = producto?.categorias
    ? parseCategorias(producto.categorias)
    : (nombreLower.includes('liner kit') ? ['Liner kit'] : []);
  if (categoriasBase.length > 0) {
    const normalizadas = categoriasBase.map(categoria => normalizarCategoriaMenu(categoria)).filter(Boolean);
    return normalizadas.length > 0 ? normalizadas : [inferirCategoriaPorNombre(producto?.nombre)];
  }
  const categoriasPorBusqueda = CATEGORIAS_MENU.filter(categoria => productoCoincideCategoriaPorNombre(producto, categoria));
  if (categoriasPorBusqueda.length > 0) {
    return categoriasPorBusqueda;
  }
  return [inferirCategoriaPorNombre(producto?.nombre)];
};

export const getCategoriasCatalogo = productos => {
  const categoriasDetectadas = new Set();
  (productos || []).forEach(producto => {
    getCategoriasProducto(producto).forEach(categoria => {
      if (categoria) {
        categoriasDetectadas.add(categoria);
      }
    });
  });

  return Array.from(new Set([...CATEGORIAS_MENU, ...categoriasDetectadas]))
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
};