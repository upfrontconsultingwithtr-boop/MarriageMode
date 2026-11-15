import type { Metadata } from 'next';
import CoupleApp from './CoupleApp';
export const metadata: Metadata = { title: 'Couple Mode · Marriage Mode', description: 'A private space for two: shared goals and the progress each of you chooses to share. No accounts, nothing stored on our servers.', robots: { index: false } };
export default function CouplePage() { return <CoupleApp />; }
