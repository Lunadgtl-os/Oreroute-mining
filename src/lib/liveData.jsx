import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as demo from '../data.js';
import { isSupabaseConfigured, supabase } from './supabase.js';

const LiveDataContext = createContext({ ...demo, live: false, loading: false, error: '' });
const kg = (value) => `${Number(value || 0).toLocaleString()} kg`;
const label = (value) => String(value || '').replaceAll('_', ' ');

export function LiveDataProvider({ children }) {
  const [state, setState] = useState({ live: false, loading: isSupabaseConfigured, error: '' });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from('material_passports').select('*').order('created_at', { ascending: false }),
      supabase.from('shipments').select('*').order('created_at', { ascending: false }),
      supabase.from('custody_events').select('*').order('occurred_at', { ascending: false }),
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('transport_tenders').select('*, tender_bids(count)').order('created_at', { ascending: false }),
      supabase.from('wash_plant_batches').select('*').order('created_at', { ascending: false }),
      supabase.from('trade_dossiers').select('*').order('created_at', { ascending: false }),
    ]).then((results) => {
      const failure = results.find((result) => result.error)?.error;
      if (failure) throw failure;
      const [passportResult, shipmentResult, eventResult, documentResult, tenderResult, batchResult, tradeResult] = results;
      setState({
        live: true, loading: false, error: '',
        passports: passportResult.data.map((row) => ({ id: row.id, lot: row.lot_id, mineral: row.mineral_type, origin: [row.origin_mine, row.origin_region].filter(Boolean).join(', '), weight: kg(row.weight_kg), grade: row.grade || 'Pending', holder: row.current_holder_org_id ? 'Network participant' : 'Source organisation', status: label(row.status), confidence: Number(row.evidence_confidence || 0) })),
        shipments: shipmentResult.data.map((row) => ({ id: row.shipment_ref, lot: row.passport_id || 'Unlinked', mineral: 'Linked material', route: `${row.origin} → ${row.destination}`, carrier: row.carrier_org_id ? 'Approved carrier' : 'Unassigned', vehicle: row.vehicle_registration || 'Pending', weight: kg(row.weight_at_origin), status: label(row.status), progress: row.status === 'completed' ? 100 : row.status === 'pending' ? 0 : 50, eta: row.eta ? new Date(row.eta).toLocaleString() : 'Pending', risk: row.status === 'exception' ? 'High' : 'Low' })),
        custodyEvents: eventResult.data.map((row) => ({ id: row.id, time: new Date(row.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), title: label(row.event_type), detail: [row.location, row.notes].filter(Boolean).join(' · '), state: row.verified ? 'verified' : 'review' })),
        documents: documentResult.data.map((row) => ({ id: row.id, title: row.title, type: label(row.doc_type), owner: 'Your organisation', confidence: Number(row.confidence_score || 0), status: row.verified ? 'Verified' : 'Review' })),
        tenders: tenderResult.data.map((row) => ({ id: row.id, ref: row.title, route: `${row.origin_location} → ${row.destination_location}`, mineral: row.mineral_type || 'Mineral load', weight: kg(row.weight_kg), closes: row.required_by_date || 'Open', bids: row.tender_bids?.[0]?.count || 0, status: label(row.status) })),
        washBatches: batchResult.data.map((row) => ({ id: row.id, ref: row.batch_ref, mineral: row.mineral_type, input: kg(row.input_weight_kg), output: kg(row.output_weight_kg), yield: `${Number(row.yield_percent || 0)}%`, grade: row.grade_output || 'Pending', status: label(row.status) })),
        trades: tradeResult.data.map((row) => ({ id: row.id, ref: row.trade_ref, mineral: row.mineral_type, buyer: 'Authorised buyer', value: `${row.currency} ${Number(row.agreed_price || 0).toLocaleString()}`, stage: label(row.status), paid: row.total_due ? `${Math.round((Number(row.total_paid) / Number(row.total_due)) * 100)}%` : '0%', confidence: 0 })),
      });
    }).catch((error) => setState({ live: false, loading: false, error: error.message }));
  }, []);

  const value = useMemo(() => ({ ...demo, ...state,
    passports: state.passports?.length ? state.passports : demo.passports,
    shipments: state.shipments?.length ? state.shipments : demo.shipments,
    custodyEvents: state.custodyEvents?.length ? state.custodyEvents : demo.custodyEvents,
    documents: state.documents?.length ? state.documents : demo.documents,
    tenders: state.tenders?.length ? state.tenders : demo.tenders,
    washBatches: state.washBatches?.length ? state.washBatches : demo.washBatches,
    trades: state.trades?.length ? state.trades : demo.trades,
  }), [state]);
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export const useLiveData = () => useContext(LiveDataContext);
