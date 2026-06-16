/**
 * Valida a integridade dos JSONs de Majors em static/data/majors/.
 * Uso: npm run validate-data
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROLES = ['awp', 'igl', 'entry', 'lurker', 'support'];
const RATING_MIN = 0.8;
const RATING_MAX = 1.45;

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'static', 'data', 'majors');
const errors: string[] = [];

const index = JSON.parse(readFileSync(join(dataDir, 'index.json'), 'utf-8'));
const files = readdirSync(dataDir).filter((f) => f.endsWith('.json') && f !== 'index.json');

for (const entry of index) {
	if (!files.includes(`${entry.id}.json`)) {
		errors.push(`index.json aponta para major inexistente: ${entry.id}`);
	}
}

for (const file of files) {
	const major = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
	const ctx = file;

	if (`${major.id}.json` !== file) errors.push(`${ctx}: id "${major.id}" não bate com o nome do arquivo`);
	if (!index.some((e: { id: string }) => e.id === major.id))
		errors.push(`${ctx}: major não está listado em index.json`);
	if (!major.teams?.length) errors.push(`${ctx}: sem times`);

	const teamIds = new Set<string>();
	for (const team of major.teams ?? []) {
		const tctx = `${ctx} → ${team.name}`;
		if (teamIds.has(team.id)) errors.push(`${tctx}: id de time duplicado`);
		teamIds.add(team.id);

		if (team.players?.length !== 5) {
			errors.push(`${tctx}: precisa de exatamente 5 jogadores, tem ${team.players?.length ?? 0}`);
			continue;
		}
		const nicks = new Set<string>();
		for (const p of team.players) {
			if (nicks.has(p.nick)) errors.push(`${tctx}: nick duplicado "${p.nick}"`);
			nicks.add(p.nick);
			if (!ROLES.includes(p.role)) errors.push(`${tctx} → ${p.nick}: função inválida "${p.role}"`);
			if (p.role2 !== undefined && (!ROLES.includes(p.role2) || p.role2 === p.role))
				errors.push(`${tctx} → ${p.nick}: função secundária inválida "${p.role2}"`);
			if (typeof p.rating !== 'number' || p.rating < RATING_MIN || p.rating > RATING_MAX)
				errors.push(`${tctx} → ${p.nick}: rating fora do intervalo [${RATING_MIN}, ${RATING_MAX}]: ${p.rating}`);
		}
	}
}

if (errors.length) {
	console.error(`✗ ${errors.length} erro(s) de integridade:\n`);
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}
console.log(`✓ ${files.length} majors válidos (${index.length} no índice)`);
