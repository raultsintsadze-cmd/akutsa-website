const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=41.6001&longitude=41.9640&current=temperature_2m,weathercode,windspeed_10m&timezone=Asia/Tbilisi';

const CURRENCY_URL = 'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json';

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
}

export interface CurrencyData {
  usdRate: number;
  eurRate: number;
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌤️';
}

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const res = await fetch(WEATHER_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const data = await res.json();
    const current = data?.current;
    if (!current || typeof current.temperature_2m !== 'number') return null;

    return {
      temperature: Math.round(current.temperature_2m),
      weatherCode: current.weathercode ?? 0,
      windSpeed: Math.round(current.windspeed_10m ?? 0)
    };
  } catch (err) {
    console.error('Failed to fetch weather:', err);
    return null;
  }
}

export async function getCurrencyRates(): Promise<CurrencyData | null> {
  try {
    const res = await fetch(CURRENCY_URL, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    const currencies = Array.isArray(data) ? data[0]?.currencies : undefined;
    if (!Array.isArray(currencies)) return null;

    const usd = currencies.find((c: { code?: string }) => c.code === 'USD');
    const eur = currencies.find((c: { code?: string }) => c.code === 'EUR');

    if (typeof usd?.rate !== 'number' || typeof eur?.rate !== 'number') return null;

    return { usdRate: usd.rate, eurRate: eur.rate };
  } catch (err) {
    console.error('Failed to fetch currency rates:', err);
    return null;
  }
}
