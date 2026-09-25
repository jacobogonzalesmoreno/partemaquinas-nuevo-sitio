import './globals.css';
import Script from 'next/script';
import { Montserrat } from 'next/font/google';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import BotonWhatsapp from '@/components/BotonWhattsapp';
import PageTransition from '@/components/PageTransition';
import { Analytics } from '@vercel/analytics/react';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  metadataBase: new URL('https://partemaquinas.com'),
  title: 'ParteMaquinas - Repuestos para Maquinaria Pesada Medellín',
  description: 'Somos especialistas en repuestos para maquinaria pesada en Medellín. Excavadoras, motores diésel, cargadores y más.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'es_CO', siteName: 'ParteMáquinas', title: 'ParteMáquinas - Repuestos para Maquinaria Pesada Medellín', description: 'Repuestos para maquinaria pesada, excavadoras y motores diésel en Medellín, Colombia.', url: '/' },
  icons: {
    icon: '/logo/logo-partemaquinas-oficial.jpeg',
    shortcut: '/logo/logo-partemaquinas-oficial.jpeg',
    apple: '/logo/logo-partemaquinas-oficial.jpeg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${montserrat.className} bg-slate-50 text-slate-900 antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'AutoPartsStore', name: 'ParteMáquinas', url: 'https://partemaquinas.com', logo: 'https://partemaquinas.com/logo/logo-partemaquinas-oficial.jpeg', description: 'Repuestos para maquinaria pesada en Medellín, Colombia.', telephone: '+57 316 329 3151', address: { '@type': 'PostalAddress', addressLocality: 'Medellín', addressCountry: 'CO' }, areaServed: { '@type': 'Country', name: 'Colombia' } }).replace(/</g, '\\u003c') }} />
        <Navbar />
        <PageTransition>{children}</PageTransition>
        <Footer />
        <BotonWhatsapp />
        <Analytics />
        <Script src="//code.tidio.co/ik3zg1kybelonasjdzw8q5wxqbwt9htr.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
