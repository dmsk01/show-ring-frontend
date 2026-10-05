import type { MetadataRoute } from 'next';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------
// robots.txt — просьба к добросовестным роботам, а не защита: вредные боты
// его игнорируют (их держат лимиты nginx/API). План защиты 2026-10-05.

// AI-краулеры (обучение моделей и ответы ассистентов): база питомников,
// собак и объявлений не должна уходить в обучение. На индексацию в
// Яндексе и Google не влияет.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
  'cohere-ai',
  'Amazonbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Кабинет, вход и API не индексируются: там нет публичного
        // контента, а запросы роботов — лишняя нагрузка.
        disallow: ['/dashboard/', '/auth/', '/api/', '/confirm-email-change/'],
      },
      { userAgent: AI_CRAWLERS, disallow: '/' },
    ],
    sitemap: `${CONFIG.siteUrl}/sitemap.xml`,
  };
}
