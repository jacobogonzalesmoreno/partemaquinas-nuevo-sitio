/**
 * busqueda-tolerante.js
 * Motor de búsqueda con tolerancia máxima para catálogo de repuestos.
 *
 * Capas de tolerancia implementadas (de mayor a menor peso):
 * 1. Coincidencia exacta tras normalización (acentos, mayúsculas)
 * 2. Todos los tokens contenidos en cualquier orden
 * 3. Coincidencia por sinónimos del dominio de repuestos
 * 4. Distancia de Levenshtein (errores tipográficos)
 * 5. Coincidencia fonética del español (b/v, c/s/z, ll/y, etc.)
 * 6. Coincidencia parcial / substring
 */

// ---------------------------------------------------------------------------
// Normalización (auto-contenida para evitar dependencias circulares)
// ---------------------------------------------------------------------------

export const normalizarClave = texto =>
  String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const slugify = texto => normalizarClave(texto).replace(/\s+/g, '-');

// ---------------------------------------------------------------------------
// 1. Distancia de Levenshtein (con early-exit optimizado)
// ---------------------------------------------------------------------------

const levenshtein = (a, b, maxDist) => {
  if (a === b) return 0;
  const max = maxDist !== undefined ? maxDist : 2;
  const la = a.length;
  const lb = b.length;

  if (la === 0) return lb <= max ? lb : max + 1;
  if (lb === 0) return la <= max ? la : max + 1;
  if (Math.abs(la - lb) > max) return max + 1;

  // Para strings cortos, permitir maxDist relativo
  const effectiveMax = la <= 3 || lb <= 3 ? Math.min(max, 1) : max;

  let prev = new Array(lb + 1);
  let curr = new Array(lb + 1);

  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    const rowMin = Math.max(1, i - effectiveMax);
    const rowMax = Math.min(lb, i + effectiveMax);

    for (let j = 1; j < rowMin; j++) curr[j] = effectiveMax + 1;

    for (let j = rowMin; j <= rowMax; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }

    for (let j = rowMax + 1; j <= lb; j++) curr[j] = effectiveMax + 1;

    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[lb];
};

// ---------------------------------------------------------------------------
// 2. Normalización fonética del español
// ---------------------------------------------------------------------------

const normalizarFonetico = texto => {
  let s = normalizarClave(texto);

  // Orden importa: ll antes de l, ch antes de c
  s = s.replace(/ll/g, 'y');
  s = s.replace(/ch/g, 'ch'); // se mantiene, sonido único

  // Confusiones fonéticas más comunes en español
  s = s.replace(/v/g, 'b');       // v suena como b
  s = s.replace(/z/g, 's');       // z → s (seseo latinoamericano)
  s = s.replace(/x/g, 's');       // x → s (en la mayoría de contextos)
  // c antes de e,i → s; antes de a,o,u → k  (simplificado: todo → s)
  // Para búsqueda, prefiero el seseo (más tolerante)
  s = s.replace(/c/g, 's');
  // g antes de e,i → j (sonido similar); antes de a,o,u → g
  // Simplificado: g fuerte → g, suave → j
  s = s.replace(/ge/g, 'je');
  s = s.replace(/gi/g, 'ji');

  // Quitar h mudas (pero no si está al inicio por si acaso)
  // Dejamos h ya que la normalización previa ya quitó acentos

  return s.replace(/\s+/g, ' ').trim();
};

// ---------------------------------------------------------------------------
// 3. Mapa de sinónimos del dominio de repuestos
// ---------------------------------------------------------------------------

