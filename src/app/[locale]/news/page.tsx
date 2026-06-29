import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import NotionBlocks from '@/components/sections/NotionBlocks';
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
        <div className="max-w-3xl mx-auto space-y-16">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {post.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-72 object-cover"
                />
              )}
              <div className="p-8">
                <h2 className="font-serif text-2xl text-forest font-semibold">{post.title}</h2>
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
                <div className="mt-6">
                  <NotionBlocks blocks={post.blocks} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
