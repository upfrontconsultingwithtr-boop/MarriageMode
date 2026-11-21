import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdvApp from './AdvApp';
export const metadata: Metadata = { title: 'Marriage Mode · Your Clean Slate', robots: { index: false, follow: false } };
export default function Page() { if (process.env.NEXT_PUBLIC_ADVANCED_SITE !== '1' && process.env.NEXT_PUBLIC_PORTAL_SITE !== '1') notFound(); return <AdvApp />; }