const SINONIMOS = new Map([
  // --- Empaquetaduras / Juntas ---
  ['junta', ['empaquetadura', 'empaquetaduras', 'juntas', 'gasket', 'seal']],
  ['juntas', ['empaquetadura', 'empaquetaduras', 'junta', 'gasket', 'seal']],
  ['empaquetadura', ['junta', 'juntas', 'empaquetaduras', 'gasket', 'seal']],
  ['empaquetaduras', ['junta', 'juntas', 'empaquetadura', 'gasket', 'seal']],
  ['gasket', ['empaquetadura', 'empaquetaduras', 'junta', 'juntas', 'seal']],
  ['seal', ['sello', 'sellos', 'empaquetadura', 'junta', 'juntas']],

  // --- Balineras / Rodamientos ---
  ['rodamiento', ['balinera', 'balineras', 'rodamientos', 'bearing', 'bearings']],
  ['rodamientos', ['balinera', 'balineras', 'rodamiento', 'bearing', 'bearings']],
  ['balinera', ['rodamiento', 'rodamientos', 'balineras', 'bearing', 'bearings']],
  ['balineras', ['rodamiento', 'rodamientos', 'balinera', 'bearing', 'bearings']],
  ['bearing', ['balinera', 'balineras', 'rodamiento', 'rodamientos']],
  ['bearings', ['balinera', 'balineras', 'rodamiento', 'rodamientos']],
  ['cojinete', ['balinera', 'balineras', 'rodamiento', 'rodamientos']],

  // --- Turbos ---
  ['turbo', ['turbos', 'turbocompresor', 'turbocompresores']],
  ['turbos', ['turbo', 'turbocompresor', 'turbocompresores']],
  ['turbocompresor', ['turbo', 'turbos', 'turbocompresores']],
  ['turbocompresores', ['turbo', 'turbos', 'turbocompresor']],

  // --- Filtros ---
  ['filtro', ['filtros', 'filter']],
  ['filtros', ['filtro', 'filter']],
  ['filter', ['filtro', 'filtros']],

  // --- Soportes ---
  ['soporte', ['soportes', 'soporteria', 'support', 'bracket', 'montura']],
  ['soportes', ['soporte', 'soporteria', 'support', 'bracket', 'montura']],
  ['soporteria', ['soporte', 'soportes']],
  ['support', ['soporte', 'soportes', 'bracket']],
  ['bracket', ['soporte', 'soportes', 'montura']],
  ['montura', ['soporte', 'soportes', 'bracket']],

  // --- Coronas / Engranajes ---
  ['corona', ['coronas', 'engranaje', 'engranajes', 'gear']],
  ['coronas', ['corona', 'engranaje', 'engranajes', 'gear']],
  ['engranaje', ['engranajes', 'corona', 'coronas', 'gear']],
  ['engranajes', ['engranaje', 'corona', 'coronas', 'gear']],
  ['gear', ['engranaje', 'engranajes', 'corona', 'coronas', 'piñon']],

  // --- Piñones ---
  ['piñon', ['piñones', 'pinon', 'pinones', 'engranaje']],
  ['piñones', ['piñon', 'pinon', 'pinones', 'engranaje']],
  ['pinon', ['piñon', 'piñones', 'pinones', 'engranaje']],
  ['pinones', ['piñon', 'piñones', 'pinon', 'engranaje']],
  ['solares', ['solar', 'piñon solar']],
  ['solar', ['solares', 'piñon solar']],
  ['planetario', ['planetarios', 'piñon planetario']],
  ['planetarios', ['planetario', 'piñon planetario']],

  // --- Casquetes ---
  ['casquete', ['casquetes', 'cojinete']],
  ['casquetes', ['casquete', 'cojinete']],

  // --- Válvulas ---
  ['valvula', ['valvulas', 'bomba de valvulas', 'valve']],
  ['valvulas', ['valvula', 'bomba de valvulas', 'valve']],
  ['valve', ['valvula', 'valvulas']],
  ['tapa valvulas', ['tapa de valvulas', 'tapavalvulas', 'tapa valvula']],
  ['tapa de valvulas', ['tapa valvulas', 'tapavalvulas']],
  ['tapavalvulas', ['tapa valvulas', 'tapa de valvulas']],

  // --- Árbol de levas ---
  ['arbol', ['arboles', 'arbol de levas', 'shaft']],
  ['arboles', ['arbol', 'arbol de levas', 'shaft']],
  ['leva', ['levas', 'arbol de levas']],
  ['levas', ['leva', 'arbol de levas']],
  ['shaft', ['eje', 'ejes', 'arbol', 'cigueñal']],

  // --- Cigüeñales ---
  ['cigueñal', ['ciguenal', 'cigueñales', 'cigüeñal', 'cigüeñales', 'cigunial']],
  ['ciguenal', ['cigueñal', 'cigueñales', 'cigüeñal', 'cigüeñales']],
  ['cigüeñal', ['cigueñal', 'ciguenal', 'cigueñales', 'cigüeñales']],

  // --- Culatas ---
  ['culata', ['culatas', 'cabeza', 'cabezas', 'cylinder head']],
  ['culatas', ['culata', 'cabeza', 'cabezas']],
  ['cabeza', ['culata', 'culatas']],

  // --- Bloques ---
  ['bloque', ['bloques', 'block', 'blocks', 'block de motor']],
  ['bloques', ['bloque', 'block', 'blocks']],
  ['block', ['bloque', 'bloques', 'blocks']],

  // --- Radiadores ---
  ['radiador', ['radiadores', 'radiator', 'cooler']],
  ['radiadores', ['radiador', 'radiator', 'cooler']],
  ['radiator', ['radiador', 'radiadores', 'cooler']],
  ['cooler', ['radiador', 'radiadores', 'radiator', 'enfriador']],
  ['enfriador', ['radiador', 'radiadores', 'cooler']],

  // --- Ventiladores ---
  ['ventilador', ['ventiladores', 'fan', 'abanico']],
  ['ventiladores', ['ventilador', 'fan', 'abanico']],
  ['fan', ['ventilador', 'ventiladores', 'abanico']],
  ['abanico', ['ventilador', 'ventiladores', 'fan']],

  // --- Correas ---
  ['correa', ['correas', 'banda', 'bandas', 'belt']],
  ['correas', ['correa', 'banda', 'bandas', 'belt']],
  ['banda', ['correa', 'correas', 'bandas', 'belt']],
  ['bandas', ['correa', 'correas', 'banda', 'belt']],
  ['belt', ['correa', 'correas', 'banda', 'bandas']],

  // --- Tubos / Mangueras ---
  ['tuberia', ['tuberias', 'manguera', 'mangueras', 'tubo', 'tubos', 'hose']],
  ['tuberias', ['tuberia', 'manguera', 'mangueras', 'tubo', 'tubos', 'hose']],
  ['manguera', ['tuberia', 'tuberias', 'mangueras', 'tubo', 'tubos', 'hose']],
  ['mangueras', ['tuberia', 'tuberias', 'manguera', 'tubo', 'tubos', 'hose']],
  ['tubo', ['tuberia', 'tuberias', 'manguera', 'mangueras', 'tubos', 'hose']],
  ['tubos', ['tuberia', 'tuberias', 'manguera', 'mangueras', 'tubo', 'hose']],
  ['hose', ['manguera', 'mangueras', 'tuberia', 'tubo']],

  // --- Inyectores ---
  ['inyector', ['inyectores', 'injetor', 'inyeccion']],
  ['inyectores', ['inyector', 'injetor', 'inyeccion']],
  ['inyeccion', ['inyector', 'inyectores', 'injeccion']],
  ['injeccion', ['inyeccion', 'inyector', 'inyectores']],
  ['injection', ['inyeccion', 'inyector', 'inyectores']],

  // --- Bombas ---
  ['bomba', ['bombas', 'pump', 'bomba de aceite', 'bomba de inyeccion']],
  ['bombas', ['bomba', 'pump']],
  ['pump', ['bomba', 'bombas']],

  // --- Aceite ---
  ['aceite', ['lubricante', 'lubricantes', 'oil']],
  ['lubricante', ['aceite', 'lubricantes', 'oil']],
  ['oil', ['aceite', 'lubricante', 'lubricantes']],

  // --- Reductores ---
  ['reductor', ['reductores', 'caja reductora', 'caja de reduccion', 'gearbox']],
  ['reductores', ['reductor', 'caja reductora', 'caja de reduccion']],
  ['caja reductora', ['reductor', 'reductores']],

  // --- Carrier ---
  ['carrier', ['carriers', 'carier', 'cariers', 'carrer']],
  ['carriers', ['carrier', 'carier', 'cariers']],

  // --- Motores ---
  ['motor', ['motores', 'motorreductor']],
  ['motores', ['motor', 'motorreductor']],
  ['moto reductor', ['motorreductor', 'motor reductor', 'motor-reductor']],
  ['motor reductor', ['motorreductor', 'moto reductor', 'motor-reductor']],
  ['motor-reductor', ['motorreductor', 'moto reductor', 'motor reductor']],

  // --- Ejes ---
  ['eje', ['ejes', 'axis', 'flecha', 'flechas']],
  ['ejes', ['eje', 'axis', 'flecha', 'flechas']],
  ['axis', ['eje', 'ejes']],
  ['flecha', ['eje', 'ejes', 'flechas']],

  // --- Kits ---
  ['kit', ['juego', 'conjunto', 'kits']],
  ['kits', ['kit', 'juego', 'conjunto']],
  ['juego', ['kit', 'conjunto', 'juegos']],
  ['conjunto', ['kit', 'juego', 'conjuntos']],

  // --- Liner ---
  ['liner', ['liner kit', 'camisa', 'camisas', 'sleeve']],
  ['camisa', ['liner', 'liner kit', 'camisas', 'sleeve']],
  ['camisas', ['liner', 'liner kit', 'camisa', 'sleeve']],
  ['sleeve', ['liner', 'liner kit', 'camisa', 'camisas']],

  // --- Otros repuestos ---
  ['tapavalvulas', ['tapa de valvulas', 'tapa valvulas']],
  ['bomba inyeccion', ['bomba de inyeccion', 'bomba inyectora', 'bomba inyeccion']],
  ['bomba de inyeccion', ['bomba inyeccion', 'bomba inyectora']],
  ['bomba inyectora', ['bomba inyeccion', 'bomba de inyeccion']],
  ['bomba aceite', ['bomba de aceite']],
  ['bomba de aceite', ['bomba aceite']],
  ['motor giro', ['motor de giro']],
  ['motor de giro', ['motor giro']],
  ['tapa', ['tapa valvulas', 'tapa de valvulas']],
  ['banco', ['banco de valvulas']],
  ['injetor', ['inyector', 'inyectores']],
  ['injedor', ['inyector', 'inyectores']],
  ['filto', ['filtro', 'filtros']],
  ['flitro', ['filtro', 'filtros']],

  // --- Balancines / Rocker arms ---
  ['balancin', ['balancines', 'rocker arm', 'balancin de valvulas', 'balancin inyeccion']],
  ['balancines', ['balancin', 'rocker arm', 'balancin de valvulas']],
  ['rocker arm', ['balancin', 'balancines', 'balancin de valvulas']],
  ['balancing', ['balancin', 'balancines', 'balanceo']],
  ['eje de balancin', ['balancin', 'balancines', 'eje balancin']],
  ['eje balancin', ['balancin', 'balancines', 'eje de balancin']],
  ['eject de balancing', ['eje de balancin', 'balancin', 'balancing']],
  ['flauta', ['eje de balancin', 'balancin']],

  // --- Términos adicionales del dominio ---
  ['pistón', ['piston', 'pistones', 'piston de motor']],
  ['piston', ['piston', 'pistones', 'pistón']],
  ['pistones', ['piston', 'pistón']],
  ['anillo', ['anillos', 'segmento', 'segmentos', 'ring', 'rings', 'aros']],
  ['anillos', ['anillo', 'segmento', 'segmentos', 'ring', 'rings', 'aros']],
  ['segmento', ['anillo', 'anillos', 'segmentos']],
  ['segmentos', ['anillo', 'anillos', 'segmento']],
  ['aros', ['anillo', 'anillos', 'aro']],
  ['aro', ['anillo', 'anillos', 'aros']],
  ['bulon', ['bulones', 'perno', 'pernos', 'bolt']],
  ['bulones', ['bulon', 'perno', 'pernos', 'bolt']],
  ['perno', ['bulon', 'bulones', 'pernos', 'bolt']],
  ['pernos', ['bulon', 'bulones', 'perno', 'bolt']],
  ['reten', ['retenes', 'sellos', 'sello', 'retén', 'retienes', 'seal']],
  ['retenes', ['reten', 'sellos', 'sello', 'retén', 'seal']],
  ['buje', ['bujes', 'bush', 'bushing', 'casquillo']],
  ['bujes', ['buje', 'bush', 'bushing', 'casquillo']],
  ['casquillo', ['buje', 'bujes', 'bush', 'bushing']],
  ['turbina', ['turbo', 'turbos', 'turbocompresor']],
  ['cepillo', ['cepillos', 'escobilla', 'escobillas', 'brush']],
  ['escobilla', ['cepillo', 'cepillos', 'escobillas', 'brush']],
  ['escobillas', ['cepillo', 'cepillos', 'escobilla', 'brush']],
  ['manguito', ['manguitos', 'bush', 'bushing']],
  ['cruceta', ['crucetas', 'junta universal', 'u-joint']],
  ['junta universal', ['cruceta', 'crucetas', 'u-joint']],
  ['resorte', ['resortes', 'spring', 'springs', 'elasticos']],
  ['resortes', ['resorte', 'spring', 'springs']],
  ['tensor', ['tensores', 'tensor de cadena', 'tensor de correa']],
  ['tensores', ['tensor', 'tensor de cadena']],
  ['guaya', ['guayas', 'cable', 'cables', 'wire']],
  ['cable', ['cables', 'guaya', 'guayas', 'wire']],
  ['guaya', ['guayas', 'cable', 'cables']],
  ['cilindro', ['cilindros', 'cylinder']],
  ['cilindros', ['cilindro', 'cylinder']],
  ['carburador', ['carburadores', 'carburetor']],
  ['bomba de agua', ['bomba agua', 'water pump']],
  ['alternador', ['alternadores', 'alternator']],
  ['arranque', ['motor de arranque', 'starter', 'starter motor']],
  ['starter', ['arranque', 'motor de arranque']],
  ['dynamo', ['dina', 'dinamo', 'alternador']],
  ['dina', ['dynamo', 'dinamo']],
  ['embrague', ['embragues', 'clutch']],
  ['clutch', ['embrague', 'embragues']],
  ['diferencial', ['diferenciales', 'differential']],
  ['transmision', ['transmisiones', 'transmission', 'caja de cambios']],
  ['caja de cambios', ['transmision', 'transmission']],
  ['hidraulico', ['hidraulica', 'hydraulic']],
  ['neumatico', ['neumaticos', 'llanta', 'llantas', 'tire', 'tires']],
  ['llanta', ['llantas', 'neumatico', 'neumaticos', 'tire']],
  ['frenos', ['freno', 'brake', 'brakes', 'pastillas de freno']],
  ['freno', ['frenos', 'brake', 'brakes', 'pastillas de freno']],
  ['brake', ['freno', 'frenos', 'brakes']],
  ['pastilla de freno', ['frenos', 'freno', 'brake', 'pastillas']],
  ['disco', ['discos', 'brake disc', 'disco de freno']],
  ['disco de freno', ['discos', 'brake disc', 'freno']],
  ['amortiguador', ['amortiguadores', 'shock', 'shocks', 'damper']],
  ['amortiguadores', ['amortiguador', 'shock', 'shocks', 'damper']],
  ['shock', ['amortiguador', 'amortiguadores', 'damper']],
  ['bisagra', ['bisagras', 'hinge', 'hinges']],
  ['pasador', ['pasadores', 'pin', 'pins']],
  ['pin', ['pasador', 'pasadores', 'pins']],
  ['ruleman', ['rulemanes', 'rodamiento', 'rodamientos', 'balinera', 'bearing']],
  ['rulemanes', ['ruleman', 'rodamiento', 'rodamientos', 'balinera', 'bearing']],
  ['cigüeñal', ['cigueñal', 'ciguenal', 'cigueñales']],
]);

