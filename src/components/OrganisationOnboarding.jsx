import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

const types = ['miner', 'carrier', 'wash_plant', 'trader', 'buyer', 'exporter', 'regulator'];

export default function OrganisationOnboarding({ onComplete }) {
  const [form, setForm] = useState({ name: '', orgType: 'miner', country: 'South Africa' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const { error } = await supabase.rpc('onboard_organisation', {
      organisation_name: form.name,
      organisation_kind: form.orgType,
      organisation_country: form.country,
    });
    setSaving(false);
    if (error) return setMessage(error.message);
    onComplete();
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual"><div className="auth-visual-copy"><p className="eyebrow">CONTROLLED ONBOARDING</p><h1>Create your operating organisation.</h1><p>Your account becomes the verified owner. Additional members must be invited later by an authorised administrator.</p></div></section>
      <section className="auth-panel"><div className="auth-card"><p className="eyebrow">ORGANISATION PROFILE</p><h2>Set up Ore Route</h2><form onSubmit={submit}>
        <label>Organisation name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Organisation type<select value={form.orgType} onChange={(e) => setForm({ ...form, orgType: e.target.value })}>{types.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}</select></label>
        <label>Country<input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
        <button className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create organisation'}</button>
      </form>{message && <p className="auth-message">{message}</p>}</div></section>
    </main>
  );
}
