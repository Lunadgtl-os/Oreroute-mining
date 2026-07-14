export const navigation = [
  { id: 'overview', label: 'Operations overview', short: 'OV' },
  { id: 'passports', label: 'Material passports', short: 'MP' },
  { id: 'shipments', label: 'Live shipments', short: 'LS' },
  { id: 'custody', label: 'Chain of custody', short: 'CC' },
  { id: 'tenders', label: 'Transport tenders', short: 'TT' },
  { id: 'washplant', label: 'Wash plant', short: 'WP' },
  { id: 'trades', label: 'Trade dossiers', short: 'TD' },
  { id: 'documents', label: 'Evidence vault', short: 'EV' },
];

export const stats = [
  { label: 'Active mineral lots', value: '128', change: '+12 this month', tone: 'positive' },
  { label: 'Material in transit', value: '4,860 t', change: '18 active loads', tone: 'neutral' },
  { label: 'Verified handoffs', value: '97.6%', change: '+1.8% confidence', tone: 'positive' },
  { label: 'Exceptions requiring review', value: '6', change: '2 high priority', tone: 'warning' },
];

export const shipments = [
  {
    id: 'OR-SHP-24081',
    lot: 'CHR-LP-02841',
    mineral: 'Chrome ore',
    route: 'Burgersfort Mine → Steelpoort Wash Plant',
    carrier: 'Mahlangu Bulk Logistics',
    vehicle: 'JZ 84 MR GP',
    weight: '34.8 t',
    status: 'In transit',
    progress: 63,
    eta: '17:45',
    risk: 'Low',
  },
  {
    id: 'OR-SHP-24079',
    lot: 'MNG-NC-01092',
    mineral: 'Manganese',
    route: 'Hotazel Stockyard → Port of Ngqura',
    carrier: 'Kalahari Freight Services',
    vehicle: 'NC 617-992',
    weight: '36.1 t',
    status: 'At checkpoint',
    progress: 78,
    eta: 'Tomorrow 08:20',
    risk: 'Medium',
  },
  {
    id: 'OR-SHP-24075',
    lot: 'COP-ZM-00544',
    mineral: 'Copper concentrate',
    route: 'Solwezi Processor → Kasumbalesa Border',
    carrier: 'Copperbelt Transit',
    vehicle: 'ALB 4832',
    weight: '31.6 t',
    status: 'Delayed',
    progress: 44,
    eta: 'Revised 21:10',
    risk: 'High',
  },
];

export const passports = [
  {
    lot: 'CHR-LP-02841',
    mineral: 'Chrome ore',
    origin: 'Burgersfort, Limpopo',
    weight: '34,820 kg',
    grade: '42.1% Cr₂O₃',
    holder: 'Mahlangu Bulk Logistics',
    status: 'In transit to wash plant',
    confidence: 98,
  },
  {
    lot: 'MNG-NC-01092',
    mineral: 'Manganese',
    origin: 'Hotazel, Northern Cape',
    weight: '36,120 kg',
    grade: '38.7% Mn',
    holder: 'Kalahari Freight Services',
    status: 'At checkpoint',
    confidence: 94,
  },
  {
    lot: 'COP-ZM-00544',
    mineral: 'Copper concentrate',
    origin: 'Solwezi, Zambia',
    weight: '31,640 kg',
    grade: '24.6% Cu',
    holder: 'Copperbelt Transit',
    status: 'Transport exception',
    confidence: 87,
  },
  {
    lot: 'LTH-ZW-00318',
    mineral: 'Lithium concentrate',
    origin: 'Goromonzi, Zimbabwe',
    weight: '28,400 kg',
    grade: '5.8% Li₂O',
    holder: 'Sovereign Salts Trading',
    status: 'Export documentation',
    confidence: 96,
  },
];

