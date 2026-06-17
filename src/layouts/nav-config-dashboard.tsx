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
     * Show Ring
     */
    {
      subheader: t('show_ring.subheader'),
      items: [
        {
          title: t('show_ring.dogs'),
          path: paths.dashboard.dogs.root,
          icon: ICONS.product,
          permission: 'dogs:view',
        },
        {
          title: t('show_ring.kennels'),
          path: paths.dashboard.kennels.root,
          icon: ICONS.folder,
          permission: 'kennels:view',
        },
        {
          title: t('show_ring.litters'),
          path: paths.dashboard.litters.root,
          icon: ICONS.course,
          permission: 'litters:view',
        },
        {
          title: t('show_ring.classifieds'),
          path: paths.dashboard.classifieds.root,
          icon: ICONS.blog,
          permission: 'classifieds:view',
        },
        {
          title: t('show_ring.ads'),
          path: paths.dashboard.ads.root,
          icon: ICONS.banking,
          permission: 'ads:view',
        },
        {
          title: t('show_ring.support'),
          path: paths.dashboard.support.root,
          icon: ICONS.chat,
          permission: 'support:view',
          flag: 'support',
        },
        {
          title: t('show_ring.references'),
          path: paths.dashboard.adminReferences,
          icon: ICONS.params,
          permission: 'references:edit',
        },
        {
          title: t('show_ring.users'),
          path: paths.dashboard.adminUsers,
          icon: ICONS.user,
          permission: 'admin',
        },
        {
          title: t('show_ring.moderation'),
          path: paths.dashboard.adminModeration,
          icon: ICONS.lock,
          permission: 'admin',
        },
        {
          title: t('show_ring.analytics'),
          path: paths.dashboard.adminAnalytics,
          icon: ICONS.analytics,
          permission: 'admin',
        },
        {
          title: t('show_ring.system'),
          path: paths.dashboard.adminSystem,
          icon: ICONS.params,
          permission: 'admin',
        },
        {
          title: t('show_ring.notifications'),
          path: paths.dashboard.notifications,
          icon: ICONS.label,
          permission: 'dashboard:view',
        },
        {
          title: t('show_ring.myShows'),
          path: paths.dashboard.myShows.root,
          icon: ICONS.booking,
          permission: 'dogs:view',
        },
        {
          title: t('show_ring.profile'),
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
