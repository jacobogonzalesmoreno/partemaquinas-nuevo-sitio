'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const IMAGEN_RESPALDO = '/logo/logo-partemaquinas-oficial.jpeg';

export default function ImagenProducto({ src, alt, ...props }) {
  const [fallo, setFallo] = useState(false);

  useEffect(() => { setFallo(false); }, [src]);

  if (!src) return null;

  return (
    <Image
      {...props}
      src={fallo ? IMAGEN_RESPALDO : src}
      alt={alt}
      unoptimized
      onError={() => setFallo(true)}
    />
  );
}
