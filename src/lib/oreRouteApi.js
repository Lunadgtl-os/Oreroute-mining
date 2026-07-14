import { isSupabaseConfigured, supabase } from './supabase.js';

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

async function list(table, { select = '*', order = 'created_at', ascending = false, limit = 100 } = {}) {
  const { data, error } = await requireClient()
    .from(table)
    .select(select)
    .order(order, { ascending })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function insert(table, record) {
  const { data, error } = await requireClient().from(table).insert(record).select().single();
  if (error) throw error;
  return data;
}

async function update(table, id, changes) {
  const { data, error } = await requireClient().from(table).update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export const oreRouteApi = {
  organisations: {
    list: () => list('organisations', { order: 'name', ascending: true }),
    create: (record) => insert('organisations', record),
    update: (id, changes) => update('organisations', id, changes),
  },
  passports: {
    list: () => list('material_passports', { order: 'created_at' }),
    create: (record) => insert('material_passports', record),
    update: (id, changes) => update('material_passports', id, changes),
  },
  custodyEvents: {
    list: () => list('custody_events', { order: 'occurred_at' }),
    create: (record) => insert('custody_events', record),
  },
  shipments: {
    list: () => list('shipments', { order: 'created_at' }),
    create: (record) => insert('shipments', record),
    update: (id, changes) => update('shipments', id, changes),
  },
  documents: {
    list: () => list('documents', { order: 'created_at' }),
    create: (record) => insert('documents', record),
  },
  tenders: {
    list: () => list('transport_tenders', { order: 'created_at' }),
    create: (record) => insert('transport_tenders', record),
    update: (id, changes) => update('transport_tenders', id, changes),
  },
  bids: {
    list: () => list('tender_bids', { order: 'created_at' }),
    create: (record) => insert('tender_bids', record),
    update: (id, changes) => update('tender_bids', id, changes),
  },
  washPlantBatches: {
    list: () => list('wash_plant_batches', { order: 'created_at' }),
    create: (record) => insert('wash_plant_batches', record),
    update: (id, changes) => update('wash_plant_batches', id, changes),
  },
  tradeDossiers: {
    list: () => list('trade_dossiers', { order: 'created_at' }),
    create: (record) => insert('trade_dossiers', record),
    update: (id, changes) => update('trade_dossiers', id, changes),
  },
  paymentMilestones: {
    list: () => list('payment_milestones', { order: 'created_at' }),
    create: (record) => insert('payment_milestones', record),
    update: (id, changes) => update('payment_milestones', id, changes),
  },
};