export const custodyEvents = [
  { time: '14:18', title: 'Checkpoint verified', detail: 'Steelpoort regional checkpoint · GPS and seal matched', state: 'verified' },
  { time: '13:06', title: 'Vehicle departed mine', detail: 'Gross weight 48,620 kg · net mineral weight 34,820 kg', state: 'verified' },
  { time: '12:42', title: 'Load sealed and photographed', detail: 'Seal OR-882491 · 6 evidence files attached', state: 'verified' },
  { time: '11:57', title: 'Assay certificate linked', detail: 'Independent lab result: 42.1% Cr₂O₃', state: 'verified' },
  { time: '10:31', title: 'Material passport created', detail: 'Originator: Burgersfort Chrome Operations', state: 'verified' },
];

export const exceptions = [
  { severity: 'high', title: 'Weight variance above threshold', detail: 'COP-ZM-00544 shows a 2.9% difference between origin and checkpoint readings.' },
  { severity: 'medium', title: 'Driver document nearing expiry', detail: 'Shipment OR-SHP-24079 requires renewed cross-border driver documentation.' },
  { severity: 'low', title: 'Buyer acknowledgement outstanding', detail: 'Trade dossier OR-TD-1048 is awaiting buyer confirmation of the quality pack.' },
];

export const tenders = [
  { ref: 'OR-TN-1842', route: 'Rustenburg → Richards Bay', mineral: 'Chrome concentrate', weight: '1,200 t', closes: '16 Jul, 15:00', bids: 8, status: 'Open' },
  { ref: 'OR-TN-1839', route: 'Hotazel → Port of Ngqura', mineral: 'Manganese', weight: '2,400 t', closes: '17 Jul, 10:00', bids: 5, status: 'Bidding' },
  { ref: 'OR-TN-1833', route: 'Solwezi → Durban bonded warehouse', mineral: 'Copper concentrate', weight: '620 t', closes: 'Awarded', bids: 11, status: 'Awarded' },
];

export const washBatches = [
  { ref: 'WP-B-9081', mineral: 'Chrome ore', input: '286.4 t', output: '181.9 t', yield: '63.5%', grade: '44.2% Cr₂O₃', status: 'Quality check' },
  { ref: 'WP-B-9078', mineral: 'Chrome ore', input: '311.2 t', output: '196.7 t', yield: '63.2%', grade: '43.8% Cr₂O₃', status: 'Complete' },
  { ref: 'WP-B-9072', mineral: 'Manganese', input: '420.0 t', output: '303.6 t', yield: '72.3%', grade: '41.1% Mn', status: 'Complete' },
];

export const trades = [
  { ref: 'OR-TD-1048', mineral: 'Chrome concentrate', buyer: 'Eastern Alloy Holdings', value: 'USD 1.84m', stage: 'Port loading', paid: '70%', confidence: 98 },
  { ref: 'OR-TD-1044', mineral: 'Manganese', buyer: 'Gulf Metals FZE', value: 'USD 2.17m', stage: 'At warehouse', paid: '45%', confidence: 95 },
  { ref: 'OR-TD-1039', mineral: 'Lithium concentrate', buyer: 'Nordic Battery Materials', value: 'USD 3.92m', stage: 'Export cleared', paid: '60%', confidence: 97 },
];

export const documents = [
  { title: 'Weighbridge Ticket — CHR-LP-02841', type: 'Weighbridge ticket', owner: 'Burgersfort Chrome Operations', confidence: 99, status: 'Verified' },
  { title: 'Assay Certificate — Lab Batch 4271', type: 'Quality certificate', owner: 'Independent Mineral Labs', confidence: 98, status: 'Verified' },
  { title: 'Cross-Border Permit — OR-SHP-24075', type: 'Transport permit', owner: 'Copperbelt Transit', confidence: 88, status: 'Review' },
  { title: 'Bill of Lading — OR-TD-1048', type: 'Bill of lading', owner: 'Sovereign Salts Trading', confidence: 96, status: 'Verified' },
];
