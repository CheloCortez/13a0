<script lang="ts">
	import { base } from '$app/paths';

	const KEY = '13a0:cookies-ok';
	let visible = $state(false);

	// Só decide depois da hidratação (não roda na prerenderização).
	$effect(() => {
		try {
			if (localStorage.getItem(KEY) !== '1') visible = true;
		} catch {
			// Sem acesso a localStorage: não insiste no aviso.
		}
	});

	function accept() {
		visible = false;
		try {
			localStorage.setItem(KEY, '1');
		} catch {
			// Ignora: o aviso só reaparece numa próxima visita, sem quebrar nada.
		}
	}
</script>

{#if visible}
	<div class="cookie" role="region" aria-label="Aviso de cookies">
		<p>
			Usamos armazenamento local e cookies para o funcionamento do jogo, métricas de uso e
			anúncios. Veja a <a href="{base}/privacidade">política de privacidade</a>.
		</p>
		<button class="btn" onclick={accept}>Entendi</button>
	</div>
{/if}

<style>
	.cookie {
		position: fixed;
		left: 50%;
		bottom: 0.9rem;
		transform: translateX(-50%);
		z-index: 50;
		width: min(700px, calc(100vw - 1.4rem));
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.7rem 0.9rem;
		background: var(--panel);
		border: 1px solid var(--border-strong);
		border-top: 2px solid var(--accent);
		box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.85);
	}

	.cookie p {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.4;
		color: var(--muted);
	}

	.cookie a {
		color: var(--accent-bright);
	}

	.cookie .btn {
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.cookie {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
		}
	}
</style>
