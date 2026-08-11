import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireOwner } from '@/lib/adminAuth';

async function replyToReview(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  const reply = String(formData.get('reply') || '').trim();
  await supabaseAdmin().from('reviews').update({ admin_reply: reply || null }).eq('id', id);
  redirect('/admin/reviews');
}

async function deleteReview(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  await supabaseAdmin().from('reviews').delete().eq('id', id);
  redirect('/admin/reviews');
}

export default async function ReviewsPage() {
  await requireOwner();
  const admin = supabaseAdmin();
  const { data: reviews } = await admin
    .from('reviews')
    .select('id, rating, body, admin_reply, created_at, product:products(name), profile:profiles(name, email)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="admin-page-head"><h1>Reviews</h1></div>
      <p className="muted" style={{ marginBottom: 20 }}>
        Customer-facing review submission isn't built into the storefront yet — this page manages whatever comes in once that's added.
      </p>

      {(reviews ?? []).map((r: any) => (
        <div key={r.id} className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <strong>{r.product?.name}</strong>
              <span className="muted" style={{ marginLeft: 10 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            <span className="muted">{r.profile?.name} · {new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <p style={{ marginBottom: 14 }}>{r.body}</p>
          <form action={replyToReview} style={{ marginBottom: 8 }}>
            <input type="hidden" name="id" value={r.id} />
            <label style={{ marginTop: 0 }}>Admin reply</label>
            <textarea name="reply" rows={2} defaultValue={r.admin_reply || ''} placeholder="Reply to this review…"></textarea>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="submit" style={{ width: 'auto', margin: 0 }}>Save Reply</button>
            </div>
          </form>
          <form action={deleteReview}>
            <input type="hidden" name="id" value={r.id} />
            <button type="submit" className="link-btn danger">Delete review</button>
          </form>
        </div>
      ))}
      {(!reviews || reviews.length === 0) && <p className="muted">No reviews yet.</p>}
    </div>
  );
}