// Construir índice inverso: cada sinónimo apunta a la clave canónica
const sinonimosIndice = new Map();
for (const [clave, alternativas] of SINONIMOS) {
  const claveNorm = normalizarClave(clave);
  sinonimosIndice.set(claveNorm, claveNorm);
  for (const alt of alternativas) {
    const altNorm = normalizarClave(alt);
    if (!sinonimosIndice.has(altNorm)) {
      sinonimosIndice.set(altNorm, claveNorm);
    }
  }
}

// Obtener todos los sinónimos (incluida la clave) para un token dado
const obtenerSinonimos = token => {
  const tokenNorm = normalizarClave(token);
  const raiz = sinonimosIndice.get(tokenNorm);
  if (!raiz) return [tokenNorm];

  const resultados = new Set([tokenNorm, raiz]);
  const alternativas = SINONIMOS.get(raiz) || SINONIMOS.get(token);
  if (alternativas) {
    for (const alt of alternativas) {
      resultados.add(normalizarClave(alt));
    }
  }
  // También buscar en SINONIMOS si la clave normalizada directa no está
  if (!alternativas) {
    for (const [k, vals] of SINONIMOS) {
      if (normalizarClave(k) === raiz) {
        for (const v of vals) resultados.add(normalizarClave(v));
        break;
      }
    }
  }

  return Array.from(resultados);
};

