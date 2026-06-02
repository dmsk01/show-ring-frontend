export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

export type ITicket = {
  id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ITicketCreate = {
  subject: string;
  body: string;
  priority?: TicketPriority;
};

export type IMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_from_operator: boolean;
  body: string;
  is_read: boolean;
  created_at: string;
};
