import { MENU_CATEGORIAS, MENU_CATEGORIAS_FLAT } from '@/lib/menu-categorias';
import {
  buscarCategoriaFuzzy,
  tokenCoincideTolerante,
  normalizarQueryBusqueda,
} from '@/lib/busqueda-tolerante';

const splitPattern = /[\n\r,;|]+/;

export const CATEGORIAS_MENU = MENU_CATEGORIAS_FLAT;

const PALABRAS_IGNORADAS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'para', 'por', 'con', 'sin', 'en', 'al',
]);

const pluralizarBasico = palabra => (palabra.endsWith('s') ? palabra : `${palabra}s`);

const pluralizarClave = clave => {
  if (clave.endsWith('s')) return clave;
  if (clave.endsWith('z')) return `${clave.slice(0, -1)}ces`;
  if (clave.endsWith('l') || clave.endsWith('r') || clave.endsWith('n') || clave.endsWith('d')) return `${clave}es`;
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
  if (!nombre) return new Set();
  const relacionadas = new Set([nombre]);
  for (const hijo of categoria.hijos || []) {
    registrarCategoriasRelacionadas(hijo).forEach(item => relacionadas.add(item));
  }
  const claveNormalizada = normalizarClave(nombre);
  const claveSlug = slugifyCategoria(nombre);
  if (claveNormalizada) categoriasRelacionadasIndex.set(claveNormalizada, relacionadas);
  if (claveSlug) categoriasRelacionadasIndex.set(claveSlug, relacionadas);
  return relacionadas;
};

MENU_CATEGORIAS.forEach(registrarCategoriasRelacionadas);

const menuLookup = new Map(CATEGORIAS_MENU.map(categoria => [normalizarClave(categoria), categoria]));

export const normalizarCategoriaMenu = categoria => {
  const clave = normalizarClave(categoria);
  if (clave === 'arboles de levas' || clave === 'arbol de levas') return 'Arbol de levas';
  if (menuLookup.has(clave)) return menuLookup.get(clave);
  const singular = clave.endsWith('es') ? clave.slice(0, -2) : (clave.endsWith('s') ? clave.slice(0, -1) : clave);
  const plural = pluralizarClave(clave);
  return menuLookup.get(singular) || menuLookup.get(plural) || categoria.trim();
};

export const encontrarCategoriaCatalogo = texto => {
  const objetivoNormalizado = normalizarClave(texto);
  const objetivoSlug = slugifyCategoria(texto);
  if (!objetivoNormalizado && !objetivoSlug) return null;
  const exacta = CATEGORIAS_MENU.find(categoria => {
    const cn = normalizarClave(categoria);
    const cs = slugifyCategoria(categoria);
    return cn === objetivoNormalizado || cs === objetivoSlug;
  });
  if (exacta) return exacta;
  const fuzzy = buscarCategoriaFuzzy(texto, CATEGORIAS_MENU, 25);
  if (fuzzy) return fuzzy.categoria;
  return null;
};

