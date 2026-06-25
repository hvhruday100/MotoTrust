import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '../../../lib/api';

type BookingApprovalPageProps = {
  searchParams: {
    bookingId?: string;
  };
};

async function decideIssue(formData: FormData) {
  'use server';

  const issueId = String(formData.get('issueId') ?? '');
  const bookingId = String(formData.get('bookingId') ?? '');
  const decision = String(formData.get('decision') ?? '');

  await api.approveInspectionIssue(issueId, {
    approvalStatus: decision,
    actorName: String(formData.get('actorName') ?? 'Customer'),
    note: String(formData.get('note') ?? '') || undefined
  });

  redirect(`/bookings/approval?bookingId=${bookingId}`);
}

export default async function BookingApprovalPage({ searchParams }: BookingApprovalPageProps) {
  if (!searchParams.bookingId) {
    redirect('/');
  }

  const report = await api.getInspectionReport(searchParams.bookingId);

  return (
    <main className="page">
      <section className="ops-header">
        <div>
          <p className="eyebrow">Customer approval</p>
          <h1>Inspection decisions</h1>
          <p className="lede">{report.summary ?? 'Review each issue and approve or reject it individually.'}</p>
        </div>
        <Link href={`/bookings/progress?bookingId=${report.bookingId}`}>Back to progress</Link>
      </section>

      <section className="timeline-card" style={{ marginTop: 24 }}>
        <h2>Approval summary</h2>
        <p>
          Pending: {report.approvalSummary.pendingIssues} · Critical approved: {report.approvalSummary.criticalApproved}/
          {report.approvalSummary.criticalIssues}
        </p>
        <p>{report.approvalSummary.canStartService ? 'Ready for service start.' : 'Service start is still blocked.'}</p>
      </section>

      <section className="issue-list">
        {report.issues.map((issue) => (
          <article key={issue.id} className="timeline-card">
            <h2>{issue.title}</h2>
            <p>
              {issue.severity} · Parts {issue.estimatedPartsCost} · Labor {issue.estimatedLaborCost}
            </p>
            {issue.description ? <p>{issue.description}</p> : null}
            {issue.imageUrls.length ? <p>Images: {issue.imageUrls.join(', ')}</p> : null}
            <p>Status: {issue.approvalStatus}</p>

            {issue.approvalStatus === 'PENDING' ? (
              <form action={decideIssue} className="flow-form">
                <input type="hidden" name="issueId" value={issue.id} />
                <input type="hidden" name="bookingId" value={report.bookingId} />
                <input type="hidden" name="actorName" value="Customer" />
                <label>
                  Note
                  <input name="note" placeholder="Optional note for this issue" maxLength={1000} />
                </label>
                <div className="actions">
                  <button type="submit" name="decision" value="APPROVED">
                    Approve
                  </button>
                  <button type="submit" name="decision" value="REJECTED">
                    Reject
                  </button>
                </div>
              </form>
            ) : (
              <p>
                Decision by {issue.customerDecisionByName ?? 'Customer'} {issue.customerDecisionNote ? `- ${issue.customerDecisionNote}` : ''}
              </p>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

