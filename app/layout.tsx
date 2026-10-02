import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const SITE_NAME = 'Baba Vanga';
const DESCRIPTION =
  'Hayatındaki bir soruyu yaz; sistem sana doğru soruları sorsun, cevaplarından numeroloji, tarot, astroloji ve sembolleri birleştirerek sana özel bir yorum oluştursun. Kural tabanlı, deterministik kehanet motoru.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BASE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${SITE_NAME} — İnteraktif Kehanet ve Soru Motoru`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'tarot', 'numeroloji', 'astroloji', 'kehanet', 'fal', 'günlük yorum',
    'aşk falı', 'tarot açılımı', 'yaşam yolu sayısı',
  ],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — İnteraktif Kehanet ve Soru Motoru`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — İnteraktif Kehanet ve Soru Motoru`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#04050e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="font-body antialiased">
        <div className="night-sky" aria-hidden />
        <Header />
        <main>{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: process.env.BASE_URL ?? 'http://localhost:3000',
              inLanguage: 'tr-TR',
              description: DESCRIPTION,
              potentialAction: {
                '@type': 'SearchAction',
                target: '/questions?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
