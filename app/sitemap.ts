import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  const routes = [
    '', '/questions', '/tarot', '/numerology', '/how-it-works',
    '/about', '/faq', '/privacy', '/terms', '/premium',
  ];
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: r === '' ? 'daily' : 'weekly',
    priority: r === '' ? 1 : r === '/questions' || r === '/tarot' ? 0.8 : 0.6,
  }));
}
