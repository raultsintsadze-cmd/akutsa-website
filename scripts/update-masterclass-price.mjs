// One-off: masterclass price 30 → 50 GEL (overnight guests only) in the Akutsa News Notion database.
// Usage: node scripts/update-masterclass-price.mjs          (dry run)
//        node scripts/update-masterclass-price.mjs --apply  (write changes)
import fs from 'node:fs';
import { Client } from '@notionhq/client';

const APPLY = process.argv.includes('--apply');
const DATA_SOURCE_ID = '38ebf27e-a6c4-8050-b4cd-000bf8c64bde';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const notion = new Client({ auth: env.NOTION_TOKEN });

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Optional trailing "(... overnight ...)" note left by an earlier edit, so it isn't duplicated.
const OLD_NOTE = String.raw`(?:\s*\([^)]*(?:overnight|ноч|ღამ)[^)]*\))?`;

const RULES = [
  ['Price: 30 GEL/person', 'Price: 50 GEL/person (only for guests staying overnight at Guest House Akutsa)'],
  ['Price: 30 GEL per person', 'Price: 50 GEL per person (only for guests staying overnight at Guest House Akutsa)'],
  ['Цена: 30 GEL/человек', 'Цена: 50 GEL/человек (только для гостей, которые остаются у нас на ночь)'],
  ['ფასი: 30 GEL/ადამიანი', 'ფასი: 50 GEL/ადამიანი (მხოლოდ იმ სტუმრებისთვის, ვინც ჩვენთან ღამეს ათევს)']
].map(([from, to]) => ({ re: new RegExp(esc(from) + OLD_NOTE, 'g'), to }));

// The bullet already ends in its own parenthesis; an earlier edit may have extended it.
RULES.push({
  re: /Culinary masterclass — cook traditional dishes \(30 GEL\/person[^)]*\)/g,
  to: 'Culinary masterclass — cook traditional dishes (50 GEL/person, only for overnight guests)'
});

function applyRules(text) {
  let out = text;
  for (const { re, to } of RULES) out = out.replace(re, to);
  return out;
}

// Full rich_text of a property (the page object truncates long values).
async function getFullRichText(pageId, propId) {
  const items = [];
  let cursor;
  do {
    const res = await notion.pages.properties.retrieve({
      page_id: pageId,
      property_id: propId,
      start_cursor: cursor
    });
    if (res.object !== 'list') return res.rich_text ? [res.rich_text] : [];
    for (const r of res.results) items.push(r.rich_text ?? r.title);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return items;
}

// Convert a response rich_text item back into request format.
function toRequest(item) {
  const { annotations } = item;
  if (item.type === 'text') {
    return { type: 'text', text: { content: item.text.content, link: item.text.link }, annotations };
  }
  if (item.type === 'equation') return { type: 'equation', equation: item.equation, annotations };
  return { type: 'mention', mention: item.mention, annotations };
}

function patchItems(items, fix) {
  let changed = false;
  const diffs = [];
  const next = items.map((item) => {
    const req = toRequest(item);
    if (item.type !== 'text') return req;
    const before = item.text.content;
    const after = fix(before);
    if (after !== before) {
      changed = true;
      diffs.push({ before, after });
      req.text.content = after;
    }
    return req;
  });
  return { changed, diffs, next: next.flatMap(splitLong) };
}

// The API rejects text items over 2000 chars (the Notion editor doesn't), so split
// long items into same-formatted chunks, preferring to break after a newline.
function splitLong(req) {
  const MAX = 2000;
  if (req.type !== 'text' || req.text.content.length <= MAX) return [req];
  const chunks = [];
  let rest = req.text.content;
  while (rest.length > MAX) {
    let cut = rest.lastIndexOf('\n', MAX - 1) + 1;
    if (cut <= 0) cut = MAX;
    // Don't split an emoji's surrogate pair.
    if (/[\uD800-\uDBFF]/.test(rest[cut - 1])) cut -= 1;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  chunks.push(rest);
  return chunks.map((content) => ({ ...req, text: { ...req.text, content } }));
}

const pages = [];
let cursor;
do {
  const res = await notion.dataSources.query({ data_source_id: DATA_SOURCE_ID, start_cursor: cursor });
  pages.push(...res.results.filter((p) => p.object === 'page'));
  cursor = res.has_more ? res.next_cursor : undefined;
} while (cursor);

console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — ${pages.length} pages\n`);

const changedPages = [];
const leftovers = [];

for (const page of pages) {
  const titleEntry = Object.entries(page.properties).find(([, p]) => p.type === 'title');
  const textEntry = Object.entries(page.properties).find(
    ([k, p]) => p.type === 'rich_text' && k.toLowerCase() === 'text'
  );

  const titleItems = titleEntry ? await getFullRichText(page.id, titleEntry[1].id) : [];
  const textItems = textEntry ? await getFullRichText(page.id, textEntry[1].id) : [];
  const title = titleItems.map((t) => t.plain_text).join('');

  const titlePatch = patchItems(titleItems, (s) => s.replaceAll('ჭვენთან', 'ჩვენთან'));
  const textPatch = patchItems(textItems, applyRules);

  if (titlePatch.changed || textPatch.changed) {
    console.log(`■ ${title}  (${page.id})`);
    for (const d of titlePatch.diffs) console.log(`  [Name]\n    - ${d.before}\n    + ${d.after}`);
    for (const d of textPatch.diffs) {
      // Print only the lines that differ, not the whole paragraph.
      const b = d.before.split('\n');
      const a = d.after.split('\n');
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) console.log(`  [Text]\n    - ${b[i] ?? ''}\n    + ${a[i] ?? ''}`);
      }
    }
    console.log('');

    if (APPLY) {
      const properties = {};
      if (titlePatch.changed) properties[titleEntry[0]] = { title: titlePatch.next };
      if (textPatch.changed) properties[textEntry[0]] = { rich_text: textPatch.next };
      await notion.pages.update({ page_id: page.id, properties });
    }
    changedPages.push(title);
  }

  // Anything still at 30 near a masterclass mention needs a manual look.
  const finalText = textPatch.next
    .map((i) => (i.type === 'text' ? i.text.content : ''))
    .join('');
  for (const line of finalText.split('\n')) {
    if (!/30\s*(GEL|ლარ|лар)/i.test(line)) continue;
    if (/masterclass|мастер|მასტერ|culinar|кулинар|კულინარ|Price:|Цена:|ფასი:/i.test(line)) {
      leftovers.push(`${title}: ${line.trim()}`);
    }
  }
}

console.log(`Pages ${APPLY ? 'changed' : 'to change'}: ${changedPages.length}`);
for (const t of changedPages) console.log(`  - ${t}`);
console.log(`\nStill mentioning 30 GEL/ლარ/лар near a masterclass/price line: ${leftovers.length}`);
for (const l of leftovers) console.log(`  - ${l}`);
