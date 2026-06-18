<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import SupportBlock from '$lib/components/SupportBlock.svelte';

	const WA_NUMBER    = '5511955771210';
	const WA_URL       = `https://wa.me/${WA_NUMBER}?text=Ol%C3%A1%2C+vim+pelo+site+13+a+0!`;
	const LINKEDIN_URL = 'https://www.linkedin.com/in/marcelo-cortez-monteiro/';
	const INSTAGRAM_URL = 'https://www.instagram.com/jogo13a0/';
</script>

<Seo
	title="Contato — 13 a 0"
	description="Entre em contato para enviar feedback, reportar bugs ou anunciar no 13 a 0."
	path="/contato"
/>

<section>
	<p class="tag">Fale comigo</p>
	<h2>Contato</h2>

	<p class="intro">
		O 13 a 0 é feito por uma só pessoa, com carinho pela cena de CS. Se você jogou e quer deixar
		uma opinião, achou algum bug, ou tem interesse em anunciar no site — pode me chamar direto.
	</p>

	<div class="cards">
		<a class="card wa" href={WA_URL} target="_blank" rel="noopener noreferrer">
			<div class="card-icon">
				<!-- WhatsApp -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
				</svg>
			</div>
			<div class="card-body">
				<span class="card-label">WhatsApp</span>
				<span class="card-desc">Feedback, bugs ou parcerias — resposta mais rápida por aqui.</span>
			</div>
			<span class="card-arrow" aria-hidden="true">→</span>
		</a>

		<a class="card li" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
			<div class="card-icon">
				<!-- LinkedIn -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
				</svg>
			</div>
			<div class="card-body">
				<span class="card-label">LinkedIn</span>
				<span class="card-desc">Conheça meu trabalho ou conecte-se profissionalmente.</span>
			</div>
			<span class="card-arrow" aria-hidden="true">→</span>
		</a>

		<a class="card ig" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
			<div class="card-icon">
				<!-- Instagram -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
				</svg>
			</div>
			<div class="card-body">
				<span class="card-label">Instagram</span>
				<span class="card-desc">Acompanhe novidades e atualizações do jogo.</span>
			</div>
			<span class="card-arrow" aria-hidden="true">→</span>
		</a>
	</div>
</section>

<section>
	<h2>Apoie o projeto</h2>
	<SupportBlock />
</section>

<style>
	section {
		max-width: 34rem;
	}

	h2 {
		margin: 0.3rem 0 1.2rem;
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 5vw, 2.2rem);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text);
	}

	.intro {
		margin: 0 0 2rem;
		color: var(--muted);
		line-height: 1.65;
		font-size: 0.95rem;
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.1rem;
		text-decoration: none;
		background: linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		border-left: 3px solid var(--border-strong);
		color: var(--text);
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
		transition: border-color 0.15s, background 0.15s;
	}

	.card:hover {
		background: linear-gradient(180deg, var(--panel-3), var(--panel-2));
	}

	.card.wa {
		border-left-color: #25d366;
	}

	.card.wa:hover {
		border-color: color-mix(in srgb, #25d366 40%, var(--border));
		border-left-color: #25d366;
	}

	.card.li {
		border-left-color: #0a66c2;
	}

	.card.li:hover {
		border-color: color-mix(in srgb, #0a66c2 40%, var(--border));
		border-left-color: #0a66c2;
	}

	.card.ig {
		border-left-color: #e1306c;
	}

	.card.ig:hover {
		border-color: color-mix(in srgb, #e1306c 40%, var(--border));
		border-left-color: #e1306c;
	}

	.card-icon {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		flex-shrink: 0;
		background: var(--panel-3);
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.card.wa .card-icon { color: #25d366; }
	.card.li .card-icon { color: #0a66c2; }
	.card.ig .card-icon { color: #e1306c; }

	.card-icon svg {
		width: 1.3rem;
		height: 1.3rem;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
		min-width: 0;
	}

	.card-label {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.card.wa .card-label { color: #25d366; }
	.card.li .card-label { color: #5b9bd5; }
	.card.ig .card-label { color: #e1306c; }

	.card-desc {
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.4;
	}

	.card-arrow {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--muted);
		flex-shrink: 0;
		transition: transform 0.15s, color 0.15s;
	}

	.card:hover .card-arrow {
		transform: translateX(4px);
		color: var(--text);
	}
</style>
