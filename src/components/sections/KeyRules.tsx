import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import RuleIcon from '@/components/ui/RuleIcon';

const ICONS = ['clock', 'smoke', 'shoe', 'moon', 'paw'];

// Short summary of the house rules for the property pages, linking to /house-rules.
export default function KeyRules() {
  const t = useTranslations('houseRules');
  const items = t.raw('keyItems') as string[];

  return (
    <div className="max-w-3xl mx-auto rounded-card bg-white shadow-sm p-6 md:p-8">
      <h2 className="font-serif text-2xl text-forest font-semibold">{t('keyTitle')}</h2>
      <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm text-forest/80">
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-3">
            <span className="shrink-0 w-9 h-9 rounded-full bg-gold/15 text-forest flex items-center justify-center">
              <RuleIcon name={ICONS[i]} className="w-5 h-5" />
            </span>
            {item}
          </li>
        ))}
      </ul>
      <Link
        href="/house-rules"
        className="mt-5 inline-flex items-center min-h-11 text-sm font-semibold text-gold-text hover:text-forest"
      >
        {t('keyLink')} →
      </Link>
    </div>
  );
}
