import type { MetadataRoute } from 'next'

const SITE_URL = 'https://profeediegomx.netlify.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/#cursos`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/#simulador`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ]
}
