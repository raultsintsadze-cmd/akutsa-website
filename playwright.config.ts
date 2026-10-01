import { defineConfig } from '@playwright/test';

// End-to-end tests for the booking flow. They run the production build (`npm run build` first)
// against tests/e2e/mock-server.mjs, which stands in for Notion, the OTA iCal feeds,
// Telegram and OpenAI. Nothing real is contacted.
const MOCK = 'http://127.0.0.1:4010';
const APP_PORT = 3210;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    // Mobile-first: iPhone-sized viewport.
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  },
  webServer: [
    {
      command: 'node tests/e2e/mock-server.mjs',
      url: `${MOCK}/__health`,
      reuseExistingServer: false
    },
    {
      command: `npx next start -p ${APP_PORT}`,
      url: `http://127.0.0.1:${APP_PORT}/robots.txt`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NOTION_TOKEN: 'test-token',
        NOTION_API_BASE_URL: MOCK,
        NOTION_DATABASE_ID: '',
        NOTION_RTVELI_DATABASE_ID: '',
        BOOKING_CACHE: 'off',
        TELEGRAM_BOT_TOKEN: 'test-bot-token',
        TELEGRAM_API_BASE_URL: MOCK,
        TELEGRAM_WEBHOOK_SECRET: 'test-webhook-secret',
        ICAL_EXPORT_TOKEN: 'test-ical-token',
        ICAL_COTTAGE_BOOKING: `${MOCK}/ical/cottage-booking.ics`,
        ICAL_COTTAGE_AIRBNB: `${MOCK}/ical/cottage-airbnb.ics`,
        OPENAI_API_KEY: 'test-openai-key',
        OPENAI_API_BASE_URL: `${MOCK}/openai`
      }
    }
  ]
});
