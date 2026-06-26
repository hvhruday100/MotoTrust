'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage } from '../lib/firebase';

type ProofMediaUploaderProps = {
  endpoint: string;
  storageFolder: string;
  buttonText: string;
  defaultLabel?: string;
  labelOptions?: string[];
  visibility?: 'INTERNAL' | 'CUSTOMER_VISIBLE';
  captionPlaceholder?: string;
};

export function ProofMediaUploader({
  endpoint,
  storageFolder,
  buttonText,
  defaultLabel,
  labelOptions,
  visibility = 'CUSTOMER_VISIBLE',
  captionPlaceholder = 'Optional note for the customer'
}: ProofMediaUploaderProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [label, setLabel] = useState(defaultLabel ?? '');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const resolvedLabelOptions = useMemo(() => labelOptions?.filter(Boolean) ?? [], [labelOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!files?.length) {
      setMessage('Choose at least one image.');
      return;
    }

    setIsUploading(true);
    setMessage('Uploading proof media...');

    try {
      const storage = getFirebaseStorage();

      for (const file of Array.from(files)) {
        const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
        const storageKey = `${storageFolder}/${Date.now()}-${crypto.randomUUID()}${extension}`;
        const storageRef = ref(storage, storageKey);

        await uploadBytes(storageRef, file, {
          contentType: file.type || 'application/octet-stream'
        });

        const storageUrl = await getDownloadURL(storageRef);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'PHOTO',
            visibility,
            storageKey,
            storageUrl,
            fileName: file.name,
            mimeType: file.type || undefined,
            label: label || defaultLabel || undefined,
            caption: caption || undefined,
            capturedAt: new Date().toISOString()
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Unable to save proof media.');
        }
      }

      setFiles(null);
      setCaption('');
      setMessage('Proof media uploaded.');
      router.refresh();
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Upload failed.';
      setMessage(nextMessage);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="proof-upload-form">
      <div className="proof-upload-grid">
        {resolvedLabelOptions.length ? (
          <label>
            Label
            <select value={label} onChange={(event) => setLabel(event.target.value)}>
              {resolvedLabelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Label
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={defaultLabel ?? 'Proof label'}
            />
          </label>
        )}

        <label style={{ gridColumn: '1 / -1' }}>
          Caption
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder={captionPlaceholder}
          />
        </label>

        <label style={{ gridColumn: '1 / -1' }}>
          Images
          <input type="file" accept="image/*" multiple onChange={(event) => setFiles(event.target.files)} />
        </label>
      </div>

      <div className="proof-upload-footer">
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : buttonText}
        </button>
        {message ? <p className="muted">{message}</p> : null}
      </div>
    </form>
  );
}
