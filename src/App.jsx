import { useEffect, useMemo, useState } from 'react';
import {
  custodyEvents,
  documents,
  exceptions,
  navigation,
  passports,
  shipments,
  stats,
  tenders,
  trades,
  washBatches,
} from './data.js';
import { LiveDataProvider, useLiveData } from './lib/liveData.jsx';
import EvidenceUploader from './components/EvidenceUploader.jsx';
import CreateRecordModal from './components/CreateRecordModal.jsx';

const pageCopy = {
  overview: {
    eyebrow: 'Ore Route control centre',
    title: 'Operational truth across every mineral movement',
    description: 'Monitor source, custody, transport, processing, evidence and trade readiness from one command layer.',
  },
  passports: {
    eyebrow: 'Digital material passports',
    title: 'Every lot carries its verified history',
    description: 'Inspect origin, grade, ownership, evidence confidence and the current physical holder of each mineral lot.',
  },
  shipments: {
    eyebrow: 'Live logistics',
    title: 'See every load, route and exception',
    description: 'Track active transport movements from dispatch to confirmed receipt, with weight and checkpoint evidence.',
  },
  custody: {
    eyebrow: 'Chain of custody',
    title: 'A defensible record of every handoff',
    description: 'Follow custody events, verification status and supporting evidence in chronological order.',
  },
  tenders: {
    eyebrow: 'Transport marketplace',
    title: 'Procure movement with operational context',
    description: 'Issue mineral transport requirements, compare bids and award routes without separating logistics from compliance.',
  },
  washplant: {
    eyebrow: 'Processing operations',
    title: 'Connect input lots to verified output',
    description: 'Track wash-plant batches, yield, grade improvement and the passports created from processed material.',
  },
  trades: {
    eyebrow: 'Trade dossiers',
    title: 'Move evidence with the commodity',
    description: 'Package commercial terms, milestones, quality evidence and export readiness into one buyer-facing record.',
  },
  documents: {
    eyebrow: 'Evidence vault',
    title: 'One controlled source for trade evidence',
    description: 'Store, verify and permission operational documents against the mineral lot, shipment and trade they support.',
  },
};

function StatusPill({ children, tone }) {
  const normalized = tone || String(children).toLowerCase().replaceAll(' ', '-');
  return <span className={`status-pill status-${normalized}`}>{children}</span>;
}

function SectionHeader({ title, detail, action }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
      </div>
      {action ? <button className="button button-secondary" onClick={() => /^(Create|Add|Post)/.test(action) && window.dispatchEvent(new Event('ore-route:new-record'))}>{action}</button> : null}
    </div>
  );
}

