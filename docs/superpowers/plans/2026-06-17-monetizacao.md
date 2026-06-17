# Monetização leve (Pix + Ko-fi + 1 anúncio) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar apoio por doação (Pix + Ko-fi) e um único slot de anúncio discreto, sem backend e sem poluir o fluxo de jogo.

**Architecture:** Constantes de configuração centralizadas num módulo; dois componentes Svelte (`SupportBlock`, `AdSlot`) que **degradam sozinhos** quando a config está vazia; inseridos só na tela de resultado e no `/sobre`. Clipboard reaproveitado de um util extraído.

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes) + TypeScript, 100% estático (`adapter-static`). AdSense como única dependência de terceiros, carregada sob demanda.

## Global Constraints

- Ambiente: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH` antes de qualquer npm.
- Site 100% estático, sem backend. Pix/Ko-fi sem servidor; QR é asset estático.
- Nada de monetização no home, draft, revisão ou durante partidas. Só resultado e `/sobre`.
- Design system: cantos chanfrados (`clip-path` com `--cut`/`--cut-sm`), tokens `--accent`/`--ct`, títulos uppercase, respeitar `prefers-reduced-motion`. UI em português.
- Config vazia ⇒ elemento some (sem placeholder feio, sem quebrar layout).
- Não testamos componentes Svelte neste repo (a suíte é só do engine, lógica pura). Verificação aqui = `npm run check && npm run build` + screenshot headless + cópia manual do Pix.
- Verificação final antes de "pronto": `npm test && npm run check && npm run build`.

## File Structure

- Criar `src/lib/clipboard.ts` — util `writeClipboard` (extraído de `jogo/+page.svelte`).
- Criar `src/lib/config/support.ts` — constantes de monetização (tudo opcional).
- Criar `src/lib/components/SupportBlock.svelte` — bloco de doação (Pix + Ko-fi).
- Criar `src/lib/components/AdSlot.svelte` — slot único AdSense, auto-carregado e gracioso.
- Modificar `src/routes/jogo/+page.svelte` — usar o util; inserir `SupportBlock`+`AdSlot` no painel de resultado.
- Modificar `src/routes/sobre/+page.svelte` — `SupportBlock` completo + nota de fan project.
- (Usuário) Gerar `static/pix-qr.svg` a partir do payload Pix e preencher os valores em `support.ts`.

---

### Task 1: Util de clipboard + módulo de configuração

**Files:**
- Create: `src/lib/clipboard.ts`
- Create: `src/lib/config/support.ts`
- Modify: `src/routes/jogo/+page.svelte:174-196` (remover `writeClipboard` local, importar do util)

**Interfaces:**
- Produces: `writeClipboard(text: string): Promise<boolean>` em `$lib/clipboard`.
- Produces (config em `$lib/config/support`): `PIX_PAYLOAD: string`, `PIX_QR_SRC: string`, `KOFI_URL: string`, `ADSENSE_CLIENT: string`, `ADSENSE_SLOT: string`.

- [ ] **Step 1: Criar o util de clipboard**

`src/lib/clipboard.ts`:
```ts
/** Copia texto para a área de transferência, com fallback para execCommand. */
export async function writeClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		/* cai no fallback abaixo */
	}
	try {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(ta);
		return ok;
	} catch {
		return false;
	}
}
```

- [ ] **Step 2: Criar o módulo de configuração**

`src/lib/config/support.ts`:
```ts
// Configuração de monetização. Campos vazios fazem a UI esconder o respectivo elemento.

/** Payload "Pix Copia e Cola" (BR Code/EMV) gerado pelo banco a partir da chave aleatória. */
export const PIX_PAYLOAD = '';

/** Caminho (em static/) do QR gerado a partir do PIX_PAYLOAD. Vazio = sem imagem de QR. */
export const PIX_QR_SRC = '/pix-qr.svg';

/** URL do perfil/página Ko-fi. Vazio = esconde o botão. */
export const KOFI_URL = '';

