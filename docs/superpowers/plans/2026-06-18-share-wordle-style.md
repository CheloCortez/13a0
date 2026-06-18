# Share Estilo Wordle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enriquecer o texto copiado na tela de resultado com os nicks dos 5 jogadores do time e o link fixo `jogar13a0.com.br`, removendo o item de conquista de mapa perfeito do share.

**Architecture:** Toda a lógica de formatação fica em `share.ts` (engine); a página apenas passa os dados. A função `shareText()` recebe o novo parâmetro `picks: DraftedPlayer[]`, monta a linha de nicks e appenda a URL fixa. O teste em `share.test.ts` é atualizado para cobrir o novo contrato.

**Tech Stack:** TypeScript, Vitest, SvelteKit 2 + Svelte 5 (runes).

## Global Constraints

- Node: v22 (`export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH` antes de qualquer `npm`)
- Verificação final obrigatória: `npm test && npm run check && npm run build`
- Nunca fazer `git push` sem autorização do usuário

---

### Task 1: Atualizar `shareText()` em `share.ts`

**Files:**
- Modify: `src/lib/engine/share.ts`

**Interfaces:**
- Produz: `shareText(opts: { finish, matches, seed, mode, picks: DraftedPlayer[] }): string`
  - Linha de nicks: `picks.map(p => p.nick).join(' · ')` na ordem de pick
  - URL fixa: `jogar13a0.com.br`
  - `perfectMap` **removido** do output (mantido em `computeAchievements` para a UI)

- [ ] **Step 1: Escrever os testes que falham**

Substituir o bloco `describe('shareText', ...)` em `src/lib/engine/share.test.ts` pelo seguinte (os testes de `computeAchievements` não mudam):

```typescript
// Helpers de picks fictícios para os testes
import type { DraftedPlayer } from '$lib/data/types';

function makePicks(nicks: string[]): DraftedPlayer[] {
  return nicks.map((nick, i) => ({
    nick,
    role: 'entry' as const,
    rating: 1.0,
    slot: 'entry' as const,
    teamName: 'Time Fictício',
    majorId: 'test-major',
    majorName: 'Test Major'
  }));
}

describe('shareText', () => {
  test('tem um emoji por partida (verde vitória, vermelho derrota)', () => {
    const text = shareText({
      finish: 'campeão',
      matches: [
        match({ won: true, maps: [[13, 7]] }),
        match({ won: false, maps: [[5, 13]] }),
        match({ won: true, maps: [[13, 2]] })
      ],
      seed: 42,
      mode: 'classic',
      picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
    });
    expect(text).toContain('🟩🟥🟩');
  });

  test('inclui o resultado, a seed e o modo', () => {
    const text = shareText({
      finish: 'campeão',
      matches: [match({ won: true, maps: [[13, 0]] })],
      seed: 99,
      mode: 'almanac',
      picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
    });
    expect(text).toContain('CAMPEÃO');
    expect(text).toContain('#99');
    expect(text.toLowerCase()).toContain('às cegas');
  });

  test('inclui os nicks dos jogadores separados por ·', () => {
    const text = shareText({
      finish: 'campeão',
      matches: [match({ won: true, maps: [[13, 7]] })],
      seed: 1,
      mode: 'classic',
      picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
    });
    expect(text).toContain('s1mple · NiKo · device · karrigan · KSCERATO');
  });

  test('inclui o link fixo jogar13a0.com.br', () => {
    const text = shareText({
      finish: 'quartas',
      matches: [match({ won: false, maps: [[5, 13]] })],
      seed: 7,
      mode: 'classic',
      picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
    });
    expect(text).toContain('jogar13a0.com.br');
  });

  test('NÃO inclui mapa perfeito 13 a 0 no share', () => {
    const text = shareText({
      finish: 'campeão',
      matches: [match({ won: true, maps: [[13, 0]] })],
      seed: 5,
      mode: 'classic',
      picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
    });
    expect(text).not.toContain('13 a 0');
    expect(text).not.toContain('perfeito');
    expect(text).not.toContain('💎');
  });

  test('inclui 🔥 Campanha invicta apenas quando campeão invicto', () => {
    const invicto = shareText({
      finish: 'campeão',
      matches: [
        match({ won: true, maps: [[13, 7]] }),
        match({ won: true, maps: [[13, 9]] })
      ],
      seed: 2,
      mode: 'classic',
      picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
    });
    expect(invicto).toContain('🔥');

    const naoInvicto = shareText({
      finish: 'campeão',
      matches: [
        match({ won: true, maps: [[13, 7]] }),
        match({ won: false, maps: [[5, 13]] }),
        match({ won: true, maps: [[13, 9]] })
      ],
      seed: 3,
      mode: 'classic',
      picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
    });
    expect(naoInvicto).not.toContain('🔥');
  });

  test('picks vazio não quebra o formato', () => {
    expect(() =>
      shareText({
        finish: 'fase suíça',
        matches: [match({ won: false, maps: [[5, 13]] })],
        seed: 0,
        mode: 'classic',
        picks: []
      })
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

```bash
export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH
cd /home/lemontech/chelo/gitP/13a0
npm test -- --reporter=verbose 2>&1 | tail -40
```

Esperado: vários `FAIL` nos testes de `shareText` (TypeScript reclamará de `picks` faltando / funções inexistentes). Testes de `computeAchievements` devem continuar passando.

- [ ] **Step 3: Implementar a nova `shareText()` em `share.ts`**

Substituir o conteúdo completo de `src/lib/engine/share.ts` por:

```typescript
import type { DraftedPlayer } from '$lib/data/types';
import type { GameMode } from './draft';
import type { UserFinish, UserMatch } from './tournament';

