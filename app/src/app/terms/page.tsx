import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Terms of Use · Marriage Mode' };

const S: [string, string][] = [
  ['Who we are', 'Marriage Mode is a product of Upfront Consulting with Tiff & Reco LLC ("we"). By using it you agree to these terms. If you don’t agree, please don’t use it.'],
  ['Who can use it', 'You must be 18 or older. Use Marriage Mode only for your own accounts and your own data.'],
  ['Self-help, not monitoring', 'Marriage Mode helps you close your own old accounts. You may not use it to watch, check on, or collect information about another person. Couple Mode only shows what each partner chooses to share, and either partner can leave at any time.'],
  ['Mia is an AI coach, not therapy', 'Mia is an AI. She can be wrong, and she is not a licensed counselor, therapist, doctor or lawyer. Nothing she says is professional advice. If you are in crisis or in danger, call or text 988 (US) or 911. For real counseling, see our counselor list.'],
  ['Deletion requests', 'We write deletion-request letters for you, and you choose to send them. Each company decides how and when it deletes data; we can’t guarantee any company will delete your account. Delete accounts inside each app first when you can.'],
  ['Your content', 'What you type, record or upload stays yours. You let us store and show it only as needed to run the features you use (for example, showing your shared items to your partner).'],
  ['Fair use', 'Don’t misuse the service: no breaking in, overloading it, sending spam (for example, mass partner invites), or using it to harass anyone. We may limit or close accounts that do.'],
  ['Free features and purchases', 'The core audit is free. If you buy something (like the Clean Slate Kit), the price and what you get are shown before you pay, through the seller’s checkout.'],
  ['No warranty', 'Marriage Mode is provided "as is". We work hard to keep it accurate and available, but we can’t promise it will always be error-free or that third-party links (like an app’s privacy page) will stay correct.'],
  ['Limits of liability', 'To the extent the law allows, Upfront Consulting with Tiff & Reco LLC is not liable for indirect or consequential losses from using Marriage Mode, and our total liability is limited to the amount you paid us in the past 12 months (or $0 for free features).'],
  ['Changes and contact', 'We may update these terms; the date above will change, and big changes will be shown to signed-in users. Questions: upfrontconsultingwithtr@gmail.com.'],
];

export default function Terms() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 leading-relaxed text-ink/80">
      <h1 className="text-4xl font-bold text-glow">Terms of Use</h1>
      <p className="text-sm text-ink/50">Effective November 17, 2026. See also our <a href="../privacy/" className="text-teal underline">Privacy policy</a>.</p>
      {S.map(([h, p]) => (<section key={h} className="space-y-2"><h2 className="pt-2 text-xl font-bold text-ink">{h}</h2><p>{p}</p></section>))}
    </article>
  );
}
