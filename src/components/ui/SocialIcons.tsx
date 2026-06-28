import { clsx } from 'clsx';
import {
  TELEGRAM_URL,
  WHATSAPP_URL,
  SOCIAL_LINKS
} from '@/lib/constants';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.13 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.81 8.44-4.94 8.44-9.94z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.05-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.31-1.46.72-2.13 1.39-.67.67-1.08 1.34-1.39 2.13-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.31.79.72 1.46 1.39 2.13.67.67 1.34 1.08 2.13 1.39.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.39.67-.67 1.08-1.34 1.39-2.13.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.39-2.13-.67-.67-1.34-1.08-2.13-1.39-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.84a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.18-1.43V14.7a5.3 5.3 0 1 1-4.45-5.23v2.5a2.78 2.78 0 1 0 1.95 2.65V0h2.5a4.28 4.28 0 0 0 4.28 4.28v1.54z" />
    </svg>
  );
}

function BookingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        B
      </text>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.57 8.16-1.79 8.45c-.13.6-.49.75-.99.47l-2.74-2.02-1.32 1.27c-.15.15-.27.27-.55.27l.2-2.79 5.1-4.6c.22-.2-.05-.31-.34-.11l-6.3 3.97-2.72-.85c-.59-.18-.6-.59.12-.87l10.63-4.1c.49-.18.92.12.76.91z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
      <path d="M16 0C7.16 0 0 7.16 0 16c0 2.85.74 5.53 2.04 7.86L0 32l8.34-2.02A15.9 15.9 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm0 29.27c-2.51 0-4.85-.68-6.86-1.86l-.49-.29-4.95 1.2 1.23-4.82-.32-.5A13.2 13.2 0 0 1 2.73 16C2.73 8.66 8.66 2.73 16 2.73S29.27 8.66 29.27 16 23.34 29.27 16 29.27zm7.27-9.86c-.4-.2-2.36-1.16-2.72-1.3-.36-.13-.63-.2-.9.2-.26.4-1.02 1.3-1.25 1.56-.23.27-.46.3-.86.1-.4-.2-1.68-.62-3.2-1.98-1.18-1.05-1.98-2.36-2.21-2.76-.23-.4-.02-.62.18-.82.2-.2.45-.5.67-.76.22-.26.3-.45.45-.75.15-.3.07-.55-.05-.75-.13-.2-.83-2-1.14-2.74-.3-.7-.6-.6-.83-.6-.2-.02-.46-.02-.7-.02-.24 0-.62.1-.95.45-.32.36-1.25 1.22-1.25 2.97s1.28 3.44 1.46 3.68c.18.24 2.46 3.76 6 5.13 3.53 1.36 3.53.9 4.16.85.64-.06 2.06-.84 2.36-1.66.3-.82.3-1.52.2-1.66-.08-.14-.36-.22-.76-.42z" />
    </svg>
  );
}

export const socialItems = [
  { href: SOCIAL_LINKS.facebook, label: 'Facebook', Icon: FacebookIcon },
  { href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: InstagramIcon },
  { href: SOCIAL_LINKS.tiktok, label: 'TikTok', Icon: TikTokIcon },
  { href: SOCIAL_LINKS.booking, label: 'Booking.com', Icon: BookingIcon },
  { href: TELEGRAM_URL, label: 'Telegram', Icon: TelegramIcon },
  { href: WHATSAPP_URL, label: 'WhatsApp', Icon: WhatsAppIcon }
];

export default function SocialIcons({
  className,
  iconClassName
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-4', className)}>
      {socialItems.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-cream/20 hover:border-gold hover:text-gold hover:bg-cream/5 transition-colors"
        >
          <Icon className={clsx('w-5 h-5', iconClassName)} />
        </a>
      ))}
    </div>
  );
}
