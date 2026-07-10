'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';

const generarId = () => Math.random().toString(36).slice(2, 10);

const CATEGORIAS = [
  'Accesorios', 'Arboles De Levas', 'Balineras', 'Banco Valvulas', 'Bloques',
  'Bomba Aceite', 'Bomba Inyeccion', 'Carrier Externo Traslacion', 'Carrier Inferior Giro',
  'Carrier Interno Traslacion', 'Carrier Superior Giro', 'Casquetes', 'Cigueñales',
  'Coronas', 'Correas', 'Culatas', 'Ejes Traslacion', 'Empaquetaduras', 'Filtros',
  'Giro', 'Inyectores', 'Liner kit', 'Motor', 'Motor Giro', 'Motores',
  'Motorreductor Traslacion', 'Piñones', 'Piñones Traslacion', 'Planetario',
  'Radiadores', 'Reductor Giro', 'Reductor Traslacion', 'Solares', 'Soportes',
  'Tapa Valvulas', 'Traslacion', 'Tuberia Inyeccion', 'Turbos', 'Ventiladores',
];

const normalizar = texto =>
  (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const comprimirImagen = (file, maxDim = 1600, calidad = 0.82) =>
  new Promise(resolve => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          calidad
        );
      };
      img.onerror = () => resolve(file);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });

const sugerirCategorias = nombre => {
  const nombreNorm = normalizar(nombre);
  if (!nombreNorm.trim()) return [];

  const puntuadas = CATEGORIAS.map(cat => {
    const palabras = normalizar(cat).split(/\s+/).filter(Boolean);
    const coincidencias = palabras.filter(p => nombreNorm.includes(p)).length;
    return { cat, coincidencias, totalPalabras: palabras.length };
  }).filter(item => item.coincidencias > 0);

  if (puntuadas.length === 0) return [];

  // Prioriza coincidencias mas especificas (mas palabras del nombre de categoria encontradas)
  const maxCoincidencias = Math.max(...puntuadas.map(p => p.coincidencias));
  const completas = puntuadas.filter(p => p.coincidencias === p.totalPalabras);

  if (completas.length > 0) {
    // De las coincidencias completas, prioriza las mas especificas (mas palabras)
    const maxEspecificidad = Math.max(...completas.map(p => p.totalPalabras));
    return completas
      .filter(p => p.totalPalabras === maxEspecificidad)
      .map(p => p.cat);
  }

  return puntuadas
    .filter(p => p.coincidencias === maxCoincidencias)
    .map(p => p.cat)
    .slice(0, 4);
};

