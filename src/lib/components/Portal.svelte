<script>
	import { onMount, onDestroy } from 'svelte';

	let slotContainer;
	let container;

	onMount(() => {
		if (typeof window !== 'undefined' && slotContainer) {
			container = document.querySelector('#portal-root') || document.body;
			if (container) {
				container.appendChild(slotContainer);
			}
		}
	});

	onDestroy(() => {
		if (container && slotContainer) {
			slotContainer.remove();
		}
	});
</script>

<div bind:this={slotContainer} class="contents">
	<slot />
</div>

