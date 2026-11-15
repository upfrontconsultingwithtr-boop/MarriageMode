'use client';
export default function PrintButton() {
  return <button onClick={() => window.print()} className="glow-mango rounded-full bg-mango px-6 py-3 font-semibold text-night print:hidden">Print or save as PDF</button>;
}
