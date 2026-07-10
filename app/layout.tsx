import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = 'https://profeediegomx.netlify.app'
const TITLE = 'Profe Diego MX — Cursos y Simuladores ECOEMS, UNAM e IPN'
const DESCRIPTION = 'Prepárate para ECOEMS, UNAM e IPN con IA, simuladores inteligentes, miles de reactivos, ranking y clases especializadas. Apoyo por WhatsApp.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Profe Diego MX',
  },
  description: DESCRIPTION,
  keywords: [
    'Curso ECOEMS', 'Simulador ECOEMS', 'Curso UNAM', 'Curso IPN', 'Guía ECOEMS',
    'examen de admisión', 'COMIPEMS', 'CENEVAL', 'reactivos', 'simulador examen admisión',
    'Profe Diego', 'preparación IPN', 'preparación UNAM',
  ],
  authors: [{ name: 'Profe Diego MX' }],
  icons: { icon: '/logo.png', apple: '/logo.png' },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: SITE_URL,
    siteName: 'Profe Diego MX',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/logo.png', width: 585, height: 434, alt: 'Profe Diego MX' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/logo.png'],
  },
  robots: { index: true, follow: true },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Profe Diego MX',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: DESCRIPTION,
  areaServed: 'MX',
  sameAs: ['https://wa.me/525574818256'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body className="antialiased bg-[#f8fafc]">
        {children}
      </body>
    </html>
  )
}
