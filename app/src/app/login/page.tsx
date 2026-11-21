import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortalApp from '../portal/PortalApp';
export const metadata: Metadata = { title: 'Marriage Mode · Customer login', robots: { index: false, follow: false } };
// The customer login page: its own page on the portal site (never on the customer website).
export default function Page() { if (process.env.NEXT_PUBLIC_PORTAL_SITE !== '1') notFound(); return <PortalApp page="login" />; }