export const obtenerCategoriasRelacionadas = texto => {
  const valor = String(texto || '').trim();
  if (!valor) return [];
  const claveNormalizada = normalizarClave(valor);
  const claveSlug = slugifyCategoria(valor);
  const relacionadas = categoriasRelacionadasIndex.get(claveNormalizada) || categoriasRelacionadasIndex.get(claveSlug);
  if (relacionadas) return Array.from(relacionadas);
  const fuzzy = buscarCategoriaFuzzy(valor, CATEGORIAS_MENU, 30);
  if (fuzzy) {
    const fuzzyClave = normalizarClave(fuzzy.categoria);
    const fuzzyRelacionadas = categoriasRelacionadasIndex.get(fuzzyClave);
    if (fuzzyRelacionadas) return Array.from(fuzzyRelacionadas);
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
  if (!valor) return [];
  const clave = normalizarClave(normalizarCategoriaMenu(valor));
  const coincidencias = new Set(
    obtenerCategoriasRelacionadas(valor).map(item => normalizarClave(normalizarCategoriaMenu(item))).filter(Boolean)
  );
  const alias = CATEGORIAS_ALIASES_EXACTAS.get(clave) || [];
  alias.forEach(item => {
    const claveAlias = normalizarClave(normalizarCategoriaMenu(item));
    if (claveAlias) coincidencias.add(claveAlias);
  });
  return Array.from(coincidencias);
};

const contiene = (texto, fragmento) => texto.includes(fragmento);
const contieneTodos = (texto, fragmentos) => fragmentos.every(f => contiene(texto, f));
const contieneNinguno = (texto, fragmentos) => fragmentos.every(f => !contiene(texto, f));

const coincidePorNombreCategoria = (nombre, categoria) => {
  const clave = normalizarClave(normalizarCategoriaMenu(categoria));

  switch (clave) {
    case 'motores':
      // "Motores" = SOLO motores completos/ensamblados.
      // Debe contener "motor" y NO contener ninguna palabra que indique parte/accesorio.
      return (
        contiene(nombre, 'motor') &&
        // --- Partes internas del motor ---
        !contiene(nombre, 'bomba') &&
        !contiene(nombre, 'inyector') &&
        !contiene(nombre, 'inyeccion') &&
        !contiene(nombre, 'inyect') &&
        !contiene(nombre, 'turbo') &&
        !contiene(nombre, 'turbocompresor') &&
        !contiene(nombre, 'filtro') &&
        !contiene(nombre, 'soporte') &&
        !contiene(nombre, 'correa') &&
        !contiene(nombre, 'banda') &&
        !contiene(nombre, 'tuberia') &&
        !contiene(nombre, 'tubo') &&
        !contiene(nombre, 'manguera') &&
        !contiene(nombre, 'culata') &&
        !contiene(nombre, 'bloque') &&
        !contiene(nombre, 'cigueñal') &&
        !contiene(nombre, 'ciguenal') &&
        !contiene(nombre, 'casquete') &&
        !contiene(nombre, 'arbol') &&
        !contiene(nombre, 'leva') &&
        !contiene(nombre, 'tapa') &&
        !contiene(nombre, 'empaquetadura') &&
        !contiene(nombre, 'empaqueradura') &&
        !contiene(nombre, 'junta') &&
        !contiene(nombre, 'corona') &&
        !contiene(nombre, 'piñon') &&
        !contiene(nombre, 'pinon') &&
        !contiene(nombre, 'planetario') &&
        !contiene(nombre, 'solar') &&
        !contiene(nombre, 'ventilador') &&
        !contiene(nombre, 'fan') &&
        !contiene(nombre, 'abanico') &&
        !contiene(nombre, 'liner') &&
        !contiene(nombre, 'kit') &&
        !contiene(nombre, 'balancin') &&
        !contiene(nombre, 'piston') &&
        !contiene(nombre, 'anillo') &&
        !contiene(nombre, 'segmento') &&
        !contiene(nombre, 'reten') &&
        !contiene(nombre, 'buje') &&
        !contiene(nombre, 'cepillo') &&
        !contiene(nombre, 'escobilla') &&
        !contiene(nombre, 'reductor') &&
        !contiene(nombre, 'giro') &&
        !contiene(nombre, 'traslacion') &&
        !contiene(nombre, 'carrier') &&
        !contiene(nombre, 'carter') &&
        !contiene(nombre, 'camisa') &&
        !contiene(nombre, 'valvula') &&
        !contiene(nombre, 'resorte') &&
        !contiene(nombre, 'tensor') &&
        !contiene(nombre, 'guaya') &&
        !contiene(nombre, 'cable') &&
        !contiene(nombre, 'sensor') &&
        !contiene(nombre, 'switch') &&
        !contiene(nombre, 'perno') &&
        !contiene(nombre, 'bulon') &&
        !contiene(nombre, 'cruceta') &&
        !contiene(nombre, 'amortiguador') &&
        !contiene(nombre, 'bisagra') &&
        !contiene(nombre, 'pasador') &&
        !contiene(nombre, 'ruleman') &&
        !contiene(nombre, 'rodamiento') &&
        !contiene(nombre, 'balinera') &&
        !contiene(nombre, 'cojinete') &&
        !contiene(nombre, 'embrague') &&
        !contiene(nombre, 'volante') &&
        !contiene(nombre, 'flywheel') &&
        !contiene(nombre, 'multiple') &&
        !contiene(nombre, 'collect') &&
        !contiene(nombre, 'manifold') &&
        // --- Sistemas de enfriamiento / lubricación ---
        !contiene(nombre, 'enfriador') &&
        !contiene(nombre, 'radiador') &&
        !contiene(nombre, 'cooler') &&
        !contiene(nombre, 'intercooler') &&
        !contiene(nombre, 'aceite') &&
        !contiene(nombre, 'agua') &&
        !contiene(nombre, 'refrigerante') &&
        !contiene(nombre, 'lubricante') &&
        // --- Electricos / arranca ---
        !contiene(nombre, 'alternador') &&
        !contiene(nombre, 'arranque') &&
        !contiene(nombre, 'starter') &&
        !contiene(nombre, 'dynamo') &&
        !contiene(nombre, 'dina') &&
        !contiene(nombre, 'electronico') &&
        !contiene(nombre, 'electrico') &&
        // --- Escape ---
        !contiene(nombre, 'escape') &&
        !contiene(nombre, 'exhosto') &&
        !contiene(nombre, 'mofle') &&
        !contiene(nombre, 'silenciador') &&
        !contiene(nombre, 'botador') &&
        // --- Motores auxiliares (NO son el motor principal) ---
        !contiene(nombre, 'aceleracion') &&
        !contiene(nombre, 'hidraulico') &&
        !contiene(nombre, 'hidraulica') &&
        !contiene(nombre, 'neumatico') &&
        !contiene(nombre, 'neumatica') &&
        !contiene(nombre, 'llanta') &&
        !contiene(nombre, 'freno') &&
        !contiene(nombre, 'disco') &&
        !contiene(nombre, 'pastilla') &&
        !contiene(nombre, 'zapata') &&
        !contiene(nombre, 'maza') &&
        !contiene(nombre, 'diferencial') &&
        !contiene(nombre, 'transmision') &&
        !contiene(nombre, 'caja de cambio') &&
        !contiene(nombre, 'hidraulic') &&
        !contiene(nombre, 'motorreductor') &&
        !contiene(nombre, 'moto reductor')
      );

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
      return tokens.length > 0 && tokens.every(token => tokenCoincideTolerante(nombre, token));
    }
  }
};

