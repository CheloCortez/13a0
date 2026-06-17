# Monetização leve — doação (Pix + Ko-fi) + 1 anúncio discreto

**Data:** 2026-06-17
**Objetivo do dono:** cobrir custos (domínio `.com.br` ~R$40/ano; Vercel free cobre o pico).
Não é fonte de renda — é prudência financeira sem prejudicar a experiência.

## Princípios

- **Doação é o motor; anúncio é bônus.** A receita esperada de um pico viral único é
  baixíssima; a doação carrega o peso e combina com a vibe de fan project da comunidade CS.
- **Nunca poluir o fluxo de jogo.** Nada no home, no draft, na revisão ou durante as partidas.
  Monetização só aparece em momentos de baixo atrito: tela de resultado e página `/sobre`.
- **Manter o site 100% estático e sem backend.** Pix e Ko-fi não exigem servidor; o QR é asset
  estático. Nenhuma dependência nova de runtime para a doação.
- **Respeitar o design system** (cantos chanfrados, tokens `--accent`/`--ct`, uppercase,
  `prefers-reduced-motion`) para não parecer banner genérico.

## Componentes

### 1. `SupportBlock.svelte` (novo)
Bloco de apoio reutilizável. Conteúdo:
- Título curto ("Curtiu? Apoie o projeto" / "Apoie o 13 a 0").
- **Pix:** botão "Copiar chave Pix" (copia o payload *Copia e Cola* para o clipboard, mesmo
  padrão do botão "Copiar resultado" já existente) + QR code como **asset estático**
  (`static/pix-qr.svg` ou `.png`) gerado a partir do payload BR Code. Feedback visual de
  "✓ Copiado!" reaproveitando o padrão de `copied` da tela de resultado.
- **Ko-fi:** link/botão "Pagar um café (Ko-fi)" abrindo a URL do Ko-fi em nova aba
  (`rel="noopener"`).
- Props para variar densidade (ex: `compact` na tela de resultado vs. seção completa no `/sobre`).

**Valores a preencher na implementação (config, não placeholders de design):**
- `PIX_PAYLOAD` — string "Pix Copia e Cola" (BR Code/EMV) gerada pelo banco a partir da
  **chave aleatória** do dono.
- `pix-qr` — imagem do QR gerada uma vez a partir desse payload, commitada em `static/`.
- `KOFI_URL` — URL do perfil Ko-fi do dono.
Centralizar esses valores num único módulo (ex: `src/lib/config/support.ts`) para fonte única.

### 2. `AdSlot.svelte` (novo)
Slot único de anúncio, **AdSense**, isolado num componente para conter o script de terceiros.
- Renderiza a unidade de anúncio responsiva da AdSense.
- **Degradação graciosa:** se o script não carregar (adblock) ou a aprovação ainda não saiu,
  o slot simplesmente não ocupa espaço / não quebra o layout. Sem placeholder feio.
- Carregamento do script AdSense adicionado em `src/app.html` (ou via componente) de forma a
  não bloquear a renderização inicial.

## Posicionamento

- **Tela de resultado** (`src/routes/jogo/+page.svelte`, painel `.result` ~linha 380, logo
  após o botão "Copiar resultado"): `<SupportBlock compact />` seguido de `<AdSlot />`.
  Momento de maior atenção/emoção e onde um anúncio menos incomoda.
- **`/sobre`** (`src/routes/sobre/+page.svelte`): nova `<section>` com `<SupportBlock />`
  completo (apoio permanente).
- **Sem anúncio no `/sobre`** (mantém a página limpa) e **sem nada no home/draft/partidas**.

## Aviso legal (barato e prudente)

Adicionar no `/sobre` uma nota curta: **"Projeto de fã, sem fins de lucro relevantes; não
afiliado nem endossado pela Valve. Nomes de jogadores e equipes pertencem aos seus
respectivos detentores."** Mitiga o risco do tema CS + nicks reais sob monetização leve.

## Fora de escopo (YAGNI)

- Apoia-se/Catarse/Patreon (mecenato recorrente — complexidade que não se paga aqui).
- Múltiplos slots de anúncio, anúncios intersticiais ou durante o jogo.
- Patrocínio de apostas/skins (risco jurídico/ético; recusado deliberadamente).
- Qualquer backend, conta de usuário ou paywall.

## Riscos e expectativas

- **AdSense pode não estar aprovado no lançamento** (aprovação leva dias/semanas; sites
  "magros" às vezes reprovam). Recomendação: aplicar cedo; o `AdSlot` degrada sozinho se não
  houver anúncio. O lançamento **não depende** do anúncio.
- **Adblock alto** no público gamer reduz impressões — esperado; a doação é o plano A.

## Verificação

- `npm test && npm run check && npm run build` verdes.
- Screenshot headless da tela de resultado e do `/sobre` confirmando layout (chanfros, tokens)
  e que o `AdSlot` ausente não quebra o layout.
- Botão "Copiar chave Pix" copia o payload correto (feedback "✓ Copiado!").