/** AdSense: client (ex: 'ca-pub-XXXXXXXXXXXXXXXX') e slot (ex: '1234567890'). Vazios = sem anúncio. */
export const ADSENSE_CLIENT = '';
export const ADSENSE_SLOT = '';
```

- [ ] **Step 3: Substituir o `writeClipboard` local no `/jogo` pelo import**

Em `src/routes/jogo/+page.svelte`: apagar a função local `writeClipboard` (linhas ~174-196) e adicionar o import junto aos demais imports do `<script>`:
```ts
import { writeClipboard } from '$lib/clipboard';
```
(o `copyShare` continua igual, agora usando o util importado.)

- [ ] **Step 4: Verificar tipos e build**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check && npm run build`
Expected: 0 erros; build conclui em `build/`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/clipboard.ts src/lib/config/support.ts src/routes/jogo/+page.svelte
git commit -m "refactor: extrai writeClipboard p/ util + módulo de config de apoio"
```

---

### Task 2: Componente SupportBlock + integração no /sobre

**Files:**
- Create: `src/lib/components/SupportBlock.svelte`
- Modify: `src/routes/sobre/+page.svelte` (nova seção de apoio + nota de fan project)

**Interfaces:**
- Consumes: `writeClipboard` (`$lib/clipboard`); `PIX_PAYLOAD`, `PIX_QR_SRC`, `KOFI_URL` (`$lib/config/support`); `base` (`$app/paths`).
- Produces: componente `<SupportBlock compact?={boolean} />` (default `compact = false`).

- [ ] **Step 1: Criar o componente**

`src/lib/components/SupportBlock.svelte`:
```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { PIX_PAYLOAD, PIX_QR_SRC, KOFI_URL } from '$lib/config/support';
	import { writeClipboard } from '$lib/clipboard';

	let { compact = false }: { compact?: boolean } = $props();

	let copied = $state(false);

	const hasPix = $derived(!!PIX_PAYLOAD);
	const hasKofi = $derived(!!KOFI_URL);
	const hasAny = $derived(hasPix || hasKofi);

	async function copyPix() {
		if (!PIX_PAYLOAD) return;
		if (await writeClipboard(PIX_PAYLOAD)) {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

{#if hasAny}
	<section class="support" class:compact>
		<h3>Curtiu? Apoie o projeto</h3>
		<p>O 13 a 0 é gratuito e feito por fã. Se quiser ajudar a manter o site no ar, um Pix de qualquer valor já faz diferença.</p>
		<div class="actions">
			{#if hasPix}
				<button class="btn" onclick={copyPix}>{copied ? '✓ Chave copiada!' : '📋 Copiar chave Pix'}</button>
			{/if}
			{#if hasKofi}
				<a class="btn kofi" href={KOFI_URL} target="_blank" rel="noopener">☕ Apoiar no Ko-fi</a>
			{/if}
		</div>
		{#if hasPix && PIX_QR_SRC && !compact}
			<img class="qr" src={`${base}${PIX_QR_SRC}`} alt="QR code Pix para doação" width="180" height="180" loading="lazy" />
		{/if}
	</section>
{/if}

<style>
	.support {
		margin-top: 1.5rem;
		padding: 1.25rem;
		background: var(--panel, #141b24);
		border-top: 2px solid var(--accent);
	}
	.support.compact {
		margin-top: 1rem;
		padding: 1rem;
	}
	.support h3 {
		font-family: 'Rajdhani', sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin: 0 0 0.4rem;
	}
	.support p {
		margin: 0 0 0.9rem;
		color: var(--muted, #9aa7b4);
		font-size: 0.95rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		align-items: center;
	}
	.btn {
		display: inline-block;
		padding: 0.55rem 1rem;
		background: var(--accent);
		color: #0d1219;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border: none;
		cursor: pointer;
		text-decoration: none;
		clip-path: polygon(var(--cut-sm, 8px) 0, 100% 0, 100% calc(100% - var(--cut-sm, 8px)), calc(100% - var(--cut-sm, 8px)) 100%, 0 100%, 0 var(--cut-sm, 8px));
	}
	.btn.kofi {
		background: var(--ct);
		color: #fff;
	}
	.qr {
		display: block;
		margin-top: 1rem;
		image-rendering: pixelated;
		background: #fff;
		padding: 6px;
	}
</style>
```

- [ ] **Step 2: Inserir no `/sobre` + nota de fan project**

Em `src/routes/sobre/+page.svelte`, adicionar ao import do `<script>`:
```ts
import SupportBlock from '$lib/components/SupportBlock.svelte';
```
E, após a `</section>` final (linha ~80), adicionar:
```svelte
<section>
	<h2>Apoie o 13 a 0</h2>
	<SupportBlock />
	<p class="disclaimer">
		Projeto de fã, sem fins lucrativos relevantes; não afiliado nem endossado pela Valve.
		Counter-Strike e os nomes de jogadores e equipes pertencem aos seus respectivos detentores.
	</p>
</section>
```
Adicionar no `<style>` do `/sobre`:
```css
.disclaimer {
	margin-top: 1.5rem;
	font-size: 0.8rem;
	color: var(--muted, #9aa7b4);
}
```

- [ ] **Step 3: Verificar tipos e build**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check && npm run build`
Expected: 0 erros; build conclui.

- [ ] **Step 4: Screenshot do /sobre**

Run (com `npm run preview` ativo na porta P):
```bash
google-chrome --headless --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=520,1400 --screenshot=/tmp/sobre.png "http://localhost:P/sobre"
```
Expected: seção "Apoie o 13 a 0" visível; com config vazia, o `SupportBlock` não renderiza (só o disclaimer aparece) e o layout não quebra.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/SupportBlock.svelte src/routes/sobre/+page.svelte
git commit -m "feat: bloco de apoio (Pix + Ko-fi) no /sobre + nota de fan project"
```

---

### Task 3: Componente AdSlot (AdSense gracioso)

**Files:**
- Create: `src/lib/components/AdSlot.svelte`

**Interfaces:**
- Consumes: `ADSENSE_CLIENT`, `ADSENSE_SLOT` (`$lib/config/support`).
- Produces: componente `<AdSlot />` (sem props). Renderiza nada quando a config está vazia.

- [ ] **Step 1: Criar o componente**

`src/lib/components/AdSlot.svelte`:
```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { ADSENSE_CLIENT, ADSENSE_SLOT } from '$lib/config/support';

	const enabled = !!ADSENSE_CLIENT && !!ADSENSE_SLOT;

	onMount(() => {
		if (!enabled) return;
		const id = 'adsense-loader';
		if (!document.getElementById(id)) {
			const s = document.createElement('script');
			s.id = id;
			s.async = true;
			s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
			s.crossOrigin = 'anonymous';
			document.head.appendChild(s);
		}
		try {
			// @ts-expect-error adsbygoogle é injetado pelo script externo
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch {
			/* adblock ou script bloqueado — degrada sem quebrar */
		}
	});
</script>

{#if enabled}
	<aside class="ad" aria-label="Publicidade">
		<ins
			class="adsbygoogle"
			style="display:block"
			data-ad-client={ADSENSE_CLIENT}
			data-ad-slot={ADSENSE_SLOT}
			data-ad-format="auto"
			data-full-width-responsive="true"
		></ins>
	</aside>
{/if}

<style>
	.ad {
		margin-top: 1.25rem;
		min-height: 0;
	}
</style>
```

- [ ] **Step 2: Verificar tipos e build**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check && npm run build`
Expected: 0 erros (config vazia ⇒ `enabled` false ⇒ nada renderiza).

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdSlot.svelte
git commit -m "feat: AdSlot (AdSense) auto-carregado e gracioso"
```

---

### Task 4: Integração na tela de resultado

**Files:**
- Modify: `src/routes/jogo/+page.svelte` (import + inserir no painel `.result` após o botão "Copiar resultado", ~linha 390)

**Interfaces:**
- Consumes: `<SupportBlock compact />` e `<AdSlot />`.

- [ ] **Step 1: Importar os componentes**

Em `src/routes/jogo/+page.svelte`, junto aos imports do `<script>`:
```ts
import SupportBlock from '$lib/components/SupportBlock.svelte';
import AdSlot from '$lib/components/AdSlot.svelte';
```

- [ ] **Step 2: Inserir no painel de resultado**

Logo após o `</button>` do "Copiar resultado" (~linha 390) e antes de fechar o `<div class="panel result">`:
```svelte
				<SupportBlock compact />
				<AdSlot />
```

- [ ] **Step 3: Verificar tipos e build**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm run check && npm run build`
Expected: 0 erros; build conclui.

- [ ] **Step 4: Screenshot da tela de resultado**

Servir `build/` com `python3 -m http.server` e injetar um save de resultado (ver CLAUDE.md → Verificação visual), navegar até o painel `.result`. Conferir: bloco de apoio compacto presente, AdSlot ausente não deixa buraco, chanfros/tokens corretos.

- [ ] **Step 5: Verificação final + commit**

Run: `export PATH=$HOME/.nvm/versions/node/v22.22.3/bin:$PATH && npm test && npm run check && npm run build`
Expected: testes do engine passam; 0 erros; build ok.
```bash
git add src/routes/jogo/+page.svelte
git commit -m "feat: apoio + anúncio na tela de resultado"
```

---

## Pendências do usuário (fora do código)

1. Gerar a **chave Pix aleatória** no banco e copiar o **"Pix Copia e Cola"** → preencher `PIX_PAYLOAD`.
2. Gerar o **QR** a partir desse payload e salvar em `static/pix-qr.svg` (ou ajustar `PIX_QR_SRC`).
3. Criar conta **Ko-fi** → preencher `KOFI_URL`.
4. Solicitar **AdSense**, obter `client`/`slot` → preencher `ADSENSE_CLIENT`/`ADSENSE_SLOT` (pode vir depois do lançamento; o `AdSlot` fica oculto até lá).

## Self-Review

- **Cobertura da spec:** `SupportBlock` (Pix+Ko-fi) ✓ Task 2; `AdSlot` (AdSense gracioso) ✓ Task 3; posicionamento resultado ✓ Task 4 e `/sobre` ✓ Task 2; aviso de fan project ✓ Task 2; degradação graciosa ✓ (config vazia em todos); sem backend/dep nova além do AdSense sob demanda ✓; config centralizada ✓ Task 1.
- **Placeholders:** valores reais de Pix/Ko-fi/AdSense são *inputs de configuração* (documentados em "Pendências"), não placeholders de design — a UI degrada sozinha quando vazios.
- **Consistência de tipos:** `writeClipboard` mesma assinatura em todos os usos; nomes de constantes idênticos entre `support.ts` e os componentes; props `compact` consistente.
