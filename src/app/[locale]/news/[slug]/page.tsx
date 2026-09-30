import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import { OG_DEFAULT_IMAGE, OG_LOCALES, SITE_URL } from '@/lib/seo';
import { WHATSAPP_URL } from '@/lib/constants';
import {
  getAllPosts,
  getFullPostContent,
  getPostById,
  getPostBySlug,
  getPostsBySlug,
  getTranslationSet,
  type NewsPost
} from '@/lib/notion';
import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Locale } from '@/i18n/config';

export const revalidate = 3600;

type Params = { locale: Locale; slug: string };

const NOTION_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const LANGUAGE_LABELS: Record<Locale, string> = { ka: 'ქართ', en: 'EN', ru: 'РУС' };
const DATE_LOCALES: Record<Locale, string> = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU' };

// Some post names already contain the brand; the layout template must not add it again.
const BRAND_NAMES = ['Guest House Akutsa', 'სასტუმრო სახლი აქუცა', 'Гостевой дом Акуца'];

const postPath = (post: NewsPost) => `/${post.locale}/news/${post.slug}`;
const absolute = (path: string) => `${SITE_URL}${path}`;

export async function generateStaticParams({ params: { locale } }: { params: { locale: Locale } }) {
  const posts = await getAllPosts();
  return posts.filter((post) => post.locale === locale).map((post) => ({ slug: post.slug }));
}

// A post lives at /{its language}/news/{slug}. Old Notion-ID URLs and URLs under another
// language resolve to that address; the caller issues the 308 redirect.
async function resolvePost({ locale, slug }: Params): Promise<{ post: NewsPost } | { redirect: string } | null> {
  if (NOTION_ID.test(slug)) {
    const post = await getPostById(slug);
    return post?.locale ? { redirect: postPath(post) } : null;
  }
  const post = await getPostBySlug(locale, slug);
  if (post) return { post };
  // Not available in this language: send to the English version if there is one.
  const others = (await getPostsBySlug(slug)).filter((p) => p.locale);
  const target = others.find((p) => p.locale === 'en') ?? others[0];
  return target ? { redirect: postPath(target) } : null;
}

function excerpt(items: RichTextItemResponse[], max = 155): string {
  const text = items.map((i) => i.plain_text).join('').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 100 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s—-]+$/, '')}…`;
}

async function alternateUrls(post: NewsPost) {
  const set = await getTranslationSet(post);
  const languages: Record<string, string> = {};
  for (const p of set) languages[p.locale!] = absolute(postPath(p));
  languages['x-default'] = absolute(postPath(set.find((p) => p.locale === 'en') ?? post));
  return { set, languages };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resolved = await resolvePost(params);
  if (!resolved || !('post' in resolved)) return {};
  const { post } = resolved;
  const locale = post.locale ?? params.locale;
  const [{ languages }, tMeta] = await Promise.all([
    alternateUrls(post),
    getTranslations({ locale, namespace: 'meta' })
  ]);
  const url = absolute(postPath(post));
  const description = excerpt(post.content);
  const image = absolute(post.image ?? OG_DEFAULT_IMAGE);

  return {
    title: BRAND_NAMES.some((b) => post.title.includes(b)) ? { absolute: post.title } : post.title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      siteName: tMeta('siteName'),
      locale: OG_LOCALES[locale],
      images: [{ url: image, alt: post.title }],
      publishedTime: post.date ?? undefined,
      modifiedTime: post.lastEdited
    },
    twitter: { card: 'summary_large_image', title: post.title, description, images: [image] }
  };
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
        if (item.text.link) {
          node = (
            <a key={i} href={item.text.link.url} className="text-gold underline hover:text-forest">
              {node}
            </a>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </div>
  );
}

export default async function NewsPostPage({ params }: { params: Params }) {
  const resolved = await resolvePost(params);
  if (!resolved) notFound();
  if ('redirect' in resolved) permanentRedirect(resolved.redirect);

  const { post } = resolved;
  const locale = post.locale ?? params.locale;
  const [t, tNav, fullContent, { set }] = await Promise.all([
    getTranslations({ locale, namespace: 'news' }),
    getTranslations({ locale, namespace: 'nav' }),
    getFullPostContent(post.id).catch(() => [] as RichTextItemResponse[]),
    alternateUrls(post)
  ]);
  const content = fullContent.length ? fullContent : post.content;
  const url = absolute(postPath(post));
  const description = excerpt(content);
  const image = absolute(post.image ?? OG_DEFAULT_IMAGE);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: [image],
    datePublished: post.date ?? post.lastEdited,
    dateModified: post.lastEdited,
    inLanguage: locale,
    author: { '@type': 'Person', name: 'Raul Tsintsadze' },
    publisher: { '@id': `${SITE_URL}/#lodging` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url
  };

  const whatsappHref = `${WHATSAPP_URL}?text=${encodeURIComponent(t('whatsappMessage'))}`;
  const stays = [
    { href: `/${locale}/guesthouse`, label: tNav('guesthouse') },
    { href: `/${locale}/cottage`, label: tNav('cottage') },
    { href: `/${locale}/camper`, label: tNav('camper') }
  ];

  return (
    <Section>
      <script
        type="application/ld+json"
        // Escape "<" so post text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            href={`/${locale}/news`}
            className="inline-flex items-center gap-2 text-sm text-forest/60 hover:text-forest transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('backToNews')}
          </Link>

          {set.length > 1 && (
            <nav aria-label={t('readIn')} className="flex items-center gap-2 text-sm">
              <span className="text-forest/50">{t('readIn')}</span>
              {set.map((p, i) => (
                <span key={p.locale} className="flex items-center gap-2">
                  {i > 0 && <span className="text-forest/20">/</span>}
                  {p.locale === locale ? (
                    <span className="font-semibold text-forest" aria-current="page">
                      {LANGUAGE_LABELS[p.locale!]}
                    </span>
                  ) : (
                    <Link
                      href={postPath(p)}
                      hrefLang={p.locale!}
                      lang={p.locale!}
                      className="text-gold hover:text-forest transition-colors"
                    >
                      {LANGUAGE_LABELS[p.locale!]}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <article className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {post.image && (
            <div className="relative w-full h-72 md:h-96">
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}
          <div className="p-8">
            <h1 className="font-serif text-3xl text-forest font-semibold">{post.title}</h1>
            {post.date && (
              <p className="mt-2 text-sm text-gold font-medium">
                {t('publishedOn')}{' '}
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString(DATE_LOCALES[locale], {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </p>
            )}
            <div className="mt-8">
              <RichText items={content} />
            </div>
          </div>
        </article>

        {/* Booking call to action, in the post's language */}
        <aside className="mt-10 rounded-2xl bg-forest text-cream p-8 text-center">
          <h2 className="font-serif text-2xl font-semibold">{t('ctaTitle')}</h2>
          <p className="mt-3 text-cream/80 text-sm leading-relaxed max-w-xl mx-auto">{t('ctaText')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {stays.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-full border border-cream/30 px-5 py-2.5 text-sm font-medium hover:border-gold hover:text-gold transition-colors"
              >
                {s.label}
              </Link>
            ))}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#25D366] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#1ebe5b] transition-colors"
            >
              {t('ctaWhatsapp')}
            </a>
          </div>
        </aside>
      </div>
    </Section>
  );
}
