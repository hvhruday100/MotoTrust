import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '../../../lib/api';
import { requireSessionUser } from '../../../lib/session';

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
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

export default async function MechanicTasksPage() {
  const user = await requireSessionUser(['MECHANIC']);
  const tasks = await api.listMechanicTasks(user.id);

  return (
    <main className="page">
      <section className="ops-header">
        <div>
          <p className="eyebrow">Mechanic workspace</p>
          <h1>Assigned service tasks</h1>
          <p className="lede">Track your assigned work and update task progress with authenticated Firebase identity.</p>
        </div>
        <Link href="/">Home</Link>
      </section>

      <section className="ops-list" style={{ marginTop: 32 }}>
        {tasks.map((task) => (
          <article key={task.id} className="booking-row">
            <div className="booking-summary">
              <p className="mono">{task.bookingId}</p>
              <h2>{task.name}</h2>
              <p>{formatLabel(task.status)}</p>
              <div className="actions">
                <Link href={`/bookings/progress?bookingId=${task.bookingId}`}>View booking</Link>
              </div>
            </div>

            <form action={updateTask} className="status-form">
              <input type="hidden" name="taskId" value={task.id} />
              <label>
                Task status
                <select name="status" defaultValue={task.status}>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea name="notes" defaultValue={task.notes ?? ''} rows={4} />
              </label>
              <button type="submit">Save update</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
