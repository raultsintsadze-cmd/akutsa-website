import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Section from '@/components/ui/Section';
import { getPostById } from '@/lib/notion';
import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Locale } from '@/i18n/config';

export const revalidate = 3600;

export async function generateMetadata({
  params: { locale, id }
}: {
  params: { locale: Locale; id: string };
}): Promise<Metadata> {
  const post = await getPostById(id);
  if (!post) return {};
  return { title: post.title };
}

function RichText({ items }: { items: RichTextItemResponse[] }) {
  if (!items.length) return null;
  return (
    <div className="prose prose-forest max-w-none text-forest/80 leading-relaxed whitespace-pre-wrap">
      {items.map((item, i) => {
        const text = item.plain_text;
        if (item.type !== 'text') return <span key={i}>{text}</span>;
        const { bold, italic, underline, code } = item.annotations;
        let node: React.ReactNode = text;
        if (code) node = <code key={i} className="bg-forest/10 px-1 rounded text-sm font-mono">{node}</code>;
        if (bold) node = <strong key={i}>{node}</strong>;
        if (italic) node = <em key={i}>{node}</em>;
        if (underline) node = <u key={i}>{node}</u>;
        return <span key={i}>{node}</span>;
      })}
    </div>
  );
}

export default async function NewsPostPage({
  params: { locale, id }
}: {
  params: { locale: Locale; id: string };
}) {
  const [post, t] = await Promise.all([
    getPostById(id),
    getTranslations({ locale, namespace: 'news' })
  ]);

  if (!post) notFound();

  const dateLocale = locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <Section>
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/${locale}/news`}
          className="inline-flex items-center gap-2 text-sm text-forest/60 hover:text-forest transition-colors mb-8"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('backToNews')}
        </Link>

        <article className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {post.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-72 object-cover"
            />
          )}
          <div className="p-8">
            <h1 className="font-serif text-3xl text-forest font-semibold">{post.title}</h1>
            {post.date && (
              <p className="mt-2 text-sm text-gold font-medium">
                {t('publishedOn')}{' '}
                {new Date(post.date).toLocaleDateString(dateLocale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
            <div className="mt-8">
              <RichText items={post.content} />
            </div>
          </div>
        </article>
      </div>
    </Section>
  );
}
