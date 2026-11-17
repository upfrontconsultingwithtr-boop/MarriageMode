import type { Metadata } from 'next';
import FounderHub from './FounderHub';
export const metadata: Metadata = { title: process.env.NEXT_PUBLIC_HUB_SITE === '1' ? 'Marriage Mode Hub · Upfront Consulting with Tiff & Reco LLC' : 'Founders’ hub · Marriage Mode', robots: { index: false, follow: false } };
export default function Page() { return <FounderHub />; }
