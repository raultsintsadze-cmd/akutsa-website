export default function SectionHeading({
  title,
  subtitle,
  center = true
}: {
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? 'text-center mb-12' : 'mb-12'}>
      <h2 className="font-serif text-3xl md:text-4xl text-forest font-semibold">
        {title}
      </h2>
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