export const resolverRutaBusquedaCatalogo = texto => {
  const valor = String(texto || '').trim();
  if (!valor) return '/productos';
  const queryNormalizado = normalizarQueryBusqueda(valor);
  const categoria = encontrarCategoriaCatalogo(queryNormalizado);
  if (categoria) return `/productos/categorias/${slugifyCategoria(categoria)}`;
  if (queryNormalizado !== normalizarClave(valor)) {
    const categoriaOriginal = encontrarCategoriaCatalogo(valor);
    if (categoriaOriginal) return `/productos/categorias/${slugifyCategoria(categoriaOriginal)}`;
  }
  return `/productos?buscar=${encodeURIComponent(valor)}`;
};

const obtenerTokens = texto => {
  const base = normalizarClave(texto);
  if (!base) return [];
  return base.split(' ').map(t => t.trim()).filter(t => t && !PALABRAS_IGNORADAS.has(t));
};

const tokenCoincide = (nombre, token) => tokenCoincideTolerante(nombre, token);

const parseCategorias = value => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(i => String(i).trim()).filter(Boolean);
  return String(value).split(splitPattern).map(c => c.trim()).filter(Boolean);
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
        // Para "motores", SIEMPRE verificar por nombre para excluir partes
        if (categoriaNormalizada === 'motor giro' || categoriaNormalizada === 'reductor giro' || categoriaNormalizada === 'motores') {
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
  if (!nombre) return 'Otros';
  if (nombre.includes('arbol de levas') || nombre.includes('arboles de levas')) return 'Arbol de levas';
  const primeraPalabra = nombre.split(/\s+/).map(p => p.trim()).filter(p => p.length > 3 && !PALABRAS_IGNORADAS.has(p))[0];
  if (!primeraPalabra) return 'Otros';
  const capitalizada = primeraPalabra.charAt(0).toUpperCase() + primeraPalabra.slice(1);
  return normalizarCategoriaMenu(pluralizarBasico(capitalizada));
};

export const getCategoriasProducto = producto => {
  const nombreLower = normalizarTexto(producto?.nombre || '');
  const categoriasBase = producto?.categorias
    ? parseCategorias(producto.categorias)
    : (nombreLower.includes('liner kit') ? ['Liner kit'] : []);
  if (categoriasBase.length > 0) {
    const normalizadas = categoriasBase.map(c => normalizarCategoriaMenu(c)).filter(Boolean);
    return normalizadas.length > 0 ? normalizadas : [inferirCategoriaPorNombre(producto?.nombre)];
  }
  const categoriasPorBusqueda = CATEGORIAS_MENU.filter(c => productoCoincideCategoriaPorNombre(producto, c));
  if (categoriasPorBusqueda.length > 0) return categoriasPorBusqueda;
  return [inferirCategoriaPorNombre(producto?.nombre)];
};

export const getCategoriasCatalogo = productos => {
  const categoriasDetectadas = new Set();
  (productos || []).forEach(p => {
    getCategoriasProducto(p).forEach(c => { if (c) categoriasDetectadas.add(c); });
  });
  return Array.from(new Set([...CATEGORIAS_MENU, ...categoriasDetectadas]))
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
};