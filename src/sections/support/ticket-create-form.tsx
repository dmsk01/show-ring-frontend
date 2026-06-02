'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createTicket } from 'src/actions/support';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { TICKET_PRIORITIES } from 'src/types/support';

// ----------------------------------------------------------------------

const TicketSchema = z.object({
  subject: z.string().min(1, { error: 'Subject is required!' }),
  body: z.string().min(1, { error: 'Message is required!' }),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
});

type TicketSchemaType = z.infer<typeof TicketSchema>;

export function TicketCreateForm() {
  const router = useRouter();

  const methods = useForm<TicketSchemaType>({
    resolver: zodResolver(TicketSchema),
    defaultValues: { subject: '', body: '', priority: 'normal' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createTicket(data);
      toast.success('Ticket created!');
      router.push(paths.dashboard.support.root);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create ticket');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text name="subject" label="Subject" />
          <Field.Select name="priority" label="Priority">
            {TICKET_PRIORITIES.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Field.Select>
          <Field.Text name="body" label="Message" multiline rows={5} />
        </Box>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Create ticket
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
