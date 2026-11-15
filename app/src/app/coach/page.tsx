import type { Metadata } from 'next';
import CoachApp from './CoachApp';
import { IMPORT_MAP } from '@/lib/mia';
export const metadata: Metadata = {
  title: 'Free AI Relationship Coach: live voice sessions · Marriage Mode',
  description: 'Talk with Mia, a free AI relationship coach that runs privately on your own device. Voice or text, English or Spanish. Not a counselor. By Upfront Consulting with Tiff & Reco LLC.',
};
export default function Page() { return <><script type="importmap" dangerouslySetInnerHTML={{ __html: IMPORT_MAP }} /><CoachApp /></>; }
