import type { MetadataRoute } from 'next';
import { PLATFORMS } from '@/lib/catalog';
export const dynamic = 'force-static';
import { SITE as U } from '@/lib/base';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/es/', '/partners/', '/charges/', '/lessons/', '/coach/', '/counselors/', '/audit/', '/guides/', '/worksheet/', '/engagement-checklist/', '/privacy/', '/safety/', ...PLATFORMS.map((p) => `/guides/${p.id}/`), ...PLATFORMS.filter((p) => p.billing.length).map((p) => `/cancel/${p.id}/`)].map((p) => ({ url: U + p }));
}
