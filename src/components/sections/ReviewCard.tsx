import FadeIn from '@/components/ui/FadeIn';

export default function ReviewCard({
  name,
  text,
  delay = 0
}: {
  name: string;
  text: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
        <div className="text-gold text-lg mb-3">★★★★★</div>
        <p className="text-forest/80 text-sm leading-relaxed">&ldquo;{text}&rdquo;</p>
        <p className="mt-4 font-medium text-forest">{name}</p>
      </div>
    </FadeIn>
  );
}
