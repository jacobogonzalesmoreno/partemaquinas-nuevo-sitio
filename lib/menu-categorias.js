export const MENU_CATEGORIAS = [
  {
    nombre: 'Motor',
    hijos: [
      { nombre: 'Motores' },
      { nombre: 'Liner kit' },
      { nombre: 'Bomba Inyeccion' },
      { nombre: 'Bomba Aceite' },
      { nombre: 'Inyectores' },
      { nombre: 'Turbos' },
      {
        nombre: 'Accesorios',
        hijos: [
          { nombre: 'Tuberia Inyeccion' },
          { nombre: 'Correas' },
          { nombre: 'Soportes' },
          { nombre: 'Filtros' },
        ],
      },
      { nombre: 'Bloques' },
      { nombre: 'Culatas' },
      { nombre: 'Cigueñales' },
      { nombre: 'Casquetes' },
      { nombre: 'Arboles De Levas' },
      { nombre: 'Tapa Valvulas' },
      { nombre: 'Empaquetaduras' },
      { nombre: 'Coronas' },
      {
        nombre: 'Piñones',
        hijos: [
          { nombre: 'Solares' },
          { nombre: 'Planetario' },
        ],
      },
      { nombre: 'Ventiladores' },
    ],
  },
  {
    nombre: 'Giro',
    hijos: [
      { nombre: 'Motor Giro' },
      { nombre: 'Reductor Giro' },
      { nombre: 'Carrier Inferior Giro' },
      { nombre: 'Carrier Superior Giro' },
    ],
  },
  {
    nombre: 'Traslacion',
    hijos: [
      { nombre: 'Motorreductor Traslacion' },
      { nombre: 'Reductor Traslacion' },
      { nombre: 'Carrier Interno Traslacion' },
      { nombre: 'Carrier Externo Traslacion' },
      {
        nombre: 'Piñones Traslacion',
        hijos: [
          { nombre: 'Solares' },
          { nombre: 'Planetario' },
        ],
      },
      { nombre: 'Ejes Traslacion' },
    ],
  },
  { nombre: 'Radiadores' },
  { nombre: 'Banco Valvulas' },
  { nombre: 'Balineras' },
];

export const MENU_CATEGORIAS_FLAT = Array.from(
  new Set(
    MENU_CATEGORIAS.flatMap(categoria => {
      const entries = [categoria.nombre];
      if (categoria.hijos) {
        categoria.hijos.forEach(hijo => {
          entries.push(hijo.nombre);
          if (hijo.hijos) {
            hijo.hijos.forEach(nieto => entries.push(nieto.nombre));
          }
        });
      }
      return entries;
    })
  )
);
