import { getTranslations } from 'next-intl/server';
import FadeIn from '@/components/ui/FadeIn';
import { getWeather, getCurrencyRates, getWeatherIcon } from '@/lib/weatherCurrency';
import type { Locale } from '@/i18n/config';

export default async function WeatherCurrencyWidget({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'weatherWidget' });
  const [weather, currency] = await Promise.all([getWeather(), getCurrencyRates()]);

  if (!weather && !currency) return null;

  return (
    <FadeIn className="container-px -mt-8 relative z-10">
      <div className="max-w-5xl mx-auto bg-cream rounded-2xl shadow-lg border border-forest/10 px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm text-forest">
          <span className="flex items-center gap-2 font-medium">
            🌤️ {t('locationLabel')}
          </span>

          {weather && (
            <>
              <span className="hidden sm:inline text-gold">|</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold">{weather.temperature}°C</span>
                <span>{getWeatherIcon(weather.weatherCode)}</span>
                <span className="text-forest/70">
                  {t('windLabel')}: {weather.windSpeed}
                  {t('windUnit')}
                </span>
              </span>
            </>
          )}

          {currency && (
            <>
              <span className="hidden sm:inline text-gold">|</span>
              <span className="flex items-center gap-1.5">
                💵 1 USD = <span className="text-gold font-medium">{currency.usdRate.toFixed(2)} ₾</span>
              </span>
              <span className="hidden sm:inline text-gold">|</span>
              <span className="flex items-center gap-1.5">
                💶 1 EUR = <span className="text-gold font-medium">{currency.eurRate.toFixed(2)} ₾</span>
              </span>
            </>
          )}
        </div>

        {currency && (
          <p className="text-center text-xs text-forest/40 mt-2">{t('sourceLabel')}</p>
        )}
      </div>
    </FadeIn>
  );
}