export interface Achievements {
  /** Venceu algum mapa por 13 a 0 — a conquista que dá nome ao jogo. */
  perfectMap: boolean;
  /** Campanha sem perder nenhuma série. */
  unbeaten: boolean;
}

export function computeAchievements(matches: UserMatch[]): Achievements {
  let perfectMap = false;
  for (const m of matches) {
    for (const map of m.series.maps) {
      const user = m.userIsA ? map.scoreA : map.scoreB;
      const opponent = m.userIsA ? map.scoreB : map.scoreA;
      if (user === 13 && opponent === 0) perfectMap = true;
    }
  }
  return { perfectMap, unbeaten: matches.length > 0 && matches.every((m) => m.userWon) };
}

const FINISH_LABELS: Record<UserFinish, string> = {
  'fase suíça': '❌ Eliminado na fase suíça',
  quartas: '🎖️ Quartas de final',
  semi: '🥉 Semifinal',
  vice: '🥈 VICE-CAMPEÃO',
  campeão: '🏆 CAMPEÃO DO MAJOR'
};

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'Clássico',
  almanac: 'Às cegas',
  hard: 'Difícil'
};

const SITE_URL = 'jogar13a0.com.br';

export function shareText(opts: {
  finish: UserFinish;
  matches: UserMatch[];
  seed: number;
  mode: GameMode;
  picks: DraftedPlayer[];
}): string {
  const grid = opts.matches.map((m) => (m.userWon ? '🟩' : '🟥')).join('');
  const achievements = computeAchievements(opts.matches);

  const lines: string[] = [
    `13 A 0 — Major #${opts.seed} (modo ${MODE_LABELS[opts.mode]})`,
    FINISH_LABELS[opts.finish],
    grid
  ];

  if (achievements.unbeaten && opts.finish === 'campeão') lines.push('🔥 Campanha invicta!');

  if (opts.picks.length > 0) {
    lines.push('');
    lines.push(opts.picks.map((p) => p.nick).join(' · '));
  }

  lines.push('');
  lines.push(SITE_URL);

  return lines.join('\n');
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```bash
export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH
npm test -- --reporter=verbose 2>&1 | tail -40
```

Esperado: todos os testes `PASS`, incluindo os novos de `shareText`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/share.ts src/lib/engine/share.test.ts
git commit -m "feat: shareText inclui time e link fixo, remove conquista de mapa perfeito do share"
```

---

### Task 2: Atualizar `copyShare()` em `+page.svelte`

**Files:**
- Modify: `src/routes/jogo/+page.svelte`

**Interfaces:**
- Consome: `shareText({ finish, matches, seed, mode, picks: DraftedPlayer[] }): string` (definida na Task 1)
- `game.draft.picks` é `DraftedPlayer[]` — disponível quando `game.phase === 'result'`

- [ ] **Step 1: Atualizar `copyShare()` na página**

Localizar a função `copyShare()` (linhas ~212–226) e substituí-la por:

```typescript
async function copyShare() {
  if (!game.tournament || !game.draft) return;
  const text = shareText({
    finish: game.tournament.userFinish,
    matches: game.tournament.userMatches,
    seed: game.seed,
    mode: game.mode,
    picks: game.draft.picks
  });
  if (await writeClipboard(text)) {
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
}
```

Remover também a linha da `const url` que existia dentro da função (agora não existe mais).

- [ ] **Step 2: Verificar tipos com svelte-check**

```bash
export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH
npm run check 2>&1 | tail -20
```

Esperado: zero erros de tipo.

- [ ] **Step 3: Build de produção**

```bash
npm run build 2>&1 | tail -20
```

Esperado: build sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/routes/jogo/+page.svelte
git commit -m "feat: copyShare passa picks para shareText e remove geração manual de URL"
```
