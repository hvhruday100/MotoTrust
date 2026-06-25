import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api, BookingStatus, ServiceTask, ServiceTaskStatus } from '../../../lib/api';
import { formatCurrency } from '@mototrust/ui';

const lifecycleStatuses: BookingStatus[] = [
  'CREATED',
  'CONFIRMED',
  'PICKUP_ASSIGNED',
  'PICKED_UP',
  'RECEIVED_AT_SERVICE_CENTER',
  'INSPECTION_COMPLETED',
  'AWAITING_CUSTOMER_APPROVAL',
  'APPROVED_FOR_SERVICE',
  'IN_SERVICE',
  'QUALITY_CHECK',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

type ProgressPageProps = {
  searchParams: {
    bookingId?: string;
  };
};

const taskStatuses: ServiceTaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatMaybeDate(value?: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return formatDate(value);
}

function groupTasks(tasks: ServiceTask[], status: ServiceTaskStatus) {
  return tasks.filter((task) => task.status === status);
}

export default async function BookingProgressPage({ searchParams }: ProgressPageProps) {
  if (!searchParams.bookingId) {
    redirect('/');
  }

  const booking = await api.getBooking(searchParams.bookingId);
  const serviceExecution = await api.getServiceExecution(searchParams.bookingId).catch(() => null);
  const currentIndex = lifecycleStatuses.indexOf(booking.status);

  return (
    <main className="page">
      <section className="ops-header">
        <div>
          <p className="eyebrow">Live progress</p>
          <h1>{formatStatus(booking.status)}</h1>
          <p className="lede">
            {booking.servicePackageName} · {formatCurrency(booking.quotedPrice)}
          </p>
        </div>
        <div className="actions">
          <Link href="/">Home</Link>
          <Link href={`/bookings/approval?bookingId=${booking.id}`}>Approval</Link>
        </div>
      </section>

      <section className="timeline-layout">
        <div className="timeline-card">
          <h2>Lifecycle</h2>
          <ol className="status-rail">
            {lifecycleStatuses.map((status, index) => {
              const completed = booking.status === 'CANCELLED' ? index === 0 : index <= currentIndex;
              return (
                <li key={status} className={completed ? 'done' : ''}>
                  <span>{index + 1}</span>
                  {formatStatus(status)}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="timeline-card">
          <h2>Audit trail</h2>
          <ol className="audit-list">
            {booking.timeline.map((event) => (
              <li key={event.id}>
                <strong>{formatStatus(event.toStatus)}</strong>
                <p>
                  {event.actorName} · {event.actorType} · {formatDate(event.createdAt)}
                </p>
                {event.note ? <p>{event.note}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {serviceExecution ? (
        <section className="timeline-card" style={{ marginTop: 18 }}>
          <h2>Service task progress</h2>
          <p className="lede" style={{ marginTop: 8, fontSize: 16 }}>
            Live mechanic execution board for this booking.
          </p>

          <div className="kanban-grid compact" style={{ marginTop: 24 }}>
            {taskStatuses.map((status) => (
              <div key={status} className="kanban-column">
                <div className="kanban-column-header">
                  <h2>{formatStatus(status)}</h2>
                  <span>{groupTasks(serviceExecution.tasks, status).length}</span>
                </div>
                <div className="kanban-stack">
                  {groupTasks(serviceExecution.tasks, status).map((task) => (
                    <article key={task.id} className="kanban-card customer-card">
                      <div className="card-heading">
                        <div>
                          <h3>{task.name}</h3>
                          <p>{task.assignedMechanicName ?? 'Mechanic pending assignment'}</p>
                        </div>
                      </div>
                      {task.notes ? <p className="task-notes">{task.notes}</p> : null}
                      <dl className="task-meta">
                        <div>
                          <dt>Started</dt>
                          <dd>{formatMaybeDate(task.startedAt)}</dd>
                        </div>
                        <div>
                          <dt>Completed</dt>
                          <dd>{formatMaybeDate(task.completedAt)}</dd>
                        </div>
                      </dl>
                      {task.partsUsed.length ? (
                        <ul className="parts-list">
                          {task.partsUsed.map((part) => (
                            <li key={part.id}>
                              <strong>{part.name}</strong>
                              <span>
                                {part.quantity} x {formatCurrency(part.unitPrice)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
