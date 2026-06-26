import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api, ServiceTask, ServiceTaskStatus } from '../../../lib/api';
import { formatCurrency } from '@mototrust/ui';
import { AppShell } from '../../../components/app-shell';
import { requireSessionUser } from '../../../lib/session';

const boardStatuses: ServiceTaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

type ServiceExecutionPageProps = {
  searchParams: {
    bookingId?: string;
    mechanicId?: string;
  };
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

async function updateTask(formData: FormData) {
  'use server';

  const bookingId = String(formData.get('bookingId') ?? '');
  const taskId = String(formData.get('taskId') ?? '');

  await api.updateServiceTask(taskId, {
    status: String(formData.get('status') ?? '') || undefined,
    assignedMechanicId: String(formData.get('assignedMechanicId') ?? '') || undefined,
    assignedMechanicName: String(formData.get('assignedMechanicName') ?? '') || undefined,
    notes: String(formData.get('notes') ?? '') || undefined
  });

  redirect(`/admin/service-execution?bookingId=${bookingId}`);
}

async function addPart(formData: FormData) {
  'use server';

  const bookingId = String(formData.get('bookingId') ?? '');
  const taskId = String(formData.get('taskId') ?? '');

  await api.addServiceTaskPart(taskId, {
    sku: String(formData.get('sku') ?? ''),
    name: String(formData.get('name') ?? ''),
    manufacturer: String(formData.get('manufacturer') ?? ''),
    quantity: Number(formData.get('quantity') ?? 1),
    unitPrice: Number(formData.get('unitPrice') ?? 0),
    batchCode: String(formData.get('batchCode') ?? '') || undefined
  });

  redirect(`/admin/service-execution?bookingId=${bookingId}`);
}

function renderTaskCard(task: ServiceTask, bookingId: string) {
  return (
    <article key={task.id} className="kanban-card">
      <div className="card-heading">
        <div>
          <h3>{task.name}</h3>
          <p>{task.description ?? 'Standard service workflow task.'}</p>
        </div>
        <span className={`badge badge-${task.status.toLowerCase()}`}>{formatLabel(task.status)}</span>
      </div>

      <dl className="task-meta">
        <div>
          <dt>Mechanic</dt>
          <dd>{task.assignedMechanicName ?? 'Unassigned'}</dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{formatDate(task.startedAt)}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{formatDate(task.completedAt)}</dd>
        </div>
      </dl>

      {task.notes ? <p className="task-notes">{task.notes}</p> : null}

      <form action={updateTask} className="status-form compact-form">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="taskId" value={task.id} />
        <label>
          Mechanic id
          <input name="assignedMechanicId" defaultValue={task.assignedMechanicId ?? ''} placeholder="mech-001" />
        </label>
        <label>
          Mechanic name
          <input name="assignedMechanicName" defaultValue={task.assignedMechanicName ?? ''} placeholder="Ravi Kumar" />
        </label>
        <label>
          Task status
          <select name="status" defaultValue={task.status}>
            {boardStatuses.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Notes
          <textarea name="notes" defaultValue={task.notes ?? ''} rows={3} />
        </label>
        <button type="submit">Save task</button>
      </form>

      <div className="parts-section">
        <h4>Parts used</h4>
        {task.partsUsed.length ? (
          <ul className="parts-list">
            {task.partsUsed.map((part) => (
              <li key={part.id}>
                <strong>{part.name}</strong>
                <span>
                  {part.sku} · {part.quantity} x {formatCurrency(part.unitPrice)} = {formatCurrency(part.totalPrice)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No parts logged yet.</p>
        )}

        <form action={addPart} className="status-form compact-form" style={{ marginTop: 12 }}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="taskId" value={task.id} />
          <label>
            Part SKU
            <input name="sku" placeholder="BP-SET-001" required />
          </label>
          <label>
            Part name
            <input name="name" placeholder="Front Brake Pad Set" required />
          </label>
          <label>
            Manufacturer
            <input name="manufacturer" placeholder="Brembo" required />
          </label>
          <label>
            Quantity
            <input name="quantity" type="number" min="1" step="1" defaultValue="1" required />
          </label>
          <label>
            Unit price
            <input name="unitPrice" type="number" min="0" step="0.01" required />
          </label>
          <label>
            Batch code
            <input name="batchCode" placeholder="Optional" />
          </label>
          <button type="submit">Add part</button>
        </form>
      </div>
    </article>
  );
}

export default async function AdminServiceExecutionPage({ searchParams }: ServiceExecutionPageProps) {
  await requireSessionUser(['ADMIN']);
  if (!searchParams.bookingId) {
    const bookings = await api.listAdminBookings();
    const executionQueue = bookings.filter((booking) =>
      ['APPROVED_FOR_SERVICE', 'IN_SERVICE', 'QUALITY_CHECK', 'READY_FOR_DELIVERY'].includes(booking.status)
    );

    return (
      <AppShell
        role="ADMIN"
        currentPath="/admin/service-execution"
        eyebrow="Mechanic workflow"
        title="Service execution overview"
        description="Surface bookings that need mechanic assignment, active service tracking, or final quality confirmation."
        actions={<Link href="/admin/bookings">Back to bookings</Link>}
      >
        <section className="surface">
          <div className="metric-grid">
            <article className="metric-card">
              <strong>{executionQueue.length}</strong>
              <span>Bookings in execution flow</span>
            </article>
            <article className="metric-card">
              <strong>{executionQueue.filter((booking) => booking.status === 'APPROVED_FOR_SERVICE').length}</strong>
              <span>Likely needing mechanic assignment</span>
            </article>
            <article className="metric-card">
              <strong>{executionQueue.filter((booking) => booking.status === 'QUALITY_CHECK').length}</strong>
              <span>Waiting for quality review</span>
            </article>
          </div>
        </section>

        <section className="ops-list">
          {executionQueue.map((booking) => (
            <article key={booking.id} className="booking-row">
              <div className="booking-summary">
                <p className="mono">{booking.id}</p>
                <h2>{booking.servicePackageName}</h2>
                <p>
                  {formatCurrency(booking.quotedPrice)} · {formatLabel(booking.status)}
                </p>
              </div>
              <div className="actions">
                <Link href={`/admin/service-execution?bookingId=${booking.id}`}>Open board</Link>
                <Link href={`/bookings/progress?bookingId=${booking.id}`}>Customer progress</Link>
              </div>
            </article>
          ))}
        </section>
      </AppShell>
    );
  }

  const board = await api.getServiceExecution(searchParams.bookingId);
  const assignedTasks = searchParams.mechanicId ? await api.listMechanicTasks(searchParams.mechanicId) : [];
  const unassignedTasks = board.tasks.filter((task) => !task.assignedMechanicId);

  return (
    <AppShell
      role="ADMIN"
      currentPath="/admin/service-execution"
      eyebrow="Mechanic workflow"
      title="Service execution board"
      description={`Booking ${board.bookingId} · ${formatLabel(board.bookingStatus)} · ${formatLabel(board.serviceOrderStatus)}`}
      actions={
        <div className="actions">
          <Link href="/admin/bookings">Back to bookings</Link>
          <Link href={`/bookings/progress?bookingId=${board.bookingId}`}>Customer progress</Link>
        </div>
      }
    >
      <section className="surface">
        <div className="metric-grid">
          <article className="metric-card">
            <strong>{board.tasks.length}</strong>
            <span>Total service tasks</span>
          </article>
          <article className="metric-card">
            <strong>{unassignedTasks.length}</strong>
            <span>Tasks missing mechanic assignment</span>
          </article>
          <article className="metric-card">
            <strong>{board.tasks.filter((task) => task.status === 'IN_PROGRESS').length}</strong>
            <span>Tasks currently active</span>
          </article>
        </div>
      </section>

      {assignedTasks.length ? (
        <section className="timeline-card" style={{ marginTop: 32 }}>
          <h2>Assigned mechanic queue</h2>
          <ul className="parts-list">
            {assignedTasks.map((task) => (
              <li key={task.id}>
                <strong>{task.name}</strong>
                <span>
                  {task.bookingId} · {formatLabel(task.status)} · {task.assignedMechanicName ?? 'Unassigned'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {unassignedTasks.length ? (
        <section className="timeline-card" style={{ marginTop: 18 }}>
          <h2>Assignment needed</h2>
          <ul className="summary-list">
            {unassignedTasks.map((task) => (
              <li key={task.id}>
                <strong>{task.name}</strong>
                <p>{task.description ?? 'Assign a mechanic before work starts.'}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="kanban-grid">
        {boardStatuses.map((status) => (
          <div key={status} className="kanban-column">
            <div className="kanban-column-header">
              <h2>{formatLabel(status)}</h2>
              <span>{board.tasks.filter((task) => task.status === status).length}</span>
            </div>
            <div className="kanban-stack">
              {board.tasks
                .filter((task) => task.status === status)
                .map((task) => renderTaskCard(task, board.bookingId))}
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
