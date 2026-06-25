import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '../../../lib/api';

type AdminInspectionsPageProps = {
  searchParams: {
    bookingId?: string;
  };
};

async function createInspectionReport(formData: FormData) {
  'use server';

  const bookingId = String(formData.get('bookingId') ?? '');
  const issues = [0, 1, 2]
    .map((index) => {
      const title = String(formData.get(`issueTitle${index}`) ?? '').trim();
      if (!title) {
        return null;
      }

      const imageUrls = String(formData.get(`issueImages${index}`) ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      return {
        title,
        description: String(formData.get(`issueDescription${index}`) ?? '') || undefined,
        severity: String(formData.get(`issueSeverity${index}`) ?? 'RECOMMENDED'),
        estimatedPartsCost: Number(formData.get(`issuePartsCost${index}`) ?? 0),
        estimatedLaborCost: Number(formData.get(`issueLaborCost${index}`) ?? 0),
        imageUrls
      };
    })
    .filter(Boolean);

  await api.createInspectionReport(bookingId, {
    summary: String(formData.get('summary') ?? '') || undefined,
    createdByType: 'MECHANIC',
    createdByName: String(formData.get('createdByName') ?? 'Workshop Mechanic'),
    issues
  });

  redirect(`/bookings/progress?bookingId=${bookingId}`);
}

export default async function AdminInspectionsPage({ searchParams }: AdminInspectionsPageProps) {
  if (!searchParams.bookingId) {
    redirect('/admin/bookings');
  }

  let existingReport = null;
  try {
    existingReport = await api.getInspectionReport(searchParams.bookingId);
  } catch {
    existingReport = null;
  }

  return (
    <main className="page">
      <section className="ops-header">
        <div>
          <p className="eyebrow">Inspection</p>
          <h1>Mechanic inspection report</h1>
          <p className="lede">Create actionable issues with severity, cost estimate, and mock image references.</p>
        </div>
        <Link href="/admin/bookings">Back to bookings</Link>
      </section>

      {existingReport ? (
        <section className="timeline-card" style={{ marginTop: 32 }}>
          <h2>Existing inspection report</h2>
          <p>{existingReport.summary ?? 'No summary provided.'}</p>
          <ul className="issue-list">
            {existingReport.issues.map((issue) => (
              <li key={issue.id}>
                <strong>{issue.title}</strong>
                <p>
                  {issue.severity} · Parts {issue.estimatedPartsCost} · Labor {issue.estimatedLaborCost}
                </p>
              </li>
            ))}
          </ul>
          <Link href={`/bookings/approval?bookingId=${existingReport.bookingId}`}>View customer approval</Link>
        </section>
      ) : (
        <form action={createInspectionReport} className="flow-form" style={{ marginTop: 32 }}>
          <input type="hidden" name="bookingId" value={searchParams.bookingId} />

          <label>
            Inspector name
            <input name="createdByName" defaultValue="Workshop Mechanic" required minLength={2} maxLength={120} />
          </label>

          <label>
            Summary
            <textarea
              name="summary"
              rows={3}
              placeholder="Primary inspection findings and recommendations."
              maxLength={1000}
            />
          </label>

          {[0, 1, 2].map((index) => (
            <fieldset key={index}>
              <legend>Issue {index + 1}</legend>
              <input name={`issueTitle${index}`} placeholder="Issue title" maxLength={120} />
              <textarea
                name={`issueDescription${index}`}
                rows={3}
                placeholder="Issue description"
                maxLength={1000}
              />
              <div className="form-grid">
                <label>
                  Severity
                  <select name={`issueSeverity${index}`} defaultValue="RECOMMENDED">
                    <option value="CRITICAL">Critical</option>
                    <option value="RECOMMENDED">Recommended</option>
                    <option value="OPTIONAL">Optional</option>
                  </select>
                </label>
                <label>
                  Parts cost
                  <input name={`issuePartsCost${index}`} type="number" min={0} step="0.01" defaultValue="0" />
                </label>
                <label>
                  Labor cost
                  <input name={`issueLaborCost${index}`} type="number" min={0} step="0.01" defaultValue="0" />
                </label>
              </div>
              <input
                name={`issueImages${index}`}
                placeholder="Comma-separated mock image URLs"
                maxLength={600}
              />
            </fieldset>
          ))}

          <button type="submit">Create inspection report</button>
        </form>
      )}
    </main>
  );
}

