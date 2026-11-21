import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdvApp from '../app/AdvApp';
export const metadata: Metadata = { title: 'Marriage Mode · Free Solo Search', robots: { index: false, follow: false } };
export default function Page() { if (process.env.NEXT_PUBLIC_ADVANCED_SITE !== '1') notFound(); return <AdvApp only="solo" />; }