// ---------------------------------------------------------------------------
// 4. Tokenización (con stop words)
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'y', 'para', 'por', 'con', 'sin',
  'en', 'al', 'un', 'una', 'unos', 'unas', 'a', 'e', 'o', 'u', 'su', 'sus',
  'mi', 'tu', 'se', 'es', 'son', 'que', 'the', 'and', 'for', 'with',
]);

const tokenizar = texto => {
  const base = normalizarClave(texto);
  if (!base) return [];
  return base
    .split(/[\s,;|/\\\-_.]+/)
    .map(t => t.trim())
    .filter(t => t && !STOP_WORDS.has(t) && t.length > 1);
};

// ---------------------------------------------------------------------------
// 5. Puntuación de coincidencias
// ---------------------------------------------------------------------------

const PESOS = {
  EXACTA: 100,
  TODOS_TOKENS_CONTENIDOS: 85,
  SINONIMO: 70,
  LEVENSHTEIN_0: 100,   // = exacta
  LEVENSHTEIN_1: 60,
  LEVENSHTEIN_2: 35,
  FONETICA: 45,
  SUBSTRING: 25,
  TOKEN_PARCIAL: 20,
  BONUS_INICIO: 10,     // bonus si el match está al inicio
  BONUS_ORDEN: 5,       // bonus si el orden de tokens coincide
  PENALIZACION_LONGITUD: 0.5, // penalización por diferencia de longitud
};