function DataTable({ columns, rows, empty = 'No records available.' }) {
  if (!rows.length) return <div className="empty-state">{empty}</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || row.ref || row.lot || row.title || rowIndex}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverviewPage({ onNavigate }) {
  const { custodyEvents, exceptions, shipments, stats, trades } = useLiveData();
  return (
    <>
      <section className="hero-card" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}ore-route-mining-hero.jpg)` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-kicker">ORE ROUTE BY SOVEREIGN SALTS</span>
          <h1>From source to buyer. Verified at every handoff.</h1>
          <p>Track mineral origin, transport, processing, custody, compliance and trade evidence through one secure operating layer.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => onNavigate('passports')}>Open material passports</button>
            <button className="button button-ghost" onClick={() => onNavigate('shipments')}>View live movement</button>
          </div>
        </div>
        <div className="hero-proof">
          <div><strong>11</strong><span>connected workflow objects</span></div>
          <div><strong>97.6%</strong><span>verified handoff rate</span></div>
          <div><strong>6</strong><span>exceptions under review</span></div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Operational statistics">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small className={`tone-${stat.tone}`}>{stat.change}</small>
          </article>
        ))}
      </section>

      <div className="overview-grid">
        <section className="panel panel-span-2">
          <SectionHeader title="Live mineral movement" detail="Active loads currently moving across the network." action="Open logistics" />
          <div className="shipment-list">
            {shipments.map((shipment) => (
              <article className="shipment-card" key={shipment.id}>
                <div className="shipment-topline">
                  <div>
                    <span className="mono">{shipment.id}</span>
                    <h3>{shipment.route}</h3>
                  </div>
                  <StatusPill tone={shipment.risk.toLowerCase()}>{shipment.status}</StatusPill>
                </div>
                <div className="shipment-meta">
                  <span>{shipment.mineral}</span>
                  <span>{shipment.weight}</span>
                  <span>{shipment.vehicle}</span>
                  <span>ETA {shipment.eta}</span>
                </div>
                <div className="progress-track"><span style={{ width: `${shipment.progress}%` }} /></div>
                <div className="shipment-footer">
                  <span>{shipment.carrier}</span>
                  <span>{shipment.progress}% route complete</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader title="Exception desk" detail="Items requiring human review." />
          <div className="exception-list">
            {exceptions.map((exception) => (
              <article key={exception.title} className="exception-item">
                <span className={`severity-dot severity-${exception.severity}`} />
                <div>
                  <h3>{exception.title}</h3>
                  <p>{exception.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <button className="text-action">Review all exceptions →</button>
        </section>
      </div>

      <div className="overview-grid secondary-grid">
        <section className="panel">
          <SectionHeader title="Latest custody events" detail="Verified activity for CHR-LP-02841." />
          <div className="timeline compact-timeline">
            {custodyEvents.slice(0, 4).map((event) => (
              <div className="timeline-event" key={`${event.time}-${event.title}`}>
                <div className="timeline-marker" />
                <time>{event.time}</time>
                <div><h3>{event.title}</h3><p>{event.detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader title="Trade readiness" detail="Evidence completeness by active dossier." />
          <div className="readiness-list">
            {trades.map((trade) => (
              <div className="readiness-row" key={trade.ref}>
                <div><strong>{trade.ref}</strong><span>{trade.buyer}</span></div>
                <div className="confidence-ring" style={{ '--score': `${trade.confidence * 3.6}deg` }}><span>{trade.confidence}%</span></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function PassportsPage() {
  const { passports } = useLiveData();
  const columns = [
    { key: 'lot', label: 'Lot ID', render: (row) => <span className="mono strong">{row.lot}</span> },
    { key: 'mineral', label: 'Material' },
    { key: 'origin', label: 'Origin' },
    { key: 'weight', label: 'Weight' },
    { key: 'grade', label: 'Grade' },
    { key: 'holder', label: 'Current holder' },
    { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
    { key: 'confidence', label: 'Evidence', render: (row) => <strong>{row.confidence}%</strong> },
  ];
  return <section className="panel"><SectionHeader title="Material passport register" detail="Verified mineral identity from creation to delivery." action="Create passport" /><DataTable columns={columns} rows={passports} /></section>;
}

function ShipmentsPage() {
  const { shipments } = useLiveData();
  return (
    <div className="split-layout">
      <section className="panel panel-span-2">
        <SectionHeader title="Live shipment register" detail="Transport state, weight, vehicle and route confidence." action="Create shipment" />
        <div className="shipment-list detailed-list">
          {shipments.map((shipment) => (
            <article className="shipment-card" key={shipment.id}>
              <div className="shipment-topline"><div><span className="mono">{shipment.id}</span><h3>{shipment.route}</h3></div><StatusPill tone={shipment.risk.toLowerCase()}>{shipment.status}</StatusPill></div>
              <div className="shipment-meta"><span>Lot {shipment.lot}</span><span>{shipment.mineral}</span><span>{shipment.weight}</span><span>{shipment.vehicle}</span></div>
              <div className="progress-track"><span style={{ width: `${shipment.progress}%` }} /></div>
              <div className="shipment-footer"><span>{shipment.carrier}</span><span>ETA {shipment.eta}</span></div>
            </article>
          ))}
        </div>
      </section>
      <section className="panel route-panel">
        <SectionHeader title="Route control" detail="Selected load: OR-SHP-24081" />
        <div className="route-map" aria-label="Stylised route map">
          <div className="route-line" />
          <div className="route-node route-node-start"><span>Mine</span></div>
          <div className="route-node route-node-mid"><span>Checkpoint</span></div>
          <div className="route-node route-node-end"><span>Wash plant</span></div>
          <div className="truck-marker">TRK</div>
        </div>
        <dl className="detail-list">
          <div><dt>Last signal</dt><dd>2 minutes ago</dd></div>
          <div><dt>Seal status</dt><dd>Matched</dd></div>
          <div><dt>Route deviation</dt><dd>0.3 km</dd></div>
          <div><dt>Evidence confidence</dt><dd>98%</dd></div>
        </dl>
      </section>
    </div>
  );
}

function CustodyPage() {
  const { custodyEvents } = useLiveData();
  return (
    <div className="split-layout">
      <section className="panel panel-span-2">
        <SectionHeader title="Custody timeline" detail="Material passport CHR-LP-02841 · Chrome ore · Burgersfort" action="Add event" />
        <div className="timeline large-timeline">
          {custodyEvents.map((event) => (
            <div className="timeline-event" key={`${event.time}-${event.title}`}>
              <div className="timeline-marker" />
              <time>{event.time}</time>
              <div><h3>{event.title}</h3><p>{event.detail}</p><StatusPill tone="verified">Evidence verified</StatusPill></div>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <SectionHeader title="Passport summary" detail="Current verified state." />
        <div className="material-sample"><span>CHR</span><small>Chrome ore</small></div>
        <dl className="detail-list">
          <div><dt>Origin</dt><dd>Burgersfort, Limpopo</dd></div>
          <div><dt>Current holder</dt><dd>Mahlangu Bulk Logistics</dd></div>
          <div><dt>Net weight</dt><dd>34,820 kg</dd></div>
          <div><dt>Grade</dt><dd>42.1% Cr₂O₃</dd></div>
          <div><dt>Evidence files</dt><dd>14 verified</dd></div>
        </dl>
      </section>
    </div>
  );
}

function TendersPage() {
  const { tenders } = useLiveData();
  const columns = [
    { key: 'ref', label: 'Tender', render: (row) => <span className="mono strong">{row.ref}</span> },
    { key: 'route', label: 'Route' },
    { key: 'mineral', label: 'Material' },
    { key: 'weight', label: 'Volume' },
    { key: 'closes', label: 'Closes' },
    { key: 'bids', label: 'Bids' },
    { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return <section className="panel"><SectionHeader title="Transport tender board" detail="Open, bidding and awarded mineral logistics requirements." action="Post tender" /><DataTable columns={columns} rows={tenders} /></section>;
}

function WashPlantPage() {
  const { washBatches } = useLiveData();
  const columns = [
    { key: 'ref', label: 'Batch', render: (row) => <span className="mono strong">{row.ref}</span> },
    { key: 'mineral', label: 'Material' },
    { key: 'input', label: 'Input weight' },
    { key: 'output', label: 'Output weight' },
    { key: 'yield', label: 'Yield' },
    { key: 'grade', label: 'Output grade' },
    { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return (
    <>
      <section className="process-banner">
        <div><span>PROCESSING OPERATIONS</span><h2>Input lots remain connected to every processed output.</h2></div>
        <div className="process-flow"><span>Raw ore</span><i>→</i><span>Wash & sort</span><i>→</i><span>Quality check</span><i>→</i><span>Output passport</span></div>
      </section>
      <section className="panel"><SectionHeader title="Wash-plant batch register" detail="Yield, grade improvement and processing state." action="Create batch" /><DataTable columns={columns} rows={washBatches} /></section>
    </>
  );
}

function TradesPage() {
  const { trades } = useLiveData();
  const columns = [
    { key: 'ref', label: 'Trade dossier', render: (row) => <span className="mono strong">{row.ref}</span> },
    { key: 'mineral', label: 'Material' },
    { key: 'buyer', label: 'Buyer' },
    { key: 'value', label: 'Trade value' },
    { key: 'stage', label: 'Current stage', render: (row) => <StatusPill>{row.stage}</StatusPill> },
    { key: 'paid', label: 'Paid' },
    { key: 'confidence', label: 'Evidence', render: (row) => <strong>{row.confidence}%</strong> },
  ];
  return <section className="panel"><SectionHeader title="Trade dossier register" detail="Commercial, compliance and evidence state for active trades." action="Create dossier" /><DataTable columns={columns} rows={trades} /></section>;
}

function DocumentsPage() {
  const { documents } = useLiveData();
  const columns = [
    { key: 'title', label: 'Document', render: (row) => <span className="strong">{row.title}</span> },
    { key: 'type', label: 'Evidence type' },
    { key: 'owner', label: 'Provided by' },
    { key: 'confidence', label: 'Confidence', render: (row) => <strong>{row.confidence}%</strong> },
    { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return <section className="panel"><SectionHeader title="Evidence vault" detail="Documents linked to the exact passport, shipment and trade they support." /><EvidenceUploader /><DataTable columns={columns} rows={documents} /></section>;
}

function AppShell() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const activeCopy = pageCopy[activePage];
  const canCreate = ['passports','shipments','custody','tenders','washplant','trades'].includes(activePage);
  useEffect(() => { const open = () => setCreating(true); window.addEventListener('ore-route:new-record', open); return () => window.removeEventListener('ore-route:new-record', open); }, []);

  const content = useMemo(() => {
    switch (activePage) {
      case 'passports': return <PassportsPage />;
      case 'shipments': return <ShipmentsPage />;
      case 'custody': return <CustodyPage />;
      case 'tenders': return <TendersPage />;
      case 'washplant': return <WashPlantPage />;
      case 'trades': return <TradesPage />;
      case 'documents': return <DocumentsPage />;
      default: return <OverviewPage onNavigate={setActivePage} />;
    }
  }, [activePage]);

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><strong>Ore Route</strong><small>by Sovereign Salts</small></div>
        </div>

        <nav aria-label="Primary navigation">
          <span className="nav-label">Operations</span>
          {navigation.map((item) => (
            <button key={item.id} className={activePage === item.id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(item.id)}>
              <span className="nav-short">{item.short}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="network-status"><span className="online-dot" /><div><strong>Network operational</strong><small>All core services available</small></div></div>
          <div className="user-card"><div className="avatar">OG</div><div><strong>Owen Gumbanjera</strong><small>Platform administrator</small></div></div>
        </div>
      </aside>

      {sidebarOpen ? <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} /> : null}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="page-heading"><span>{activeCopy.eyebrow}</span><h1>{activeCopy.title}</h1><p>{activeCopy.description}</p></div>
          <div className="topbar-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification-button" aria-label="Notifications">•<span>3</span></button>{canCreate ? <button className="button button-primary compact" onClick={() => setCreating(true)}>New record</button> : null}</div>
        </header>
        <div className="page-body">{content}</div>
      </main>
      {creating ? <CreateRecordModal page={activePage} onClose={(saved) => { setCreating(false); if (saved) window.location.reload(); }} /> : null}
    </div>
  );
}

function App() {
  return <LiveDataProvider><AppShell /></LiveDataProvider>;
}

export default App;
