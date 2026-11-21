import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Landing from './Landing';
export const metadata: Metadata = {
  title: 'Marriage Mode · End the dating era together',
  description: 'Free. Learn why social media strains relationships, sweep your own accounts privately on your device, remove what does not belong, and prove it together. By Upfront Consulting with Tiff & Reco LLC.',
  robots: { index: false, follow: false },
};
// Preview-only until Tiffany approves: these pages exist only in the Advanced preview build.
export default function Page() { if (process.env.NEXT_PUBLIC_ADVANCED_SITE !== '1') notFound(); return <Landing />; }