/**
 * Compara un token de consulta contra un token objetivo y retorna un puntaje.
 * Retorna 0 si no hay coincidencia significativa.
 */
const puntuarToken = (tokenQ, tokenO) => {
  if (!tokenQ || !tokenO) return 0;

  // 1. Exacta
  if (tokenQ === tokenO) return PESOS.EXACTA;

  // 2. Substring: el query está contenido en el objetivo (ej: "bomba" ⊂ "bomba inyeccion")
  if (tokenO.includes(tokenQ) || tokenQ.includes(tokenO)) {
    const base = PESOS.SUBSTRING;
    const bonusInicio = tokenO.startsWith(tokenQ) ? PESOS.BONUS_INICIO : 0;
    const ratioLongitud = Math.min(tokenQ.length, tokenO.length) / Math.max(tokenQ.length, tokenO.length);
    return base + bonusInicio + (ratioLongitud * 10);
  }

  // 3. Sinónimos
  const sinonimosQ = obtenerSinonimos(tokenQ);
  const sinonimosO = obtenerSinonimos(tokenO);
  const interseccion = sinonimosQ.filter(s => sinonimosO.includes(s));
  if (interseccion.length > 0) {
    // La intersección incluye las formas normalizadas que comparten raíz sinonímica
    return PESOS.SINONIMO + (interseccion.length > 1 ? 10 : 0);
  }

  // 4. Levenshtein
  const dist = levenshtein(tokenQ, tokenO, 2);
  if (dist === 1) return PESOS.LEVENSHTEIN_1;
  if (dist === 2) {
    // Solo aceptar distancia 2 si las palabras son >= 5 chars
    const minLen = Math.min(tokenQ.length, tokenO.length);
    return minLen >= 5 ? PESOS.LEVENSHTEIN_2 : 0;
  }

  // 5. Fonética
  const fonQ = normalizarFonetico(tokenQ);
  const fonO = normalizarFonetico(tokenO);
  if (fonQ === fonO && fonQ.length >= 3) return PESOS.FONETICA;

  // 6. Fonetica + substring parcial
  if (fonO.includes(fonQ) || fonQ.includes(fonO)) {
    const ratioLongitud = Math.min(fonQ.length, fonO.length) / Math.max(fonQ.length, fonO.length);
    if (ratioLongitud >= 0.6) return PESOS.TOKEN_PARCIAL;
  }

  return 0;
};

