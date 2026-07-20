import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse
} from '@notionhq/client/build/src/api-endpoints';
import type { Locale } from '@/i18n/config';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = NOTION_TOKEN ? new Client({ auth: NOTION_TOKEN }) : null;

export interface NewsPost {
  id: string;
  title: string;
  date: string | null;
  image: string | null;
  category: string | null;
  content: RichTextItemResponse[];
  blocks: BlockObjectResponse[];
}

function getTitle(page: PageObjectResponse): string {
  const prop = Object.values(page.properties).find((p) => p.type === 'title');
  if (prop?.type === 'title') {
    return prop.title.map((t) => t.plain_text).join('');
  }
  return '';
}

function getDate(page: PageObjectResponse): string | null {
  const prop = Object.values(page.properties).find((p) => p.type === 'date');
  if (prop?.type === 'date') {
    return prop.date?.start ?? null;
  }
  return null;
}

function getImage(page: PageObjectResponse): string | null {
  const filesProp = Object.values(page.properties).find((p) => p.type === 'files');
  if (filesProp?.type === 'files' && filesProp.files.length > 0) {
    const file = filesProp.files[0];
    if (file.type === 'file') return file.file.url;
    if (file.type === 'external') return file.external.url;
  }
  if (page.cover) {
    if (page.cover.type === 'file') return page.cover.file.url;
    if (page.cover.type === 'external') return page.cover.external.url;
  }
  return null;
}

function getCategory(page: PageObjectResponse): string | null {
  const entry = Object.entries(page.properties).find(
    ([key, value]) => value.type === 'select' && key.toLowerCase() === 'category'
  );
  const prop = entry?.[1];
  if (prop?.type === 'select' && prop.select) return prop.select.name;
  return null;
}

function getText(page: PageObjectResponse): RichTextItemResponse[] {
  const entry = Object.entries(page.properties).find(
    ([key, value]) => value.type === 'rich_text' && key.toLowerCase() === 'text'
  );
  const prop = entry?.[1];
  if (prop?.type === 'rich_text') return prop.rich_text;
  return [];
}

function getLocale(page: PageObjectResponse): Locale | null {
  const entry = Object.entries(page.properties).find(
    ([key, value]) => value.type === 'select' && key.toLowerCase() === 'locale'
  );
  const prop = entry?.[1];
  if (prop?.type === 'select' && prop.select) {
    return prop.select.name as Locale;
  }
  return null;
}

export async function getPublishedPosts(locale: Locale): Promise<NewsPost[]> {
  if (!notion || !NOTION_DATABASE_ID) return [];

  try {
    const database = await notion.databases.retrieve({ database_id: NOTION_DATABASE_ID });
    const dataSourceId =
      'data_sources' in database ? database.data_sources[0]?.id : undefined;

    if (!dataSourceId) return [];

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: 'Published',
        checkbox: { equals: true }
      },
      sorts: [{ property: 'Date', direction: 'descending' }]
    });

    const pages = response.results.filter(
      (p): p is PageObjectResponse => p.object === 'page' && 'properties' in p
    );

    const localized = pages.filter((page) => {
      const pageLocale = getLocale(page);
      return pageLocale === null || pageLocale === locale;
    });

    const posts = await Promise.all(
      localized.map(async (page) => {
        const blocksResponse = await notion!.blocks.children.list({ block_id: page.id });
        const blocks = blocksResponse.results.filter(
          (b): b is BlockObjectResponse => 'type' in b
        );

        return {
          id: page.id,
          title: getTitle(page),
          date: getDate(page),
          image: getImage(page),
          category: getCategory(page),
          content: getText(page),
          blocks
        };
      })
    );

    return posts;
  } catch (err) {
    console.error('Failed to fetch Notion posts:', err);
    return [];
  }
}

export async function getPostById(id: string): Promise<NewsPost | null> {
  if (!notion) return null;

  try {
    const page = await notion.pages.retrieve({ page_id: id });
    if (!('properties' in page)) return null;

    const typedPage = page as PageObjectResponse;

    // Find the "Text" rich_text property entry to get its property ID
    const textEntry = Object.entries(typedPage.properties).find(
      ([key, value]) => value.type === 'rich_text' && key.toLowerCase() === 'text'
    );

    let content: RichTextItemResponse[] = [];

    if (textEntry) {
      const [, textProp] = textEntry;
      if (textProp.type === 'rich_text') {
        // Try inline value first; if empty, fetch via properties API (handles long text)
        if (textProp.rich_text.length > 0) {
          content = textProp.rich_text;
        } else {
          try {
            const propResponse = await notion.pages.properties.retrieve({
              page_id: id,
              property_id: textProp.id
            });
            if (propResponse.object === 'list') {
              content = (propResponse.results as unknown as RichTextItemResponse[]);
            } else if (propResponse.type === 'rich_text') {
              content = [propResponse.rich_text as unknown as RichTextItemResponse];
            }
          } catch {
            // fall through with empty content
          }
        }
      }
    }

    return {
      id: page.id,
      title: getTitle(typedPage),
      date: getDate(typedPage),
      image: getImage(typedPage),
      category: getCategory(typedPage),
      content,
      blocks: []
    };
  } catch (err) {
    console.error('Failed to fetch Notion post:', err);
    return null;
  }
}

export function isNotionConfigured(): boolean {
  return Boolean(NOTION_TOKEN && NOTION_DATABASE_ID);
}
