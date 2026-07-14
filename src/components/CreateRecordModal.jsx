import { useMemo, useState } from 'react';
import { oreRouteApi } from '../lib/oreRouteApi.js';
import { supabase } from '../lib/supabase.js';

const configs = {
  passports: { title: 'Create material passport', fields: [['lot_id','Lot ID'],['mineral_type','Mineral type'],['origin_mine','Origin mine'],['weight_kg','Weight (kg)','number'],['grade','Grade']], api: 'passports' },
  shipments: { title: 'Create shipment', fields: [['shipment_ref','Shipment reference'],['origin','Origin'],['destination','Destination'],['vehicle_registration','Vehicle registration']], api: 'shipments' },
  custody: { title: 'Add custody event', fields: [['passport_id','Passport UUID'],['event_type','Event type'],['location','Location'],['notes','Notes']], api: 'custodyEvents' },
  tenders: { title: 'Post transport tender', fields: [['title','Tender title'],['origin_location','Origin'],['destination_location','Destination'],['weight_kg','Weight (kg)','number'],['mineral_type','Mineral type']], api: 'tenders' },
  washplant: { title: 'Create wash-plant batch', fields: [['batch_ref','Batch reference'],['mineral_type','Mineral type'],['input_weight_kg','Input weight (kg)','number']], api: 'washPlantBatches' },
  trades: { title: 'Create trade dossier', fields: [['trade_ref','Trade reference'],['buyer_org_id','Buyer organisation UUID'],['mineral_type','Mineral type'],['weight_kg','Weight (kg)','number'],['agreed_price','Agreed price','number'],['currency','Currency']], api: 'tradeDossiers' },
};

export default function CreateRecordModal({ page, onClose }) {
  const config = configs[page];
  const initial = useMemo(() => Object.fromEntries((config?.fields || []).map(([key]) => [key, key === 'currency' ? 'USD' : ''])), [config]);
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  if (!config) return null;

  async function submit(event) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      const [{ data: userData }, { data: membership, error: memberError }] = await Promise.all([
        supabase.auth.getUser(), supabase.from('organisation_members').select('organisation_id').limit(1).single(),
      ]);
      if (memberError) throw memberError;
      const numeric = Object.fromEntries(Object.entries(form).map(([key,value]) => [key, ['weight_kg','input_weight_kg','agreed_price'].includes(key) ? Number(value) : value]));
      const org = membership.organisation_id; const user = userData.user.id;
      const additions = {
        passports: { source_org_id: org, current_holder_org_id: org, created_by: user },
        shipments: { carrier_org_id: org }, custody: { recorded_by: user },
        tenders: { posted_by_org_id: org }, washplant: { plant_org_id: org },
        trades: { seller_org_id: org },
      }[page];
      await oreRouteApi[config.api].create({ ...numeric, ...additions });
      onClose(true);
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}><section className="record-modal" role="dialog" aria-modal="true" aria-label={config.title}><div className="section-heading"><h2>{config.title}</h2><button className="icon-button" onClick={() => onClose(false)}>×</button></div><form onSubmit={submit}>{config.fields.map(([key,label,type='text']) => <label key={key}>{label}<input required type={type} min={type === 'number' ? '0' : undefined} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}{message && <p className="auth-message">{message}</p>}<button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save record'}</button></form></section></div>;
}
