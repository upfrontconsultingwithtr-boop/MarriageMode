import type { Metadata } from 'next';
import AuditApp from './AuditApp';

export const metadata: Metadata = { title: 'Your private audit · Marriage Mode', robots: { index: false } };

export default function AuditPage() {
  return <AuditApp />;
}
