import { clsx } from 'clsx';

export default function Section({
  children,
  className,
  id
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={clsx('container-px py-16 md:py-24', className)}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}
