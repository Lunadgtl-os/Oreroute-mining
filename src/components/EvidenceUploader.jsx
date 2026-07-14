import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function EvidenceUploader() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function upload(event) {
    event.preventDefault();
    if (!file) return;
    setSaving(true);
    setMessage('');
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: membership, error: membershipError } = await supabase.from('organisation_members').select('organisation_id').limit(1).single();
      if (membershipError) throw membershipError;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${membership.organisation_id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('evidence').upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { error: recordError } = await supabase.from('documents').insert({
        title: file.name, doc_type: file.type || 'supporting_evidence', storage_path: path,
        uploaded_by_org_id: membership.organisation_id, uploaded_by: userData.user.id,
      });
      if (recordError) { await supabase.storage.from('evidence').remove([path]); throw recordError; }
      setMessage('Evidence uploaded securely.');
      setFile(null);
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  }

  return <form className="evidence-upload" onSubmit={upload}><input aria-label="Evidence file" type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} /><button className="button button-primary" disabled={saving}>{saving ? 'Uploading…' : 'Upload evidence'}</button>{message && <span>{message}</span>}</form>;
}
