import type { Ticket } from '@/lib/types';

function formatDuration(ms: number) {
  const absMs = Math.abs(ms);
  const totalMinutes = Math.floor(absMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getTicketSlaSummary(ticket: Ticket) {
  if (!ticket.slaDueAt || !ticket.slaTargetMinutes) {
    return {
      label: 'No SLA',
      tone: 'neutral',
    } as const;
  }

  const now = Date.now();
  const dueAt = new Date(ticket.slaDueAt).getTime();
  const diff = dueAt - now;
  const terminal = ['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status);

  if (terminal) {
    if (ticket.slaMet === true) {
      return { label: 'Resolved within SLA', tone: 'good' } as const;
    }
    if (ticket.slaMet === false) {
      return { label: 'Resolved after SLA breach', tone: 'bad' } as const;
    }
  }

  if (diff >= 0) {
    return { label: `${formatDuration(diff)} left`, tone: 'warning' } as const;
  }

  return { label: `Overdue by ${formatDuration(diff)}`, tone: 'bad' } as const;
}
