<script>
    import { authStore } from '$lib/stores/authStore';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {    
        if (!$authStore.isAuthenticated) {
            goto('/login');
        }
    });
</script>

{#if $authStore.isAuthenticated}
    <slot />
{/if}