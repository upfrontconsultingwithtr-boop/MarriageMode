import type { MetadataRoute } from 'next';
import { PLATFORMS } from '@/lib/catalog';
export const dynamic = 'force-static';
import { SITE as U } from '@/lib/base';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/audit/', '/guides/', '/privacy/', '/safety/', ...PLATFORMS.map((p) => `/guides/${p.id}/`)].map((p) => ({ url: U + p }));
}
