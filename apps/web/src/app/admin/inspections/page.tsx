import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '../../../lib/api';
import { AppShell } from '../../../components/app-shell';
import { ProofMediaGallery } from '../../../components/proof-media-gallery';
import { ProofMediaUploader } from '../../../components/proof-media-uploader';
import { requireSessionUser } from '../../../lib/session';

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
    issues
  });

  redirect(`/bookings/progress?bookingId=${bookingId}`);
}

export default async function AdminInspectionsPage({ searchParams }: AdminInspectionsPageProps) {
  await requireSessionUser(['ADMIN']);
  if (!searchParams.bookingId) {
    const bookings = await api.listAdminBookings();
    const inspectionQueue = bookings.filter((booking) =>
      ['RECEIVED_AT_SERVICE_CENTER', 'INSPECTION_COMPLETED', 'AWAITING_CUSTOMER_APPROVAL'].includes(
        booking.status
      )
    );

    return (
      <AppShell
        role="ADMIN"
        currentPath="/admin/inspections"
        eyebrow="Inspection"
        title="Inspection monitoring"
        description="See which bookings still need intake findings, which ones are awaiting customer action, and where to open the inspection report."
        actions={<Link href="/admin/bookings">Back to bookings</Link>}
      >
        <section className="surface">
          <div className="metric-grid">
            <article className="metric-card">
              <strong>{inspectionQueue.length}</strong>
              <span>Bookings in inspection flow</span>
            </article>
            <article className="metric-card">
              <strong>
                {inspectionQueue.filter((booking) => booking.status === 'AWAITING_CUSTOMER_APPROVAL').length}
              </strong>
              <span>Waiting for customer decision</span>
            </article>
          </div>
        </section>

        <section className="ops-list">
          {inspectionQueue.map((booking) => (
            <article key={booking.id} className="booking-row">
              <div className="booking-summary">
                <p className="mono">{booking.id}</p>
                <h2>{booking.servicePackageName}</h2>
                <p>{booking.status.replaceAll('_', ' ')}</p>
              </div>
              <div className="actions">
                <Link href={`/admin/inspections?bookingId=${booking.id}`}>Open inspection</Link>
                <Link href={`/bookings/approval?bookingId=${booking.id}`}>Customer approval</Link>
                <Link href={`/bookings/progress?bookingId=${booking.id}`}>Timeline</Link>
              </div>
            </article>
          ))}
        </section>
      </AppShell>
    );
  }

  let existingReport = null;
  try {
    existingReport = await api.getInspectionReport(searchParams.bookingId);
  } catch {
    existingReport = null;
  }

  return (
    <AppShell
      role="ADMIN"
      currentPath="/admin/inspections"
      eyebrow="Inspection"
      title="Mechanic inspection report"
      description="Capture the issues discovered during intake so the customer can make clear approval decisions."
      actions={<Link href="/admin/bookings">Back to bookings</Link>}
    >
      {existingReport ? (
        <section className="timeline-card" style={{ marginTop: 32 }}>
          <h2>Existing inspection report</h2>
          <p>{existingReport.summary ?? 'No summary provided.'}</p>
          <ul className="issue-list">
            {existingReport.issues.map((issue) => (
              <li key={issue.id} className="timeline-card" style={{ marginTop: 16 }}>
                <strong>{issue.title}</strong>
                <p>
                  {issue.severity} · Parts {issue.estimatedPartsCost} · Labor {issue.estimatedLaborCost}
                </p>
                {issue.description ? <p>{issue.description}</p> : null}

                <div className="section-stack" style={{ marginTop: 14 }}>
                  <ProofMediaGallery
                    items={issue.proofMedia}
                    emptyMessage="No inspection photos uploaded yet."
                  />
                  <ProofMediaUploader
                    endpoint={`/media/inspection-issues/${issue.id}`}
                    storageFolder={`inspection-issues/${issue.id}`}
                    buttonText="Upload inspection photos"
                    defaultLabel="Inspection"
                    visibility="CUSTOMER_VISIBLE"
                  />
                </div>
              </li>
            ))}
          </ul>
          <Link href={`/bookings/approval?bookingId=${existingReport.bookingId}`}>
            View customer approval
          </Link>
        </section>
      ) : (
        <form action={createInspectionReport} className="flow-form" style={{ marginTop: 32 }}>
          <input type="hidden" name="bookingId" value={searchParams.bookingId} />

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
    </AppShell>
  );
}