export default function CargaMasivaPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [validandoSesion, setValidandoSesion] = useState(true);
  const [lotes, setLotes] = useState([]);
  const [nombreActual, setNombreActual] = useState('');
  const [archivosActuales, setArchivosActuales] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [categoriasSugeridas, setCategoriasSugeridas] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [extrayendoZip, setExtrayendoZip] = useState(false);
  const [resumen, setResumen] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => setAutenticado(res.ok))
      .catch(() => setAutenticado(false))
      .finally(() => setValidandoSesion(false));
  }, []);

  useEffect(() => {
    const sugeridas = sugerirCategorias(nombreActual);
    setCategoriasSugeridas(sugeridas);
    setCategoriasSeleccionadas(sugeridas);
  }, [nombreActual]);

  const toggleCategoria = cat => {
    setCategoriasSeleccionadas(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const manejarSeleccionArchivos = async event => {
    const archivos = Array.from(event.target.files || []);
    const zips = archivos.filter(f => f.name.toLowerCase().endsWith('.zip'));
    const imagenes = archivos.filter(f => !f.name.toLowerCase().endsWith('.zip'));

    let extraidas = [];
    if (zips.length > 0) {
      setExtrayendoZip(true);
      try {
        for (const zipFile of zips) {
          const zip = await JSZip.loadAsync(zipFile);
          const entradas = Object.values(zip.files).filter(
            entry => !entry.dir && /\.(jpe?g|png|webp|gif)$/i.test(entry.name)
          );
          for (const entrada of entradas) {
            const blob = await entrada.async('blob');
            const nombreArchivo = entrada.name.split('/').pop();
            extraidas.push(new File([blob], nombreArchivo, { type: blob.type || 'image/jpeg' }));
          }
        }
      } catch {
        alert('No se pudo leer uno de los archivos .zip. Verifica que no este danado.');
      }
      setExtrayendoZip(false);
    }

    setArchivosActuales(prev => [...prev, ...imagenes, ...extraidas]);
  };

  const agregarLote = () => {
    if (!nombreActual.trim() || archivosActuales.length === 0) return;
    setLotes(prev => [
      ...prev,
      {
        id: generarId(),
        nombre: nombreActual.trim(),
        categorias: categoriasSeleccionadas,
        archivos: archivosActuales,
        previews: archivosActuales.map(f => URL.createObjectURL(f)),
      },
    ]);
    setNombreActual('');
    setArchivosActuales([]);
    setCategoriasSeleccionadas([]);
    setCategoriasSugeridas([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const quitarLote = id => {
    setLotes(prev => prev.filter(l => l.id !== id));
  };

  const subirUnaImagen = async (file, intentos = 3) => {
    const comprimido = await comprimirImagen(file);
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        const formData = new FormData();
        formData.append('file', comprimido);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Error al subir imagen');
        }
        const data = await res.json();
        return data.url;
      } catch (err) {
        if (intento === intentos) throw err;
        await new Promise(r => setTimeout(r, 800 * intento));
      }
    }
  };

  const subirEnLotes = async (archivos, concurrencia = 3) => {
    const urls = new Array(archivos.length);
    let indice = 0;
    const trabajadores = Array.from({ length: Math.min(concurrencia, archivos.length) }, async () => {
      while (indice < archivos.length) {
        const i = indice++;
        urls[i] = await subirUnaImagen(archivos[i]);
      }
    });
    await Promise.all(trabajadores);
    return urls;
  };

  const crearTodos = async () => {
    if (lotes.length === 0) return;
    setProcesando(true);
    setResumen(null);
    const resultados = [];

    for (const lote of lotes) {
      try {
        const urls = await subirEnLotes(lote.archivos);
        const res = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: lote.nombre,
            imagenes: urls.join(', '),
            categorias: lote.categorias.join(', '),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'No se pudo crear el producto.');
        }
        resultados.push({ nombre: lote.nombre, ok: true });
      } catch (err) {
        resultados.push({ nombre: lote.nombre, ok: false, error: err.message || 'Fallo de conexion.' });
      }
    }

    setResumen(resultados);
    setLotes(prev => prev.filter(l => !resultados.find(r => r.ok && r.nombre === l.nombre)));
    setProcesando(false);
  };

  if (validandoSesion) {
    return <main className="min-h-screen flex items-center justify-center text-sm text-slate-500">Cargando...</main>;
  }

  if (!autenticado) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-slate-600">
            Necesitas iniciar sesion en el{' '}
            <a href="/admin" className="text-orange-600 underline">panel de administracion</a>{' '}
            antes de usar la carga masiva.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-orange-500 font-semibold mb-1">Admin</p>
            <h1 className="text-2xl font-bold text-slate-900">Carga masiva de productos</h1>
            <p className="text-sm text-slate-500 mt-1">
              Agrega un nombre y sus fotos, repite por cada producto, y crea todos de una vez.
            </p>
          </div>
          <a
            href="/admin"
            className="text-xs font-semibold text-slate-500 hover:text-orange-500"
          >
            &larr; Volver al admin
          </a>
        </div>

        {/* Formulario para agregar un lote */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold mb-3">
            Nuevo producto para la lista
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={nombreActual}
              onChange={e => setNombreActual(e.target.value)}
              placeholder="Nombre del repuesto"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.zip"
              multiple
              onChange={manejarSeleccionArchivos}
              className="text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="text-xs text-slate-400 -mt-1">
              Puedes elegir fotos sueltas o un archivo .zip con varias fotos adentro.
            </p>
            {extrayendoZip && (
              <p className="text-xs text-orange-500 font-semibold">Extrayendo fotos del .zip...</p>
            )}
            {archivosActuales.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {archivosActuales.map((f, i) => (
                  <span key={i} className="text-xs bg-slate-100 rounded-lg px-2 py-1 text-slate-600">
                    {f.name}
                  </span>
                ))}
              </div>
            )}
            {categoriasSugeridas.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5">
                  Categoria sugerida (clic para quitar/agregar):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categoriasSugeridas.map(cat => {
                    const activa = categoriasSeleccionadas.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategoria(cat)}
                        className={`text-xs rounded-full px-3 py-1 font-semibold border transition ${
                          activa
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={agregarLote}
              disabled={!nombreActual.trim() || archivosActuales.length === 0 || extrayendoZip}
              className="self-start btn-anim rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Agregar a la lista
            </button>
          </div>
        </div>

        {/* Lista de lotes pendientes */}
        {lotes.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold mb-3">
              Pendientes por crear ({lotes.length})
            </p>
            <div className="flex flex-col gap-3">
              {lotes.map(lote => (
                <div key={lote.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="flex -space-x-2">
                    {lote.previews.slice(0, 3).map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover border-2 border-white"
                      />
                    ))}
                    {lote.previews.length > 3 && (
                      <span className="h-10 w-10 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-semibold text-slate-500">
                        +{lote.previews.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{lote.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {lote.archivos.length} foto(s)
                      {lote.categorias.length > 0 && ` · ${lote.categorias.join(', ')}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitarLote(lote.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={crearTodos}
              disabled={procesando}
              className="mt-4 w-full btn-anim rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {procesando ? 'Creando productos...' : `Crear ${lotes.length} producto(s)`}
            </button>
          </div>
        )}

        {/* Resumen de resultados */}
        {resumen && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold mb-3">
              Resultado
            </p>
            <div className="flex flex-col gap-2">
              {resumen.map((r, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-lg px-3 py-2 ${
                    r.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {r.ok ? '✓' : '✕'} {r.nombre} {!r.ok && `— ${r.error}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}