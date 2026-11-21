import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortalApp from './PortalApp';
export const metadata: Metadata = { title: 'Marriage Mode · Sign in to your dashboard', robots: { index: false, follow: false } };
// Only in the portal build (its own site). Never on the customer website.
export default function Page() { if (process.env.NEXT_PUBLIC_PORTAL_SITE !== '1') notFound(); return <PortalApp />; }
