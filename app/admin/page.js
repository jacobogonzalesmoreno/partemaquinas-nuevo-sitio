'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeImagenesText, parseImagenesValue, getImagenesProducto } from '@/lib/imagenes';
import { normalizeCategoriasText, parseCategoriasValue, normalizeCategoriaKey } from '@/lib/categorias';
import { MENU_CATEGORIAS_FLAT } from '@/lib/menu-categorias';

const TEXTAREA_FIELDS = new Set(['descripcion', 'descripcion_corta']);
const EXCLUDED_FIELDS = new Set(['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt']);
const FIELD_LABELS = {
  nombre: 'Nombre',
  sku: 'SKU',
  marcas: 'Marcas',
  categorias: 'Categorias',
  descripcion_corta: 'Descripcion corta',
  descripcion: 'Descripcion larga',
  imagenes: 'Imagenes',
};

const LIMITE = 10;

const unique = items => Array.from(new Set(items));

const parseImagenes = parseImagenesValue;

const toLabel = name => {
  if (FIELD_LABELS[name]) return FIELD_LABELS[name];
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const buildEmptyForm = fields =>
  fields.reduce((acc, field) => {
    acc[field] = '';
    return acc;
  }, {});

export default function AdminPage() {
  const [schema, setSchema] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriasAdmin, setCategoriasAdmin] = useState([]);
  const [cargandoSchema, setCargandoSchema] = useState(true);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [validandoSesion, setValidandoSesion] = useState(true);
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [loginShake, setLoginShake] = useState(false);
  const [loginErrorFlash, setLoginErrorFlash] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [buscar, setBuscar] = useState('');
  const [categoria, setCategoria] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', emoji: '' });
  const [categoriaEditId, setCategoriaEditId] = useState(null);
  const [selectedImagenIndex, setSelectedImagenIndex] = useState(0);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const replaceInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    let isAuth = false;
    fetch('/api/auth/me')
      .then(res => {
        if (!active) return;
        isAuth = res.ok;
        setAutenticado(res.ok);
      })
      .catch(() => {
        if (!active) return;
        isAuth = false;
        setAutenticado(false);
      })
      .finally(() => {
        if (!active) return;
        setValidandoSesion(false);
        if (!isAuth) {
          setCargandoSchema(false);
          setCargandoProductos(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (validandoSesion || autenticado) {
      setMostrarLogin(false);
      return undefined;
    }
    setMostrarLogin(false);
    const frame = requestAnimationFrame(() => setMostrarLogin(true));
    return () => cancelAnimationFrame(frame);
  }, [validandoSesion, autenticado]);

  const handleLogin = async event => {
    event.preventDefault();
    setCargandoLogin(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuario.trim(), password: clave }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo iniciar sesion.');
      }
      setAutenticado(true);
      setUsuario('');
      setClave('');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesion.');
      setLoginShake(true);
      setTimeout(() => setLoginShake(false), 350);
      setLoginErrorFlash(true);
      setTimeout(() => setLoginErrorFlash(false), 1000);
    } finally {
      setCargandoLogin(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAutenticado(false);
  };

  const columnMap = useMemo(
    () => new Map(schema.map(column => [column.name, column])),
    [schema]
  );
  const columnNames = useMemo(() => schema.map(column => column.name), [schema]);
  const priceFields = useMemo(
    () => columnNames.filter(name => name.toLowerCase().includes('precio')),
    [columnNames]
  );
  const stockFields = useMemo(
    () => columnNames.filter(name => name.toLowerCase().includes('stock')),
    [columnNames]
  );

  const categoriasSeleccionadas = useMemo(
    () => parseCategoriasValue(form.categorias),
    [form.categorias]
  );

  const categoriasDisponibles = useMemo(() => {
    const items = [...categoriasAdmin, ...categoriasSeleccionadas];
    const map = new Map();
    items.forEach(item => {
      const trimmed = String(item || '').trim();
      if (!trimmed) return;
      const key = normalizeCategoriaKey(trimmed);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, trimmed);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [categoriasAdmin, categoriasSeleccionadas]);

  const categoriasSeleccionadasKeys = useMemo(
    () => new Set(categoriasSeleccionadas.map(item => normalizeCategoriaKey(item))),
    [categoriasSeleccionadas]
  );

  const primaryFields = useMemo(
    () => unique([
      'nombre',
      'sku',
      'marcas',
      'categorias',
      ...priceFields,
      ...stockFields,
      'descripcion_corta',
      'descripcion',
      'imagenes',
    ]),
    [priceFields, stockFields]
  );

  const visibleFields = useMemo(
    () => primaryFields.filter(name => columnNames.includes(name)),
    [primaryFields, columnNames]
  );
  const extraFields = useMemo(
    () => columnNames.filter(name => !visibleFields.includes(name) && !EXCLUDED_FIELDS.has(name)),
    [columnNames, visibleFields]
  );
  const editableFields = useMemo(
    () => [...visibleFields, ...extraFields],
    [visibleFields, extraFields]
  );

  const priceColumn = priceFields[0] || null;
  const totalPaginas = Math.max(1, Math.ceil(totalProductos / LIMITE));
  const cargando = cargandoSchema || cargandoProductos;

  const loadSchema = async () => {
    setCargandoSchema(true);
    try {
      const res = await fetch('/api/admin/productos/schema');
      if (!res.ok) throw new Error('No se pudo cargar el esquema.');
      const data = await res.json();
      setSchema(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el esquema.');
    } finally {
      setCargandoSchema(false);
    }
  };
  const loadCategorias = async () => {
    setCategoriasAdmin(MENU_CATEGORIAS_FLAT);
  };

  const loadProductos = async (searchValue, categoriaValue, pageValue) => {
    setCargandoProductos(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(LIMITE));
      params.set('page', String(pageValue || 1));
      if (searchValue) {
        params.set('buscar', searchValue);
      }
      if (categoriaValue) {
        params.set('categoria', categoriaValue);
      }
      const res = await fetch(`/api/productos?${params.toString()}`);
      if (!res.ok) throw new Error('No se pudo cargar el listado.');
      const data = await res.json();
      const headerTotal = Number(res.headers.get('X-Total-Count'));
      const total = Number.isFinite(headerTotal)
        ? headerTotal
        : (Array.isArray(data) ? data.length : 0);
      setTotalProductos(total);
      setProductos(Array.isArray(data) ? data : []);
      const nextTotalPaginas = Math.max(1, Math.ceil(total / LIMITE));
      if (pageValue > nextTotalPaginas) {
        setPagina(nextTotalPaginas);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar el listado.');
    } finally {
      setCargandoProductos(false);
    }
  };

  useEffect(() => {
    if (!autenticado) return;
    loadSchema();
    loadCategorias();
  }, [autenticado]);

  useEffect(() => {
    if (!autenticado) return;
    loadProductos(buscar, categoria, pagina);
  }, [autenticado, buscar, categoria, pagina]);

  useEffect(() => {
    if (!schema.length) return;
    if (editId) return;
    setForm(buildEmptyForm(editableFields));
  }, [schema, editId, editableFields]);

  useEffect(() => {
    const imagenes = parseImagenes(form.imagenes);
    if (imagenes.length === 0) {
      setSelectedImagenIndex(0);
      return;
    }
    if (selectedImagenIndex >= imagenes.length) {
      setSelectedImagenIndex(0);
    }
  }, [form.imagenes, selectedImagenIndex]);

  const handleEdit = producto => {
    const next = {};
    editableFields.forEach(field => {
      const value = producto?.[field];
      if (field === 'imagenes') {
        next[field] = normalizeImagenesText(value);
        return;
      }
      if (Array.isArray(value)) {
        next[field] = value.join(',');
      } else if (value === null || value === undefined) {
        next[field] = '';
      } else {
        next[field] = String(value);
      }
    });
    setEditId(String(producto.id));
    setForm(next);
    setSelectedImagenIndex(0);
    setAviso('');
    setError('');
  };

  const resetForm = () => {
    setEditId(null);
    setForm(buildEmptyForm(editableFields));
    setSelectedImagenIndex(0);
    setAviso('');
    setError('');
  };

  const handleSubmitBuscar = event => {
    event.preventDefault();
    setPagina(1);
    setBuscar(busqueda.trim());
  };

  const handleCategoriaChange = event => {
    setPagina(1);
    setCategoria(event.target.value);
  };

  const handlePaginaAnterior = () => {
    setPagina(prev => Math.max(1, prev - 1));
  };

  const handlePaginaSiguiente = () => {
    setPagina(prev => Math.min(totalPaginas, prev + 1));
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleCategoriaProducto = categoriaValue => {
    const actuales = parseCategoriasValue(form.categorias);
    const key = normalizeCategoriaKey(categoriaValue);
    const filtered = actuales.filter(item => normalizeCategoriaKey(item) !== key);
    const next = filtered.length === actuales.length ? [...actuales, categoriaValue] : filtered;
    handleFieldChange('categorias', normalizeCategoriasText(next));
  };

  const handleGuardar = async event => {
    event.preventDefault();
    setGuardando(true);
    setAviso('');
    setError('');

    try {
      const payload = {};
      editableFields.forEach(field => {
        if (field in form) {
          payload[field] = form[field];
        }
      });
      if ('imagenes' in payload) {
        payload.imagenes = normalizeImagenesText(payload.imagenes);
      }

      const url = editId ? `/api/productos/${editId}` : '/api/productos';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo guardar el producto.');
      }

      const data = await res.json().catch(() => ({}));
      if (!editId && data?.id) {
        setEditId(String(data.id));
      }
      const message = editId ? 'Producto actualizado.' : 'Producto creado.';
      setAviso(message);
      if (editId) {
        setToast(message);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2000);
        setTimeout(() => setToast(''), 2300);
      }
      loadProductos(buscar, categoria, pagina);
      loadCategorias();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async producto => {
    if (!producto?.id) return;
    const ok = window.confirm(`Eliminar ${producto.nombre || 'producto'}?`);
    if (!ok) return;

    try {
      setError('');
      const res = await fetch(`/api/productos/${producto.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo eliminar el producto.');
      }
      if (editId === String(producto.id)) {
        resetForm();
      }
      loadProductos(buscar, categoria, pagina);
      loadCategorias();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto.');
    }
  };

  const handleUpload = async files => {
    if (!files || files.length === 0) return;
    setSubiendo(true);
    setError('');

    try {
      const actuales = parseImagenes(form.imagenes);
      const nuevas = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'No se pudo subir una imagen.');
        }
        const data = await res.json();
        if (data?.url) {
          nuevas.push(data.url);
        }
      }

      const combined = unique([...actuales, ...nuevas]);
      handleFieldChange('imagenes', combined.join(', '));
    } catch (err) {
      setError(err.message || 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleRemoveImagenAt = index => {
    const actuales = parseImagenes(form.imagenes);
    if (index < 0 || index >= actuales.length) return;
    const filtered = actuales.filter((_, idx) => idx !== index);
    handleFieldChange('imagenes', filtered.join(', '));
    if (index === selectedImagenIndex) {
      setSelectedImagenIndex(0);
    }
  };

  const handleReplaceImagen = async file => {
    if (!file) return;
    setSubiendo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo subir la imagen.');
      }
      const data = await res.json();
      const url = data?.url;
      if (!url) throw new Error('Respuesta invalida de subida.');

      const actuales = parseImagenes(form.imagenes);
      const index = replaceIndex ?? selectedImagenIndex;
      if (actuales.length === 0) {
        handleFieldChange('imagenes', url);
        setSelectedImagenIndex(0);
      } else if (index >= 0 && index < actuales.length) {
        const next = [...actuales];
        next[index] = url;
        handleFieldChange('imagenes', next.join(', '));
        setSelectedImagenIndex(index);
      }
    } catch (err) {
      setError(err.message || 'No se pudo reemplazar la imagen.');
    } finally {
      setSubiendo(false);
      setReplaceIndex(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  const getFieldKind = field => {
    if (field === 'imagenes') return 'images';
    if (TEXTAREA_FIELDS.has(field)) return 'textarea';
    const column = columnMap.get(field);
    const type = (column?.type || '').toLowerCase();
    if (type.includes('text') || type.includes('blob')) return 'textarea';
    if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return 'number';
    }
    return 'text';
  };

  const getNumberStep = field => {
    const column = columnMap.get(field);
    const type = (column?.type || '').toLowerCase();
    if (type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return '0.01';
    }
    return '1';
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8 relative">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500 font-semibold">Panel</p>
          <h1 className="text-3xl font-bold">Administracion de productos</h1>
          <p className="text-slate-600">Agrega productos, edita precios y sube fotos.</p>
        </div>

        {validandoSesion ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Validando sesion...
          </div>
        ) : !autenticado ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md px-4">
            <div
              className={`relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all duration-300 ease-out ${
                mostrarLogin
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-3'
              } ${loginShake ? 'login-shake' : ''}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 rounded-3xl border border-orange-200/50 transition-all duration-300 ${
                  mostrarLogin ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-orange-500 font-semibold">Acceso</p>
                <h2 className="text-2xl font-semibold text-slate-900">Iniciar sesion</h2>
                <p className="text-sm text-slate-500">Ingresa tus credenciales de admin.</p>
              </div>
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Usuario</label>
                  <input
                    type="text"
                    value={usuario}
                    onChange={event => setUsuario(event.target.value)}
                    placeholder="Usuario"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Contrasena</label>
                  <input
                    type="password"
                    value={clave}
                    onChange={event => setClave(event.target.value)}
                    placeholder="Contrasena"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargandoLogin}
                  className={`btn-anim mt-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 ${
                    loginShake ? 'login-shake-button' : ''
                  } ${
                    loginErrorFlash ? 'login-error' : ''
                  }`}
                >
                  {cargandoLogin ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 flex items-center justify-between">
            <span>Sesion activa</span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-anim rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-300"
            >
              Cerrar sesion
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {aviso && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {aviso}
          </div>
        )}

        {autenticado && !validandoSesion && (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Listado</h2>
                  <p className="text-sm text-slate-500">Mostrando {productos.length} de {totalProductos} productos</p>
                </div>
                <p className="text-xs text-slate-500">Pagina {pagina} de {totalPaginas}</p>
              </div>
              <form onSubmit={handleSubmitBuscar} className="flex flex-col lg:flex-row gap-2">
                <input
                  value={busqueda}
                  onChange={event => setBusqueda(event.target.value)}
                  placeholder="Buscar por nombre, marca o categoria"
                  className="w-full lg:w-64 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                />
                <select
                  value={categoria}
                  onChange={handleCategoriaChange}
                  className="w-full lg:w-56 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                >
                  <option value="">Todas las categorias</option>
                  {categoriasAdmin.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn-anim rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Buscar
                </button>
              </form>
            </div>

            {cargando ? (
              <div className="py-10 text-center text-slate-500">Cargando productos...</div>
            ) : (
              <div className="flex flex-col gap-3">
                {productos.map(producto => {
                  const previewUrl = getImagenesProducto(producto)[0];
                  return (
                    <div
                      key={producto.id}
                      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-shadow ${
                        editId === String(producto.id)
                          ? 'border-orange-300 bg-orange-50/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={producto.nombre}
                                className="h-full w-full object-cover"
                                onError={event => { event.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <span className="text-xl text-slate-300">⚙️</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">ID {producto.id}</p>
                            <h3 className="text-base font-semibold text-slate-900">{producto.nombre}</h3>
                            {producto.sku && <p className="text-xs text-slate-500">SKU: {producto.sku}</p>}
                            {priceColumn && producto[priceColumn] && (
                              <p className="text-xs text-slate-500">{toLabel(priceColumn)}: {producto[priceColumn]}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(producto)}
                            className="btn-anim rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(producto)}
                            className="btn-anim rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-300"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {productos.length === 0 && (
                  <div className="py-10 text-center text-slate-500">No hay productos con ese filtro.</div>
                )}
              </div>
            )}
            {!cargando && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePaginaAnterior}
                  disabled={pagina <= 1}
                  className="btn-anim inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300 disabled:opacity-50"
                >
                  {'<'} Anterior
                </button>
                <span className="text-sm text-slate-500">Pagina {pagina} de {totalPaginas}</span>
                <button
                  type="button"
                  onClick={handlePaginaSiguiente}
                  disabled={pagina >= totalPaginas}
                  className="btn-anim inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300 disabled:opacity-50"
                >
                  Siguiente {'>'}
                </button>
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleGuardar} className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
                  <p className="text-xs text-slate-500">{editId ? `ID ${editId}` : 'Completa los datos principales'}</p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-anim rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300"
                >
                  Nuevo
                </button>
              </div>

              {editId && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400 font-semibold">Imagenes</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceIndex(selectedImagenIndex);
                            replaceInputRef.current?.click();
                          }}
                          className="btn-anim rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-300"
                          disabled={subiendo}
                        >
                          Reemplazar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImagenAt(selectedImagenIndex)}
                          className="btn-anim rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-300"
                          disabled={subiendo}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[160px_1fr]">
                      <div className="h-40 w-full rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                        {parseImagenes(form.imagenes)[selectedImagenIndex] ? (
                          <img
                            src={parseImagenes(form.imagenes)[selectedImagenIndex]}
                            alt={form.nombre || 'Producto'}
                            className="h-full w-full object-cover"
                            onError={event => { event.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-3xl text-slate-300">⚙️</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                          {parseImagenes(form.imagenes).length === 0 && (
                            <p className="text-xs text-slate-500">Sin imagenes cargadas.</p>
                          )}
                          {parseImagenes(form.imagenes).map((url, index) => (
                            <button
                              key={`${url}-${index}`}
                              type="button"
                              onClick={() => setSelectedImagenIndex(index)}
                              className={`h-14 w-14 rounded-xl border overflow-hidden flex items-center justify-center transition-colors ${
                                index === selectedImagenIndex
                                  ? 'border-orange-400 bg-orange-50'
                                  : 'border-slate-200 bg-white hover:border-orange-300'
                              }`}
                            >
                              <img
                                src={url}
                                alt="Miniatura"
                                className="h-full w-full object-cover"
                                onError={event => { event.currentTarget.style.display = 'none'; }}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            id="admin-imagenes-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={event => {
                              handleUpload(event.target.files);
                              event.target.value = '';
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="admin-imagenes-upload"
                            className="btn-anim inline-flex items-center justify-center rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-400"
                          >
                            Agregar imagenes
                          </label>
                          {subiendo && <span className="text-xs text-slate-500">Subiendo...</span>}
                        </div>
                        <input
                          ref={replaceInputRef}
                          type="file"
                          accept="image/*"
                          onChange={event => handleReplaceImagen(event.target.files?.[0])}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {visibleFields.map(field => {
                const kind = getFieldKind(field);
                if (kind === 'images') {
                  return null;
                }

                if (field === 'categorias') {
                  return (
                    <div key={field} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700">{toLabel(field)}</label>
                        <span className="text-xs text-slate-400">
                          {categoriasSeleccionadas.length} seleccionadas
                        </span>
                      </div>
                      {categoriasDisponibles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {categoriasDisponibles.map(item => {
                            const key = normalizeCategoriaKey(item);
                            const isActive = categoriasSeleccionadasKeys.has(key);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => handleToggleCategoriaProducto(item)}
                                className={`btn-anim rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                  isActive
                                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                                }`}
                                aria-pressed={isActive}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No hay categorias registradas.</p>
                      )}
                      <input
                        type="text"
                        value={form[field] || ''}
                        onChange={event => handleFieldChange(field, event.target.value)}
                        onBlur={event => handleFieldChange(field, normalizeCategoriasText(event.target.value))}
                        placeholder="Separadas por coma"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  );
                }

                if (kind === 'textarea') {
                  return (
                    <div key={field} className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">{toLabel(field)}</label>
                      <textarea
                        rows={field === 'descripcion' ? 6 : 3}
                        value={form[field] || ''}
                        onChange={event => handleFieldChange(field, event.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  );
                }

                return (
                  <div key={field} className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">{toLabel(field)}</label>
                    <input
                      type={kind}
                      step={kind === 'number' ? getNumberStep(field) : undefined}
                      value={form[field] || ''}
                      onChange={event => handleFieldChange(field, event.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>
                );
              })}

              {extraFields.length > 0 && (
                <details className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Otros campos</summary>
                  <div className="mt-4 grid gap-4">
                    {extraFields.map(field => {
                      const kind = getFieldKind(field);
                      if (kind === 'textarea') {
                        return (
                          <div key={field} className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700">{toLabel(field)}</label>
                            <textarea
                              rows={3}
                              value={form[field] || ''}
                              onChange={event => handleFieldChange(field, event.target.value)}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={field} className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700">{toLabel(field)}</label>
                          <input
                            type={kind}
                            step={kind === 'number' ? getNumberStep(field) : undefined}
                            value={form[field] || ''}
                            onChange={event => handleFieldChange(field, event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn-anim rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {guardando ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear producto'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-anim rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300"
                >
                  Limpiar
                </button>
              </div>
              {toast && (
                <div
                  className={`rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 shadow-lg transition-all duration-300 ${
                    toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}
                >
                  {toast}
                </div>
              )}
            </form>
          </section>
          </div>
        )}
      </div>
    </main>
  );
}
