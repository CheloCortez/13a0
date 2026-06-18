# Design: Compartilhamento estilo Wordle com time e link fixo

**Data:** 2026-06-18  
**Status:** Aprovado

## Objetivo

Melhorar o texto copiado na tela de resultado para incluir o time montado pelo usuário (nicks dos 5 jogadores) e o link fixo `jogar13a0.com.br`, tornando o compartilhamento mais informativo e divertido — no espírito do Wordle.

## Formato final do texto compartilhado

```
13 A 0 — Major #1234 (Clássico)
🏆 CAMPEÃO DO MAJOR
🟩🟩🟩🟩🟩🟩🟩
🔥 Campanha invicta!    ← só se unbeaten === true

s1mple · NiKo · device · karrigan · KSCERATO

jogar13a0.com.br
```

Regras:
- A linha de conquista `🔥 Campanha invicta!` só aparece quando `unbeaten && finish === 'campeão'`.
- A conquista de mapa perfeito (`💎 Mapa perfeito: 13 a 0!`) é **removida** do share (o cálculo `perfectMap` em `computeAchievements` continua existindo para uso na UI).
- Os nicks são listados na **ordem de pick** (narrativa do jogo), separados por ` · `.
- A URL é sempre `jogar13a0.com.br` (constante hardcoded no arquivo `share.ts`).
- Linha em branco antes dos nicks e antes da URL para respiração visual.

## Mudanças

### `src/lib/engine/share.ts`

- Adicionar `picks: DraftedPlayer[]` ao tipo de parâmetro de `shareText()`.
- Adicionar constante `const SITE_URL = 'jogar13a0.com.br'` no topo do arquivo.
- Remover a linha `perfectMap` do array `lines` em `shareText()`.
- Inserir linha em branco + linha de nicks (`picks.map(p => p.nick).join(' · ')`) após o grid.
- Inserir linha em branco + `SITE_URL` ao final.
- Importar `DraftedPlayer` de `$lib/data/types`.

### `src/routes/jogo/+page.svelte`

- Em `copyShare()`: passar `picks: game.draft!.picks` para `shareText()`.
- Remover a geração de URL (`page.url.origin + base + ...`) que era concatenada manualmente ao texto — agora está dentro de `shareText()`.
- Remover a importação de `page` se não for mais usada em outro lugar (verificar).

### `src/lib/engine/share.test.ts`

- Atualizar o teste existente: incluir array de 5 `DraftedPlayer` fictícios em `shareText()`.
- Verificar que a linha de nicks aparece no output (ex: `s1mple · NiKo`).
- Verificar que `jogar13a0.com.br` aparece no output.
- Verificar que `💎 Mapa perfeito` **não** aparece no output.
- Adicionar caso com `picks: []` para garantir que não quebra (linha de nicks vazia ou ausente).

## O que não muda

- O campo `perfectMap` em `computeAchievements()` permanece — é exibido na tela de resultado (`<p class="perfect">💎 …</p>`), apenas removido do share.
- A aparência visual do botão "Copiar resultado" e do painel de resultado não muda.
- Nenhuma mudança no engine de torneio, draft ou strength.
