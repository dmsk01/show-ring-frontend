'use client';

import { AboutHero } from '../about-hero';
import { AboutWhat } from '../about-what';
import { AboutVision } from '../about-vision';

// ----------------------------------------------------------------------

export function AboutView() {
  return (
    <>
      <AboutHero />

      <AboutWhat />

      <AboutVision />

      {/* Блоки «Команда» и «Отзывы» шаблона убраны: там вымышленные люди и
          отзывы со стоковыми фото (ст. 5 Закона «О рекламе» — недостоверная
          реклама). Вернуть только с реальными людьми и их согласия. */}
    </>
  );
}
