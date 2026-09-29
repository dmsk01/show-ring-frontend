import {
  Card,
  Label,
  Table,
  TableRow,
  TableBody,
  TableCell,
  CardHeader,
  STATUS_TONE,
  TableContainer,
  TableHeadCustom,
} from 'show-ring-ds';

const HEAD = [
  { id: 'dog', label: 'Собака' },
  { id: 'breed', label: 'Порода' },
  { id: 'class', label: 'Класс' },
  { id: 'grade', label: 'Оценка', align: 'center' },
  { id: 'status', label: 'Статус', align: 'right' },
];

const ROWS = [
  { dog: 'Арчибальд Северная Звезда', breed: 'Самоед', cls: 'Открытый', grade: 'Отл. 1, CAC', status: 'active', statusLabel: 'Подтверждена' },
  { dog: 'Бэлла из Дома Ветров', breed: 'Бигль', cls: 'Промежуточный', grade: '—', status: 'pending', statusLabel: 'На проверке' },
  { dog: 'Граф Орлов', breed: 'Русская псовая борзая', cls: 'Чемпионов', grade: 'Отл. 2', status: 'progress', statusLabel: 'В ринге' },
  { dog: 'Дина', breed: 'Лабрадор-ретривер', cls: 'Юниоров', grade: '—', status: 'danger', statusLabel: 'Отклонена' },
] as const;

export const Results = () => (
  <Card>
    <CardHeader title="Заявки на выставку" subheader="Кубок Москвы · 12 октября" sx={{ mb: 2 }} />
    <TableContainer>
      <Table size="medium">
        <TableHeadCustom headCells={HEAD} />
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.dog} hover>
              <TableCell sx={{ fontWeight: 'fontWeightSemiBold' }}>{row.dog}</TableCell>
              <TableCell>{row.breed}</TableCell>
              <TableCell>{row.cls}</TableCell>
              <TableCell align="center">{row.grade}</TableCell>
              <TableCell align="right">
                <Label color={STATUS_TONE[row.status]}>{row.statusLabel}</Label>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Card>
);
