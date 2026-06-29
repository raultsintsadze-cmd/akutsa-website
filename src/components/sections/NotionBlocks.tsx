import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

function richText(richTextArray: { plain_text: string }[]): string {
  return richTextArray.map((t) => t.plain_text).join('');
}

export default function NotionBlocks({ blocks }: { blocks: BlockObjectResponse[] }) {
  return (
    <div className="space-y-4 text-forest/80 text-sm leading-relaxed">
      {blocks.map((block) => {
        switch (block.type) {
          case 'paragraph':
            if (block.paragraph.rich_text.length === 0) return null;
            return <p key={block.id}>{richText(block.paragraph.rich_text)}</p>;
          case 'heading_1':
            return (
              <h2 key={block.id} className="font-serif text-2xl text-forest font-semibold">
                {richText(block.heading_1.rich_text)}
              </h2>
            );
          case 'heading_2':
            return (
              <h3 key={block.id} className="font-serif text-xl text-forest font-semibold">
                {richText(block.heading_2.rich_text)}
              </h3>
            );
          case 'heading_3':
            return (
              <h4 key={block.id} className="font-medium text-forest">
                {richText(block.heading_3.rich_text)}
              </h4>
            );
          case 'bulleted_list_item':
            return (
              <li key={block.id} className="ml-4 list-disc">
                {richText(block.bulleted_list_item.rich_text)}
              </li>
            );
          case 'numbered_list_item':
            return (
              <li key={block.id} className="ml-4 list-decimal">
                {richText(block.numbered_list_item.rich_text)}
              </li>
            );
          case 'image': {
            const src =
              block.image.type === 'file' ? block.image.file.url : block.image.external.url;
            return (
              <div key={block.id} className="w-full h-72 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            );
          }
          case 'quote':
            return (
              <blockquote key={block.id} className="border-l-4 border-gold pl-4 italic">
                {richText(block.quote.rich_text)}
              </blockquote>
            );
          case 'divider':
            return <hr key={block.id} className="border-forest/10" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
