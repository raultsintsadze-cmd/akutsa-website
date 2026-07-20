import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import { getPublishedPosts } from '@/lib/notion';
import type { Locale } from '@/i18n/config';

export const revalidate = 3600;

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'news' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function NewsPage({
  params: { locale }
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: 'news' });
  const posts = await getPublishedPosts(locale);

  const dateLocale = locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />

      {posts.length === 0 ? (
        <p className="text-center text-forest/60">{t('noPosts')}</p>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/news/${post.id}`}
              className="block group"
            >
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {post.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-56 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                )}
                <div className="p-6">
                  <h2 className="font-serif text-xl text-forest font-semibold group-hover:text-gold transition-colors">
                    {post.title}
                  </h2>
                  {post.date && (
                    <p className="mt-1 text-sm text-gold font-medium">
                      {t('publishedOn')}{' '}
                      {new Date(post.date).toLocaleDateString(dateLocale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-forest/60 font-medium group-hover:text-forest transition-colors">
                    {t('readMore')} →
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
