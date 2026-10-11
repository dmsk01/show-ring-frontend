// ----------------------------------------------------------------------
// Опции сортировки и публикации постов. Подписи берутся из словаря blog по
// value (list.sort.*, toolbar.publish.*). Раньше жили в src/_mock (FE-29).

export const POST_PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

export const POST_SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'oldest', label: 'Oldest' },
];
