<script>

	let {
		checked = $bindable(false),
		onToggle,
		disabled = false,
		size = 'sm',
		variant = 'secondary',
		ariaLabel = 'Toggle'
	} = $props();

	const trackColorOn = $derived(variant === 'secondary' ? 'bg-dark' : 'bg-primary');

	function handleClick() {
		if (disabled) return;
		const next = !checked;
		checked = next;
		onToggle?.(next);
	}

	function handleKeydown(e) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleClick();
		}
	}

	const sizeConfig = $derived(
		({
			sm: {
				track: 'w-9 h-5',
				handle: 'size-4',
				translateOn: 'translate-x-4'
			},
			md: {
				track: 'w-11 h-6',
				handle: 'size-5',
				translateOn: 'translate-x-5'
			}
		})[size] ?? {
			track: 'w-11 h-6',
			handle: 'size-5',
			translateOn: 'translate-x-5'
		}
	);
</script>

<button
	role="switch"
	type="button"
	aria-checked={checked}
	aria-label={ariaLabel}
	disabled={disabled}
	class="
		relative inline-flex shrink-0 cursor-pointer rounded-full
		transition duration-(--motion-fast) ease-(--ease-standard)
		focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
		disabled:cursor-not-allowed disabled:opacity-50
		{sizeConfig.track}
		{checked ? trackColorOn : 'bg-stroke'}
	"
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<span
		class="
			absolute top-0.5 left-0.5 rounded-full bg-canvas-base-fixed shadow-sm
			transition-transform duration-(--motion-fast) ease-(--ease-standard)
			{sizeConfig.handle}
			{checked ? sizeConfig.translateOn : 'translate-x-0'}
		"
	></span>
</button>
