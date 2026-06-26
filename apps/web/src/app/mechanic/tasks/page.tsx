import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@mototrust/ui';
import { api, ServiceTask, ServiceTaskStatus } from '../../../lib/api';
import { AppShell } from '../../../components/app-shell';
import { NotificationBell } from '../../../components/notification-bell';
import { ProofMediaGallery } from '../../../components/proof-media-gallery';
import { ProofMediaUploader } from '../../../components/proof-media-uploader';
import { requireSessionUser } from '../../../lib/session';

const taskStatuses: ServiceTaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function groupTasks(tasks: ServiceTask[], status: ServiceTaskStatus) {
  return tasks.filter((task) => task.status === status);
}

async function updateTask(formData: FormData) {
  'use server';

  const taskId = String(formData.get('taskId') ?? '');
  await api.updateServiceTask(taskId, {
    status: String(formData.get('status') ?? '') || undefined,
    notes: String(formData.get('notes') ?? '') || undefined
  });

  redirect('/mechanic/tasks');
}

async function addPart(formData: FormData) {
  'use server';

  const taskId = String(formData.get('taskId') ?? '');
  const redirectBookingId = String(formData.get('bookingId') ?? '');

  await api.addServiceTaskPart(taskId, {
    sku: String(formData.get('sku') ?? ''),
    name: String(formData.get('name') ?? ''),
    manufacturer: String(formData.get('manufacturer') ?? ''),
    quantity: Number(formData.get('quantity') ?? 1),
    unitPrice: Number(formData.get('unitPrice') ?? 0),
    batchCode: String(formData.get('batchCode') ?? '') || undefined
  });

  redirect(`/mechanic/tasks?taskId=${taskId}&bookingId=${redirectBookingId}`);
}

type MechanicTasksPageProps = {
  searchParams: {
    taskId?: string;
  };
};

export default async function MechanicTasksPage({ searchParams }: MechanicTasksPageProps) {
  const user = await requireSessionUser(['MECHANIC']);
  const tasks = await api.listMechanicTasks(user.id);
  const selectedTask =
    tasks.find((task) => task.id === searchParams.taskId) ??
    tasks.find((task) => task.status === 'IN_PROGRESS') ??
    tasks[0] ??
    null;

  return (
    <AppShell
      role="MECHANIC"
      currentPath="/mechanic/tasks"
      eyebrow="Mechanic workspace"
      title="Assigned service tasks"
      description="Track assigned work, update task progress, and keep notes current as the booking moves through service."
      headerExtras={<NotificationBell />}
      actions={<Link href="/">Home</Link>}
    >
      <section className="surface">
        <div className="metric-grid">
          <article className="metric-card">
            <strong>{groupTasks(tasks, 'IN_PROGRESS').length}</strong>
            <span>Active tasks</span>
          </article>
          <article className="metric-card">
            <strong>{groupTasks(tasks, 'PENDING').length}</strong>
            <span>Ready to start</span>
          </article>
          <article className="metric-card">
            <strong>{groupTasks(tasks, 'COMPLETED').length}</strong>
            <span>Completed today</span>
          </article>
        </div>
      </section>

      {selectedTask ? (
        <section className="focus-layout">
          <article className="timeline-card">
            <div className="card-heading">
              <div>
                <p className="mono">{selectedTask.bookingId}</p>
                <h2>{selectedTask.name}</h2>
                <p>{selectedTask.description ?? 'Standard service workflow task.'}</p>
              </div>
              <span className={`badge badge-${selectedTask.status.toLowerCase()}`}>
                {formatLabel(selectedTask.status)}
              </span>
            </div>

            <dl className="task-meta">
              <div>
                <dt>Assigned mechanic</dt>
                <dd>{selectedTask.assignedMechanicName ?? 'Current user'}</dd>
              </div>
              <div>
                <dt>Parts used</dt>
                <dd>{selectedTask.partsUsed.length}</dd>
              </div>
              <div>
                <dt>Booking</dt>
                <dd>{selectedTask.bookingStatus}</dd>
              </div>
            </dl>

            <form action={updateTask} className="status-form compact-form">
              <input type="hidden" name="taskId" value={selectedTask.id} />
              <label>
                Task status
                <select name="status" defaultValue={selectedTask.status}>
                  {taskStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea name="notes" defaultValue={selectedTask.notes ?? ''} rows={4} />
              </label>
              <button type="submit">Save task update</button>
            </form>

            <div className="parts-section">
              <h4>Parts usage</h4>
              {selectedTask.partsUsed.length ? (
                <ul className="parts-list">
                  {selectedTask.partsUsed.map((part) => (
                    <li key={part.id}>
                      <strong>{part.name}</strong>
                      <span>
                        {part.quantity} x {formatCurrency(part.unitPrice)} · {part.manufacturer}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No parts logged yet.</p>
              )}

              <form action={addPart} className="status-form compact-form">
                <input type="hidden" name="taskId" value={selectedTask.id} />
                <input type="hidden" name="bookingId" value={selectedTask.bookingId} />
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

            <div className="parts-section">
              <h4>Service proof</h4>
              <ProofMediaGallery
                items={selectedTask.proofMedia}
                emptyMessage="No service proof uploaded yet."
              />
              <div className="section-stack" style={{ marginTop: 12 }}>
                <ProofMediaUploader
                  endpoint={`/media/service-tasks/${selectedTask.id}`}
                  storageFolder={`service-tasks/${selectedTask.id}/mechanic`}
                  buttonText="Upload task photos"
                  labelOptions={['Before Service', 'In Progress', 'After Service']}
                  defaultLabel="In Progress"
                  visibility="CUSTOMER_VISIBLE"
                />
              </div>
            </div>
          </article>

          <aside className="focus-sidebar">
            <section className="timeline-card">
              <h2>Focus task</h2>
              <ul className="mini-list">
                <li>
                  <strong>Current task</strong>
                  <p>{selectedTask.name}</p>
                </li>
                <li>
                  <strong>Booking reference</strong>
                  <p>{selectedTask.bookingId}</p>
                </li>
                <li>
                  <strong>Customer view</strong>
                  <p>
                    <Link
                      href={`/bookings/progress?bookingId=${selectedTask.bookingId}`}
                      className="inline-link"
                    >
                      Open progress page
                    </Link>
                  </p>
                </li>
              </ul>
            </section>
          </aside>
        </section>
      ) : (
        <section className="timeline-card" style={{ marginTop: 24 }}>
          <h2>No assigned tasks</h2>
          <p className="muted">This account does not currently have any service tasks assigned.</p>
        </section>
      )}

      <section className="kanban-grid">
        {taskStatuses.map((status) => (
          <div key={status} className="kanban-column">
            <div className="kanban-column-header">
              <h2>{formatLabel(status)}</h2>
              <span>{groupTasks(tasks, status).length}</span>
            </div>
            <div className="kanban-stack">
              {groupTasks(tasks, status).map((task) => (
                <article key={task.id} className="kanban-card customer-card">
                  <div className="card-heading">
                    <div>
                      <h3>{task.name}</h3>
                      <p>{task.bookingId}</p>
                    </div>
                    <span className={`badge badge-${task.status.toLowerCase()}`}>
                      {formatLabel(task.status)}
                    </span>
                  </div>
                  {task.notes ? <p className="task-notes">{task.notes}</p> : null}
                  <div className="actions">
                    <Link href={`/mechanic/tasks?taskId=${task.id}`}>Open task</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
