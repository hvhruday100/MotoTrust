import type { ProofMedia } from '../lib/api';

type ProofMediaGalleryProps = {
  items: ProofMedia[];
  emptyMessage?: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function ProofMediaGallery({
  items,
  emptyMessage = 'No proof media uploaded yet.'
}: ProofMediaGalleryProps) {
  if (!items.length) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <div className="proof-media-grid">
      {items.map((item) => (
        <article key={item.id} className="proof-media-card">
          <a href={item.storageUrl} target="_blank" rel="noreferrer">
            <img src={item.storageUrl} alt={item.caption ?? item.label ?? item.fileName ?? 'Service proof'} />
          </a>
          <div className="proof-media-copy">
            <strong>{item.label ?? 'Service proof'}</strong>
            {item.caption ? <p>{item.caption}</p> : null}
            <span>
              {item.uploadedByName ?? 'MotoTrust staff'}
              {formatDate(item.capturedAt ?? item.createdAt)
                ? ` · ${formatDate(item.capturedAt ?? item.createdAt)}`
                : ''}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
