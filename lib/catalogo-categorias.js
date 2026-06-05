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

const CATEGORIAS_ALIASES_EXACTAS = new Map([
  ['traslacion', ['carrier interno', 'carrier externo', 'ejes']],
  ['giro', ['carrier inferior', 'carrier superior']],
  ['carrier interno traslacion', ['carrier interno']],
  ['carrier externo traslacion', ['carrier externo']],
  ['carrier inferior giro', ['carrier inferior']],
  ['carrier superior giro', ['carrier superior']],
  ['ejes traslacion', ['ejes']],
]);

const obtenerCategoriasCoincidentes = texto => {
  const valor = String(texto || '').trim();
  if (!valor) {
    return [];
  }

  const clave = normalizarClave(normalizarCategoriaMenu(valor));
  const coincidencias = new Set(
    obtenerCategoriasRelacionadas(valor).map(item => normalizarClave(normalizarCategoriaMenu(item))).filter(Boolean)
  );

  const alias = CATEGORIAS_ALIASES_EXACTAS.get(clave) || [];
  alias.forEach(item => {
    const claveAlias = normalizarClave(normalizarCategoriaMenu(item));
    if (claveAlias) {
      coincidencias.add(claveAlias);
    }
  });

  return Array.from(coincidencias);
};

const contiene = (texto, fragmento) => texto.includes(fragmento);

const contieneTodos = (texto, fragmentos) => fragmentos.every(fragmento => contiene(texto, fragmento));

const contieneNinguno = (texto, fragmentos) => fragmentos.every(fragmento => !contiene(texto, fragmento));

const coincidePorNombreCategoria = (nombre, categoria) => {
  const clave = normalizarClave(normalizarCategoriaMenu(categoria));

  switch (clave) {
    case 'motorreductor traslacion':
      return (contiene(nombre, 'motorreductor') || contiene(nombre, 'moto reductor')) && contiene(nombre, 'traslacion') && !contiene(nombre, 'carrier');
    case 'reductor traslacion':
      return contiene(nombre, 'reductor') && contiene(nombre, 'traslacion') && !contiene(nombre, 'motorreductor') && !contiene(nombre, 'moto reductor') && !contiene(nombre, 'carrier') && !contiene(nombre, 'eje') && !contiene(nombre, 'ejes');
    case 'motor giro':
      return contieneTodos(nombre, ['motor', 'giro']) && contieneNinguno(nombre, ['reductor', 'reparacion', 'kit', 'balinera', 'corona', 'planetario', 'pinon', 'carrier']);
    case 'reductor giro':
      return contieneTodos(nombre, ['reductor', 'giro']) && contieneNinguno(nombre, ['motorreductor', 'motor reductor', 'moto reductor', 'reparacion', 'kit', 'balinera', 'balineras', 'corona', 'coronas', 'planetario', 'planetarios', 'pinon', 'pinones', 'carrier', 'eje', 'ejes']);
    case 'carrier interno traslacion':
      return contiene(nombre, 'carrier') && contiene(nombre, 'interno') && contiene(nombre, 'traslacion');
    case 'carrier externo traslacion':
      return contiene(nombre, 'carrier') && contiene(nombre, 'externo') && contiene(nombre, 'traslacion');
    case 'carrier inferior giro':
      return contiene(nombre, 'carrier') && contiene(nombre, 'inferior') && contiene(nombre, 'giro');
    case 'carrier superior giro':
      return contiene(nombre, 'carrier') && contiene(nombre, 'superior') && contiene(nombre, 'giro');
    case 'ejes traslacion':
      return (contiene(nombre, 'eje') || contiene(nombre, 'ejes')) && contiene(nombre, 'traslacion');
    case 'piñones traslacion':
      return (contiene(nombre, 'pinon') || contiene(nombre, 'pinones')) && (contiene(nombre, 'solar') || contiene(nombre, 'planetario'));
    case 'traslacion':
      return contiene(nombre, 'traslacion');
    case 'giro':
      return contiene(nombre, 'giro');
    default: {
      const tokens = obtenerTokens(categoria);
      return tokens.length > 0 && tokens.every(token => tokenCoincide(nombre, token));
    }
  }
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
  const nombre = normalizarClave(producto?.nombre || '');
  const categoriasAsignadas = parseCategorias(producto?.categorias);
  const categoriaNormalizada = normalizarClave(normalizarCategoriaMenu(categoria));
  const categoriasObjetivo = obtenerCategoriasCoincidentes(categoria);
  if (categoriasAsignadas.length > 0) {
    for (const item of categoriasAsignadas) {
      const itemNorm = normalizarClave(normalizarCategoriaMenu(item));
      if (!itemNorm) continue;
      if (categoriasObjetivo.includes(itemNorm)) {
        if (categoriaNormalizada === 'motor giro' || categoriaNormalizada === 'reductor giro') {
          return nombre ? coincidePorNombreCategoria(nombre, categoria) : false;
        }
        return true;
      }
    }
  }
  if (!nombre) return false;
  return coincidePorNombreCategoria(nombre, categoria);
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