/**
 * Compara una consulta (string) contra un texto objetivo (string).
 * Tokeniza ambos y calcula el mejor puntaje de matching.
 *
 * @param {string} query - Texto de búsqueda del usuario
 * @param {string} target - Texto contra el cual buscar
 * @returns {{ puntuacion: number, tipo: string }}
 */
export const puntuarCoincidencia = (query, target) => {
  if (!query || !target) return { puntuacion: 0, tipo: 'ninguna' };

  const queryNorm = normalizarClave(query);
  const targetNorm = normalizarClave(target);

  // 1. Coincidencia exacta total
  if (queryNorm === targetNorm) {
    return { puntuacion: PESOS.EXACTA + 50, tipo: 'exacta' };
  }

  // 2. Coincidencia slug
  if (slugify(query) === slugify(target)) {
    return { puntuacion: PESOS.EXACTA + 40, tipo: 'exacta_slug' };
  }

  const queryTokens = tokenizar(query);
  const targetTokens = tokenizar(target);

  if (queryTokens.length === 0) return { puntuacion: 0, tipo: 'ninguna' };

  // 3. Todos los tokens de query están contenidos en target (en cualquier orden)
  const todosContenidos = queryTokens.every(qt =>
    targetNorm.includes(qt) || targetTokens.some(tt => tt === qt)
  );
  if (todosContenidos) {
    // Bonus si el orden de tokens también coincide
    const ordenCoincide = queryTokens.every((qt, i) => {
      const idx = targetTokens.indexOf(qt);
      return i === 0 || idx > targetTokens.indexOf(queryTokens[i - 1]);
    });
    return {
      puntuacion: PESOS.TODOS_TOKENS_CONTENIDOS + (ordenCoincide ? PESOS.BONUS_ORDEN : 0),
      tipo: 'todos_contenidos',
    };
  }

  // 4. Puntuación por tokens (fuzzy, sinónimos, fonética)
  let maxPuntuacion = 0;
  let mejorTipo = 'ninguna';
  let tokensMatcheados = 0;

  for (const qt of queryTokens) {
    let mejorPuntToken = 0;
    let mejorTipoToken = 'ninguna';

    for (const tt of targetTokens) {
      const punt = puntuarToken(qt, tt);
      if (punt > mejorPuntToken) {
        mejorPuntToken = punt;
        if (punt >= PESOS.EXACTA) mejorTipoToken = 'exacta';
        else if (punt >= PESOS.SINONIMO) mejorTipoToken = 'sinonimo';
        else if (punt >= PESOS.LEVENSHTEIN_1) mejorTipoToken = 'levenshtein';
        else if (punt >= PESOS.FONETICA) mejorTipoToken = 'fonetica';
        else mejorTipoToken = 'parcial';
      }
    }

    // También intentar contra el target completo (para substring largo)
    if (targetNorm.includes(qt)) {
      const punt = PESOS.SUBSTRING + PESOS.BONUS_INICIO;
      if (punt > mejorPuntToken) {
        mejorPuntToken = punt;
        mejorTipoToken = 'substring';
      }
    }

    // Sinónimos contra el target completo
    const sinonimos = obtenerSinonimos(qt);
    for (const sin of sinonimos) {
      if (sin !== qt && targetNorm.includes(sin)) {
        const punt = PESOS.SINONIMO;
        if (punt > mejorPuntToken) {
          mejorPuntToken = punt;
          mejorTipoToken = 'sinonimo';
        }
      }
    }

    if (mejorPuntToken > 0) tokensMatcheados++;
    maxPuntuacion += mejorPuntToken;
    if (mejorPuntToken > (mejorTipo === 'ninguna' ? 0 : 0)) {
      mejorTipo = mejorTipoToken;
    }
  }

  // Proporción de tokens que coincidieron
  const proporcion = tokensMatcheados / queryTokens.length;

  // Penalizar si no todos los tokens coincidieron
  const penalizacion = (1 - proporcion) * 30;

  // Bonus si la query es corta (1-2 tokens) y hay match parcial
  const bonusQueryCorta = queryTokens.length <= 2 && tokensMatcheados > 0 ? 10 : 0;

  const puntuacionFinal = Math.max(0, maxPuntuacion - penalizacion + bonusQueryCorta);

  if (puntuacionFinal < 15) return { puntuacion: 0, tipo: 'ninguna' };

  return { puntuacion: puntuacionFinal, tipo: mejorTipo };
};

