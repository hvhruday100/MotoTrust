import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '../../../lib/api';
import { AppShell } from '../../../components/app-shell';
import { ProofMediaGallery } from '../../../components/proof-media-gallery';
import { requireSessionUser } from '../../../lib/session';

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
    note: String(formData.get('note') ?? '') || undefined
  });

  redirect(`/bookings/approval?bookingId=${bookingId}`);
}

export default async function BookingApprovalPage({ searchParams }: BookingApprovalPageProps) {
  const user = await requireSessionUser();
  if (!searchParams.bookingId) {
    redirect('/');
  }

  const report = await api.getInspectionReport(searchParams.bookingId);

  return (
    <AppShell
      role={user.role}
      currentPath="/bookings"
      eyebrow="Customer approval"
      title="Inspection decisions"
      description={report.summary ?? 'Review each issue and approve or reject it individually.'}
      actions={<Link href={`/bookings/progress?bookingId=${report.bookingId}`}>Back to progress</Link>}
    >
      <section className="timeline-card" style={{ marginTop: 24 }}>
        <h2>Approval summary</h2>
        <div className="metric-grid">
          <article className="metric-card">
            <strong>{report.approvalSummary.pendingIssues}</strong>
            <span>Pending decisions</span>
          </article>
          <article className="metric-card">
            <strong>
              {report.approvalSummary.criticalApproved}/{report.approvalSummary.criticalIssues}
            </strong>
            <span>Critical items approved</span>
          </article>
          <article className="metric-card">
            <strong>{report.approvalSummary.canStartService ? 'Ready' : 'Blocked'}</strong>
            <span>
              {report.approvalSummary.canStartService
                ? 'Service can begin.'
                : 'Critical items still need approval.'}
            </span>
          </article>
        </div>
      </section>

      <section className="issue-list">
        {report.issues.map((issue) => (
          <article key={issue.id} className="timeline-card">
            <div className="card-heading">
              <div>
                <h2>{issue.title}</h2>
                <p>
                  Parts {issue.estimatedPartsCost} · Labor {issue.estimatedLaborCost}
                </p>
              </div>
              <span className={`pill pill-${issue.severity.toLowerCase()}`}>{issue.severity}</span>
            </div>
            {issue.description ? <p>{issue.description}</p> : null}
            {issue.imageUrls.length ? <p>Images: {issue.imageUrls.join(', ')}</p> : null}
            <ProofMediaGallery
              items={issue.proofMedia}
              emptyMessage="Inspection images will appear here once uploaded."
            />
            <p>Status: {issue.approvalStatus}</p>

            {issue.approvalStatus === 'PENDING' ? (
              <form action={decideIssue} className="flow-form">
                <input type="hidden" name="issueId" value={issue.id} />
                <input type="hidden" name="bookingId" value={report.bookingId} />
                <label>
                  Note
                  <input name="note" placeholder="Optional note for this issue" maxLength={1000} />
                </label>
                <div className="approval-actions">
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
                Decision by {issue.customerDecisionByName ?? 'Customer'}{' '}
                {issue.customerDecisionNote ? `- ${issue.customerDecisionNote}` : ''}
              </p>
            )}
          </article>
        ))}
      </section>
    </AppShell>
  );
}
