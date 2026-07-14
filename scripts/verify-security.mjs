import { readFileSync, readdirSync } from 'node:fs';

const migrations = readdirSync('supabase/migrations').sort();
const deployment = readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
const walk = (path) => readdirSync(path, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(`${path}/${entry.name}`) : [`${path}/${entry.name}`]);
const sources = ['src', 'supabase', '.github'].flatMap(walk);
const text = sources.filter((path) => !path.endsWith('.jpg')).map((path) => readFileSync(path, 'utf8')).join('\n');
const failures = [];

if (!migrations.some((name) => name.includes('repository_reconciliation'))) failures.push('Repository reconciliation migration is missing.');
if (!deployment.includes('VITE_SUPABASE_URL') || !deployment.includes('VITE_SUPABASE_ANON_KEY')) failures.push('Pages build is missing Supabase browser configuration.');
if (/sb_secret_|SUPABASE_SERVICE_ROLE_KEY/.test(text)) failures.push('Service-role credential reference detected.');
if (!text.includes('to authenticated')) failures.push('No explicit authenticated RLS policies found.');

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Security source checks passed across ${migrations.length} migrations.`);
