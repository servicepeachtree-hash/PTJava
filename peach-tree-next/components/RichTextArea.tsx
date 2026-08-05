'use client';
import { useRef } from 'react';

export default function RichTextArea({
  value, onChange, rows = 5,
}: { value: string; onChange: (v: string) => void; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrap(marker: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  }

  function insertLink() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end) || 'link text';
    const url = window.prompt('Link URL', 'https://');
    if (!url) return;
    const md = `[${selected}](${url})`;
    onChange(value.slice(0, start) + md + value.slice(end));
  }

  return (
    <div>
      <div className="rte-toolbar">
        <button type="button" onClick={() => wrap('**')} title="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => wrap('*')} title="Italic"><em>I</em></button>
        <button type="button" onClick={insertLink} title="Link">🔗</button>
      </div>
      <textarea ref={ref} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>
        Select text and click a button — supports **bold**, *italic*, and [link](url).
      </p>
    </div>
  );
}
