import type { Metadata } from 'next';
import FounderHub from './FounderHub';
export const metadata: Metadata = { title: 'Founders’ hub · Marriage Mode', robots: { index: false, follow: false } };
export default function Page() { return <FounderHub />; }