// ---------------------------------------------------------------------------
// 6. Búsqueda fuzzy contra una lista de categorías
// ---------------------------------------------------------------------------

/**
 * Busca la mejor coincidencia de categoría para un texto de consulta.
 *
 * @param {string} query - Texto de búsqueda
 * @param {string[]} categoriasFlat - Lista plana de nombres de categorías
 * @param {number} umbral - Puntuación mínima para considerar coincidencia (default 25)
 * @returns {{ categoria: string, puntuacion: number, tipo: string } | null}
 */
export const buscarCategoriaFuzzy = (query, categoriasFlat, umbral = 25) => {
  if (!query || !categoriasFlat?.length) return null;

  const queryNorm = normalizarClave(query);
  if (!queryNorm) return null;

  let mejorResultado = null;

  for (const cat of categoriasFlat) {
    const { puntuacion, tipo } = puntuarCoincidencia(queryNorm, cat);

    if (puntuacion >= umbral && (!mejorResultado || puntuacion > mejorResultado.puntuacion)) {
      mejorResultado = { categoria: cat, puntuacion, tipo };
    }
  }

  return mejorResultado;
};

// ---------------------------------------------------------------------------
// 7. Búsqueda fuzzy contra productos
// ---------------------------------------------------------------------------

/**
 * Busca productos que coincidan con la consulta usando tolerancia.
 *
 * @param {string} query - Texto de búsqueda
 * @param {Array<{ nombre: string, marcas?: string, categorias?: string }>} productos
 * @param {number} umbral - Puntuación mínima (default 20)
 * @returns {Array<{ producto: object, puntuacion: number, tipo: string }>}
 */
export const buscarProductosFuzzy = (query, productos, umbral = 20) => {
  if (!query || !productos?.length) return [];

  const resultados = [];

  for (const producto of productos) {
    // Buscar contra múltiples campos del producto
    const campos = [
      producto.nombre || '',
      producto.marcas || '',
      ...(Array.isArray(producto.categorias)
        ? producto.categorias
        : typeof producto.categorias === 'string'
          ? producto.categorias.split(/[,;|]+/)
          : []),
    ].join(' ');

    const { puntuacion, tipo } = puntuarCoincidencia(query, campos);

    if (puntuacion >= umbral) {
      resultados.push({ producto, puntuacion, tipo });
    }
  }

  // Ordenar por puntuación descendente
  resultados.sort((a, b) => b.puntuacion - a.puntuacion);

  return resultados;
};

// ---------------------------------------------------------------------------
// 8. Generador de sugerencias para autocompletado
// ---------------------------------------------------------------------------

/**
 * Genera sugerencias de categorías para el autocompletado de la navbar.
 * Retorna un array ordenado por relevancia.
 *
 * @param {string} query - Texto parcial del usuario
 * @param {Array} menuCategorias - Jerarquía de categorías (MENU_CATEGORIAS)
 * @param {number} maxSugerencias - Máximo de sugerencias a retornar (default 8)
 * @returns {Array<{ texto: string, href: string, tipo: string, nivel: number, puntuacion: number }>}
 */
export const generarSugerencias = (query, menuCategorias, maxSugerencias = 8) => {
  if (!query || !menuCategorias?.length) return [];

  const queryNorm = normalizarClave(query);
  if (!queryNorm || queryNorm.length < 1) return [];

  const resultados = [];
  const umbral = queryNorm.length <= 2 ? 50 : 25;

  // Recorrer la jerarquía y evaluar cada nodo
  const recorrer = (nodos, nivel, prefijo) => {
    for (const nodo of nodos) {
      const nombre = nodo.nombre || '';
      const rutaCompleta = prefijo ? `${prefijo} > ${nombre}` : nombre;

      const { puntuacion, tipo } = puntuarCoincidencia(queryNorm, nombre);

      if (puntuacion >= umbral) {
        resultados.push({
          texto: nombre,
          textoCompleto: rutaCompleta,
          href: `/productos/categorias/${slugify(nombre)}`,
          tipo: nivel === 0 ? 'Categoría' : nivel === 1 ? 'Subcategoría' : 'Subnivel',
          nivel,
          puntuacion: puntuacion + (nivel === 0 ? 5 : 0), // leve preferencia por categorías padre
          tipoMatch: tipo,
        });
      }

      // Si la query tiene 3+ chars, también buscar en subcategorías
      if (nodo.hijos?.length && queryNorm.length >= 1) {
        recorrer(nodo.hijos, nivel + 1, rutaCompleta);
      }
    }
  };

  recorrer(menuCategorias, 0, '');

  // Ordenar por puntuación descendente
  resultados.sort((a, b) => b.puntuacion - a.puntuacion);

  // Limitar y eliminar duplicados (misma href)
  const vistas = new Set();
  return resultados.filter(r => {
    if (vistas.has(r.href)) return false;
    vistas.add(r.href);
    return true;
  }).slice(0, maxSugerencias);
};

