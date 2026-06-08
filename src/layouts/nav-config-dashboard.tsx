import type { TFunction } from 'i18next';
import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export function navData(t: TFunction): NavSectionProps['data'] {
  return [
    /**
     * ShowTail
     */
    {
      subheader: t('showtail.subheader'),
      items: [
        {
          title: t('showtail.dogs'),
          path: paths.dashboard.dogs.root,
          icon: ICONS.product,
          permission: 'dogs:view',
          children: [
            { title: t('showtail.list'), path: paths.dashboard.dogs.root, permission: 'dogs:view' },
            {
              title: t('showtail.create'),
              path: paths.dashboard.dogs.new,
              permission: 'dogs:create',
            },
          ],
        },
        {
          title: t('showtail.kennels'),
          path: paths.dashboard.kennels.root,
          icon: ICONS.folder,
          permission: 'kennels:view',
          children: [
            {
              title: t('showtail.list'),
              path: paths.dashboard.kennels.root,
              permission: 'kennels:view',
            },
            {
              title: t('showtail.create'),
              path: paths.dashboard.kennels.new,
              permission: 'kennels:create',
            },
          ],
        },
        {
          title: t('showtail.litters'),
          path: paths.dashboard.litters.root,
          icon: ICONS.course,
          permission: 'litters:view',
          children: [
            {
              title: t('showtail.list'),
              path: paths.dashboard.litters.root,
              permission: 'litters:view',
            },
            {
              title: t('showtail.create'),
              path: paths.dashboard.litters.new,
              permission: 'litters:create',
            },
          ],
        },
        {
          title: t('showtail.shows'),
          path: paths.dashboard.shows.root,
          icon: ICONS.booking,
          permission: 'shows:view',
          children: [
            {
              title: t('showtail.list'),
              path: paths.dashboard.shows.root,
              permission: 'shows:view',
            },
            {
              title: t('showtail.create'),
              path: paths.dashboard.shows.new,
              permission: 'shows:create',
            },
          ],
        },
        {
          title: t('showtail.classifieds'),
          path: paths.dashboard.classifieds.root,
          icon: ICONS.blog,
          permission: 'classifieds:view',
          children: [
            {
              title: t('showtail.list'),
              path: paths.dashboard.classifieds.root,
              permission: 'classifieds:view',
            },
            {
              title: t('showtail.create'),
              path: paths.dashboard.classifieds.new,
              permission: 'classifieds:create',
            },
          ],
        },
        {
          title: t('showtail.ads'),
          path: paths.dashboard.ads.root,
          icon: ICONS.banking,
          permission: 'ads:view',
          children: [
            {
              title: t('showtail.campaigns'),
              path: paths.dashboard.ads.root,
              permission: 'ads:view',
            },
            { title: t('showtail.create'), path: paths.dashboard.ads.new, permission: 'ads:create' },
          ],
        },
        {
          title: t('showtail.support'),
          path: paths.dashboard.support.root,
          icon: ICONS.chat,
          permission: 'support:view',
        },
        {
          title: t('showtail.references'),
          path: paths.dashboard.adminReferences,
          icon: ICONS.params,
          permission: 'references:edit',
        },
        {
          title: t('showtail.users'),
          path: paths.dashboard.adminUsers,
          icon: ICONS.user,
          permission: 'admin',
        },
        {
          title: t('showtail.moderation'),
          path: paths.dashboard.adminModeration,
          icon: ICONS.lock,
          permission: 'admin',
        },
        {
          title: t('showtail.analytics'),
          path: paths.dashboard.adminAnalytics,
          icon: ICONS.analytics,
          permission: 'admin',
        },
        {
          title: t('showtail.notifications'),
          path: paths.dashboard.notifications,
          icon: ICONS.label,
          permission: 'dashboard:view',
        },
        {
          title: t('showtail.profile'),
          path: paths.dashboard.profile,
          icon: ICONS.user,
        },
      ],
    },
    /**
     * Demo — страницы шаблона Minimal. Видны только admin, припаркованы тут до чистки.
     */
    {
      subheader: 'Demo',
      items: [
        {
          title: 'Minimal demo',
          path: paths.dashboard.demo,
          icon: ICONS.menuItem,
          permission: 'admin',
          info: (
            <Label color="warning" variant="inverted">
              DEMO
            </Label>
          ),
        },
      ],
    },
  ];
}
