import type { Metadata } from 'next';
import LessonsApp from './LessonsApp';
export const metadata: Metadata = {
  title: 'Free guided conversation lessons for couples · Marriage Mode',
  description: 'Short, free lessons to do together: a clean slate, digital boundaries, rebuilding trust and weekly check-ins. Read aloud on your phone. By Upfront Consulting with Tiff & Reco LLC.',
};
export default function Page() { return <LessonsApp />; }