// ---------------------------------------------------------------------------
// 9. Función de coincidencia de tokens para productoCoincideCategoriaPorNombre
// ---------------------------------------------------------------------------

/**
 * Versión mejorada de tokenCoincide con tolerancia.
 * Reemplaza a la función original del archivo catalogo-categorias.js.
 *
 * @param {string} nombre - Nombre del producto (ya normalizado)
 * @param {string} token - Token de la categoría (ya normalizado)
 * @returns {boolean}
 */
export const tokenCoincideTolerante = (nombre, token) => {
  if (!token || !nombre) return false;

  // Exacta
  if (nombre.includes(token)) return true;

  // Plural/singular
  const singular = token.endsWith('es')
    ? token.slice(0, -2)
    : (token.endsWith('s') ? token.slice(0, -1) : token);
  if (singular && singular !== token && nombre.includes(singular)) return true;

  const plural = token.endsWith('s')
    ? token
    : (token.endsWith('z') ? `${token.slice(0, -1)}ces` : `${token}s`);
  if (plural !== token && nombre.includes(plural)) return true;

  // Levenshtein: permitir 1 error para tokens >= 4 chars
  if (token.length >= 4) {
    // Buscar substrings del nombre que sean fuzzy-match del token
    const palabrasNombre = nombre.split(/[\s,;|/\\\-_.]+/).filter(p => p.length > 2);
    for (const palabra of palabrasNombre) {
      const dist = levenshtein(token, palabra, 2);
      if (dist <= 1) return true;
      if (dist === 2 && Math.min(token.length, palabra.length) >= 5) return true;
    }
  }

  // Sinónimos
  const sinonimos = obtenerSinonimos(token);
  for (const sin of sinonimos) {
    if (sin !== token && nombre.includes(sin)) return true;
  }

  // Fonética
  const tokenFon = normalizarFonetico(token);
  if (tokenFon.length >= 4) {
    const palabrasNombre = nombre.split(/[\s,;|/\\\-_.]+/).filter(p => p.length > 2);
    for (const palabra of palabrasNombre) {
      const palabraFon = normalizarFonetico(palabra);
      if (tokenFon === palabraFon) return true;
    }
  }

  return false;
};

// ---------------------------------------------------------------------------
// 10. Función auxiliar: normalizar query antes de enviarla
// ---------------------------------------------------------------------------

/**
 * Normaliza un query de búsqueda para máxima tolerancia.
 * Puede ser usado antes de enviar al backend o para comparaciones.
 */
export const normalizarQueryBusqueda = texto => {
  let s = normalizarClave(texto);

  // Correcciones de errores comunes de transcripción
  s = s.replace(/\bcarier\b/g, 'carrier');
  s = s.replace(/\bcariers\b/g, 'carrier');
  s = s.replace(/\bcarrer\b/g, 'carrier');
  s = s.replace(/\bmoto\s+reductor\b/g, 'motorreductor');
  s = s.replace(/\bmotor\s+reductor\b/g, 'motorreductor');
  s = s.replace(/\bfilto\b/g, 'filtro');
  s = s.replace(/\bflitro\b/g, 'filtro');
  s = s.replace(/\binjeton\b/g, 'inyector');
  s = s.replace(/\binjedor\b/g, 'inyector');
  s = s.replace(/\binjeccion\b/g, 'inyeccion');
  s = s.replace(/\binjetcion\b/g, 'inyeccion');
  s = s.replace(/\bbombba\b/g, 'bomba');
  s = s.replace(/\bredutor\b/g, 'reductor');
  s = s.replace(/\bventlador\b/g, 'ventilador');
  s = s.replace(/\bventiladr\b/g, 'ventilador');
  s = s.replace(/\bempaquetdura\b/g, 'empaquetadura');
  s = s.replace(/\bengranje\b/g, 'engranaje');
  s = s.replace(/\bbalnera\b/g, 'balinera');
  s = s.replace(/\bvalula\b/g, 'valvula');
  s = s.replace(/\bculatta\b/g, 'culata');
  s = s.replace(/\bbloqeu\b/g, 'bloque');
  s = s.replace(/\brodamieto\b/g, 'rodamiento');
  s = s.replace(/\bcasqute\b/g, 'casquete');
  s = s.replace(/\bturbocompreso\b/g, 'turbocompresor');

  return s.replace(/\s+/g, ' ').trim();
};

// ---------------------------------------------------------------------------
// 11. Utilidad de debounce
// ---------------------------------------------------------------------------

/**
 * Crea una función debounced. Ideal para el input de búsqueda.
 * @param {Function} fn - Función a ejecutar
 * @param {number} delay - Retardo en ms (default 200)
 */
export const crearDebounce = (fn, delay = 200) => {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
};