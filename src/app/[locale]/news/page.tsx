import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import FadeIn from '@/components/ui/FadeIn';
import { getPublishedPosts } from '@/lib/notion';
import type { NewsPost } from '@/lib/notion';
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

function readingTime(post: NewsPost): number {
  const words = post.content.map((r) => r.plain_text).join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-block bg-gold/15 text-gold text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
      {label}
    </span>
  );
}

export default async function NewsPage({
  params: { locale }
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: 'news' });
  const posts = await getPublishedPosts(locale);

  const dateLocale = locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US';

  const formatDate = (dateStr: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(dateLocale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

  if (posts.length === 0) {
    return (
      <Section>
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />
        <p className="text-center text-forest/60">{t('noPosts')}</p>
      </Section>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />

      {/* Featured post — full-width, large image, overlay text */}
      <FadeIn>
        <Link href={`/${locale}/news/${featured.id}`} className="group block mb-12">
          <article className="relative rounded-3xl overflow-hidden shadow-lg min-h-[480px] md:min-h-[560px] flex items-end">
            {featured.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.image}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-forest" />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="relative z-10 p-8 md:p-12 w-full">
              <div className="flex items-center gap-3 mb-4">
                <CategoryTag label={featured.category ?? t('categoryDefault')} />
                {featured.date && (
                  <span className="text-cream/70 text-sm">{formatDate(featured.date)}</span>
                )}
                <span className="text-cream/50 text-sm">· {readingTime(featured)} {t('readMin')}</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-cream font-semibold leading-tight max-w-3xl group-hover:text-gold transition-colors duration-300">
                {featured.title}
              </h2>
              <p className="mt-4 text-cream/80 text-sm font-medium">
                {t('readMore')} →
              </p>
            </div>
          </article>
        </Link>
      </FadeIn>

      {/* Grid of remaining posts */}
      {rest.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post, i) => (
            <FadeIn key={post.id} delay={i * 0.05}>
              <Link href={`/${locale}/news/${post.id}`} className="group block h-full">
                <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full flex flex-col">
                  {post.image ? (
                    <div className="relative h-48 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-forest/10 shrink-0 flex items-center justify-center">
                      <span className="text-forest/30 text-4xl font-serif">A</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <CategoryTag label={post.category ?? t('categoryDefault')} />
                      <span className="text-forest/40 text-xs">{readingTime(post)} {t('readMin')}</span>
                    </div>
                    <h3 className="font-serif text-lg text-forest font-semibold leading-snug group-hover:text-gold transition-colors flex-1">
                      {post.title}
                    </h3>
                    {post.date && (
                      <p className="mt-3 text-xs text-gold font-medium">
                        {t('publishedOn')} {formatDate(post.date)}
                      </p>
                    )}
                    <p className="mt-3 text-sm text-forest/60 font-medium group-hover:text-forest transition-colors">
                      {t('readMore')} →
                    </p>
                  </div>
                </article>
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </Section>
  );
}
