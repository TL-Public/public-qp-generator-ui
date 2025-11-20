<script>
    import { goto } from "$app/navigation";
    import { authStore } from '$lib/stores/authStore';
    import { onMount } from 'svelte';

    onMount(() => {
        // If user is already authenticated, redirect to protected home
        if ($authStore.isAuthenticated) {
            goto('/');
        }
    });
</script>

<main class="min-h-screen bg-gray-50">
    <div class="bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="text-center">
                <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span class="block">Welcome to</span>
                    <span class="block text-blue-600">Smart QP</span>
                </h1>
                <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Please login to access the question paper management system.
                </p>
                <div class="mt-8 space-x-4">
                    <button
                        on:click={() => goto('/login')}
                        class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Login
                    </button>
                    <button
                        on:click={() => goto('/register')}
                        class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200"
                    >
                        Register
                    </button>
                </div>
            </div>
        </div>
    </div>
</main>