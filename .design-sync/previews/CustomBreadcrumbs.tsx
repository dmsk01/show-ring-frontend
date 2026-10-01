import { Button, Iconify, CustomBreadcrumbs } from 'show-ring-ds';

export const PageHeader = () => (
  <CustomBreadcrumbs
    heading="Мои собаки"
    links={[{ name: 'Кабинет', href: '#' }, { name: 'Собаки', href: '#' }, { name: 'Список' }]}
    action={
      <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
        Добавить собаку
      </Button>
    }
    sx={{ width: 720 }}
  />
);

export const WithBack = () => (
  <CustomBreadcrumbs
    heading="Арчибальд Северная Звезда"
    backHref="#"
    links={[{ name: 'Собаки', href: '#' }, { name: 'Арчибальд' }]}
    sx={{ width: 720 }}
  />
);
