import type { MetadataRoute } from 'next';
import { PLATFORMS } from '@/lib/catalog';
export const dynamic = 'force-static';
const U = 'https://marriagemode.netlify.app';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/audit/', '/guides/', '/privacy/', '/safety/', ...PLATFORMS.map((p) => `/guides/${p.id}/`)].map((p) => ({ url: U + p }));
}
