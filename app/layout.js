import './globals.css';
import { IBM_Plex_Sans } from 'next/font/google';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import BotonWhatsapp from '@/components/BotonWhattsapp';
import PageTransition from '@/components/PageTransition';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'ParteMaquinas - Repuestos para Maquinaria Pesada Medellín',
  description: 'Somos especialistas en repuestos para maquinaria pesada en Medellín. Excavadoras, motores diésel, cargadores y más.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${ibmPlexSans.className} bg-slate-50 text-slate-900 antialiased`}>
        <Navbar />
        <PageTransition>{children}</PageTransition>
        <Footer />
        <BotonWhatsapp />
      </body>
    </html>
  );
}