// PAGES_BASE_PATH is set by the GitHub Pages build (site lives under /MarriageMode).
const base = process.env.PAGES_BASE_PATH || '';
const site = process.env.SITE_URL || 'https://marriagemode.netlify.app';
/** @type {import('next').NextConfig} */
export default {
  output: 'export', trailingSlash: true, images: { unoptimized: true },
  basePath: base,
  env: { NEXT_PUBLIC_BASE_PATH: base, NEXT_PUBLIC_SITE_URL: site },
};
