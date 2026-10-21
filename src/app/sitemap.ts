import { MetadataRoute } from 'next';
import { getArticles } from '@/lib/data';
import { visitArticles } from '@/lib/visit-articles';
import { shopIsPublic } from '@/lib/shop-orders';

// The public-shop flag is runtime configuration; don't cache a sitemap from
// a build or preview where ordering was disabled.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.lablae.net';
  const articles = await getArticles();

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/blog/${encodeURIComponent(article.slug)}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lablae`,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/menu`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...(shopIsPublic() ? [{
      url: `${baseUrl}/shop`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }] : []),
    {
      url: `${baseUrl}/directions`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    { url: `${baseUrl}/travel`, changeFrequency: "monthly", priority: 0.9 },
    ...articleEntries,
    { url: `${baseUrl}/visit`, changeFrequency: 'weekly', priority: 0.8 },
    ...visitArticles.map((article) => ({ url: `${baseUrl}/visit/${article.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
