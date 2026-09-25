'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getImagenesProducto } from '@/lib/imagenes';
import { slugifyCategoria } from '@/lib/catalogo-categorias';

const MARCAS = [
  'Bobcat', 'Case', 'Caterpillar', 'Cummins', 'Doosan', 'Hino', 'Hitachi', 'Hyundai', 'IHI',
  'Isuzu', 'JCB', 'John Deere', 'Kato', 'Kawasaki', 'Kobelco', 'Komatsu', 'Kubota',
  'Link-Belt', 'LiuGong', 'Mitsubishi', 'New Holland', 'NTN', 'SANY', 'Shibaura', 'Volvo', 'XGMA', 'Yanmar',
];
const CATEGORIAS = [
  { nombre: 'Motor', archivo: 'motor.png', descripcion: 'Componentes y repuestos de motor' },
  { nombre: 'Turbos', archivo: 'turbos.png', descripcion: 'Turbocompresores y accesorios' },
  { nombre: 'Bomba Aceite', archivo: 'bomba-aceite.png', descripcion: 'Lubricación y sistema de aceite' },
];

function ProductoCard({ producto }) {
  const router = useRouter();
  const imagen = getImagenesProducto(producto)[0];
  const consulta = `https://api.whatsapp.com/send?phone=573163293151&text=${encodeURIComponent(`Hola, me interesa: ${producto.nombre}${producto.sku ? ` (Ref: ${producto.sku})` : ''}`)}`;

  return (
    <article className="store-product-card">
      <button type="button" className="store-product-card__visual" onClick={() => router.push(`/productos/${producto.id}`)} aria-label={`Ver ${producto.nombre}`}>
        {imagen ? (
          <Image src={imagen} alt={producto.nombre} fill sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw" className="object-contain" />
        ) : (
          <span className="store-product-card__placeholder" aria-hidden="true"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 18h32v20H8zM14 18l3-7h14l3 7M17 27h.01M24 27h.01M31 27h.01M14 38v3m20-3v3" /></svg></span>
        )}
      </button>
      <div className="store-product-card__body">
        <div className="store-product-card__price"><span>$</span><span>Precio por confirmar</span></div>
        {producto.marcas && <p className="store-product-card__brand">{producto.marcas}</p>}
        <button type="button" className="store-product-card__title" onClick={() => router.push(`/productos/${producto.id}`)}>{producto.nombre}</button>
        {producto.sku && <p className="store-product-card__sku">Ref. {producto.sku}</p>}
        <a className="store-product-card__action" href={consulta} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h-3l-1 2h2l3.2 9.4a2 2 0 0 0 1.9 1.3h8.1a2 2 0 0 0 1.9-1.4L22 9H8.1M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>
          Cotizar por WhatsApp
        </a>
      </div>
    </article>
  );
}

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [marcaActiva, setMarcaActiva] = useState('Todas');
  const controlCarga = useRef(null);
  const carruselMarcasRef = useRef(null);
  const [marcasScrollable, setMarcasScrollable] = useState({ left: false, right: false });

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const respuesta = await fetch('/api/productos?limit=20');
        if (!respuesta.ok) throw new Error('No fue posible cargar los productos.');
        const data = await respuesta.json();
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No fue posible cargar los productos.');
      } finally {
        setCargando(false);
      }
    };
    cargarProductos();
  }, []);

  useEffect(() => {
    const carrusel = carruselMarcasRef.current;
    if (!carrusel) return;
    const actualizarFlechas = () => setMarcasScrollable({
      left: carrusel.scrollLeft > 2,
      right: carrusel.scrollLeft + carrusel.clientWidth < carrusel.scrollWidth - 2,
    });
    actualizarFlechas();
    carrusel.addEventListener('scroll', actualizarFlechas, { passive: true });
    const observador = new ResizeObserver(actualizarFlechas);
    observador.observe(carrusel);
    return () => { carrusel.removeEventListener('scroll', actualizarFlechas); observador.disconnect(); };
  }, []);

  const desplazarMarcas = direccion => carruselMarcasRef.current?.scrollBy({ left: direccion * Math.max(220, carruselMarcasRef.current.clientWidth * .7), behavior: 'smooth' });

  const seleccionarMarca = async marca => {
    setMarcaActiva(marca);
    setError('');
    if (controlCarga.current) controlCarga.current.abort();
    const controller = new AbortController();
    controlCarga.current = controller;
    if (marca === 'Todas') {
      setCargando(true);
      try {
        const respuesta = await fetch('/api/productos?limit=20', { signal: controller.signal });
        if (!respuesta.ok) throw new Error('No fue posible cargar los productos.');
        const data = await respuesta.json();
        if (!controller.signal.aborted) setProductos(Array.isArray(data) ? data : []);
      } catch (err) { if (err.name !== 'AbortError') setError(err.message || 'No fue posible cargar los productos.'); }
      finally { if (!controller.signal.aborted) setCargando(false); }
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`/api/productos?buscar=${encodeURIComponent(marca)}&limit=1000`, { signal: controller.signal });
      if (!respuesta.ok) throw new Error('No fue posible buscar productos de esta marca.');
      const data = await respuesta.json();
      if (!controller.signal.aborted) setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'No fue posible buscar productos de esta marca.');
    } finally {
      if (!controller.signal.aborted) setCargando(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    if (marcaActiva === 'Todas') return productos.slice(0, 10);
    return productos.filter(producto => (producto.marcas || '').toLowerCase().includes(marcaActiva.toLowerCase())).slice(0, 10);
  }, [marcaActiva, productos]);

  return (
    <main className="store-home">
      <div className="store-container">
        <section className="store-brand-strip" aria-label="Marcas del catálogo">
          <span className="store-brand-label">Marcas</span>
          <div className="store-brand-marquee">
            <div className="store-brand-marquee__track">
              {[0, 1].map(copia => (
                <div className="store-brand-marquee__group" aria-hidden={copia === 1} key={copia}>
                  {MARCAS.map(marca => (
                    <Link key={`${copia}-${marca}`} tabIndex={copia === 0 ? 0 : -1}
                      href={`/productos?buscar=${encodeURIComponent(marca)}`} className="store-brand-pill">{marca}</Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <span className="store-brand-caption">Repuestos para maquinaria pesada</span>
        </section>

        <section className="store-hero" aria-label="Encuentra el repuesto que necesitas">
          <Link href="/productos" className="store-hero__main">
            <div className="store-hero__copy">
              <span className="store-eyebrow">ParteMáquinas · Medellín, Colombia</span>
              <h1>Repuestos para que tu maquinaria siga trabajando.</h1>
              <p>Encuentra piezas para excavadoras, motores diésel y maquinaria pesada. Nuestro equipo te ayuda a validar la referencia correcta.</p>
              <span className="store-hero__button">Explorar catálogo <span aria-hidden="true">→</span></span>
            </div>
            <div className="store-hero__art" aria-hidden="true">
              <div className="store-hero__ring store-hero__ring--one" />
              <div className="store-hero__ring store-hero__ring--two" />
              <Image src="/categorias/motor.png" alt="" fill priority sizes="(min-width: 1024px) 42vw, 80vw" className="object-contain" />
              <span className="store-hero__art-label">Repuestos de motor y maquinaria</span>
            </div>
          </Link>
          <div className="store-hero__side">
            <Link href="/productos" className="store-promo-card store-promo-card--parts">
              <span className="store-eyebrow">Amplio catálogo</span>
              <strong>Encuentra tu pieza</strong>
              <span>Buscar repuestos <b aria-hidden="true">↗</b></span>
              <span className="store-promo-card__image"><Image src="/categorias/turbos.png" alt="" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-contain" /></span>
            </Link>
            <Link href="/maquinaria" className="store-promo-card store-promo-card--machines">
              <span className="store-eyebrow">Equipos disponibles</span>
              <strong>Maquinaria pesada</strong>
              <span>Ver equipos <b aria-hidden="true">↗</b></span>
              <span className="store-promo-card__image"><Image src="/categorias/cadenas.png" alt="" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-contain" /></span>
            </Link>
          </div>
        </section>

        <section className="store-products-section" aria-labelledby="store-products-title">
          <div className="store-section-heading">
            <div>
              <p className="store-eyebrow">Nuestro catálogo</p>
              <h2 id="store-products-title">Productos destacados</h2>
            </div>
            <div className="store-section-heading__right">
              <div className="store-filter-carousel">
                <button type="button" className="store-filter-arrow" aria-label="Ver marcas anteriores" disabled={!marcasScrollable.left} onClick={() => desplazarMarcas(-1)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="store-filter-pills" aria-label="Filtrar por marca" ref={carruselMarcasRef}>
                  {['Todas', ...MARCAS].map(marca => (
                    <button key={marca} type="button" className={marcaActiva === marca ? 'is-active' : ''} onClick={() => seleccionarMarca(marca)}>{marca}</button>
                  ))}
                </div>
                <button type="button" className="store-filter-arrow" aria-label="Ver más marcas" disabled={!marcasScrollable.right} onClick={() => desplazarMarcas(1)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
              <Link href="/productos" className="store-more-link">Ver catálogo completo <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          {cargando ? (
            <div className="store-state">Cargando productos…</div>
          ) : error ? (
            <div className="store-state store-state--error">{error} <Link href="/productos">Abrir catálogo</Link></div>
          ) : productosFiltrados.length ? (
            <div className="store-product-grid">{productosFiltrados.map(producto => <ProductoCard key={producto.id} producto={producto} />)}</div>
          ) : (
            <div className="store-state">No encontramos productos de {marcaActiva} por ahora. <button type="button" onClick={() => seleccionarMarca('Todas')}>Ver todos</button></div>
          )}
        </section>

        <section className="store-categories-section" aria-labelledby="store-categories-title">
          <div className="store-section-heading">
            <div><p className="store-eyebrow">Busca por categoría</p><h2 id="store-categories-title">¿Qué repuesto necesitas?</h2></div>
            <Link href="/productos" className="store-more-link">Todas las categorías <span aria-hidden="true">→</span></Link>
          </div>
          <div className="store-category-grid">
            {CATEGORIAS.map(categoria => (
              <Link key={categoria.nombre} href={`/productos/categorias/${slugifyCategoria(categoria.nombre)}`} className="store-category-card">
                <div className="store-category-card__image"><Image src={`/categorias/${categoria.archivo}`} alt={categoria.nombre} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-contain" /></div>
                <div><span>{categoria.descripcion}</span><strong>{categoria.nombre}</strong></div>
                <span className="store-category-card__arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="store-contact-banner">
          <div><p className="store-eyebrow">Asesoría especializada</p><h2>¿No encuentras la referencia?</h2><p>Envíanos una foto o el número de parte y te ayudamos a revisar disponibilidad y compatibilidad.</p></div>
          <a href="https://wa.me/573163293151?text=Hola%2C%20necesito%20ayuda%20para%20encontrar%20un%20repuesto" target="_blank" rel="noreferrer" className="store-contact-banner__button">Hablar con un asesor <span aria-hidden="true">↗</span></a>
        </section>
      </div>
    </main>
  );
}
