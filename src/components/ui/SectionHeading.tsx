export default function SectionHeading({
  title,
  subtitle,
  center = true,
  as: Heading = 'h2'
}: {
  title: string;
  subtitle?: string;
  center?: boolean;
  // Use 'h1' when this is the page's main title (one per page).
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={center ? 'text-center mb-12' : 'mb-12'}>
      <Heading className="font-serif text-3xl md:text-4xl text-forest font-semibold">
        {title}
      </Heading>
      {subtitle && (
        <p
          className={`mt-3 text-forest/70 max-w-2xl ${center ? 'mx-auto' : ''}`}
        >
          {subtitle}
        </p>
      )}
      <div
        className={`mt-5 h-[3px] w-16 bg-gold ${center ? 'mx-auto' : ''}`}
      />
    </div>
  );
}
