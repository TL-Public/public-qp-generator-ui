<script>
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/authStore';

  // Check if current route is in the protected group
  $: isProtectedRoute = $page.url.pathname.startsWith('/dashboard') || 
                       $page.url.pathname.startsWith('/create-paper') ||
                       $page.url.pathname.startsWith('/papers');

  $: isAuthenticated = $authStore.isAuthenticated;
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-between">
  {#if !isProtectedRoute || isAuthenticated}
    <Header {isProtectedRoute} />
  {/if}
  {#if isAuthenticated}
    <!-- Main content with sidebar spacing -->
    <main class="ml-64 min-h-screen bg-gray-50">
      <div class="p-6">
        <slot />
      </div>
    </main>
  {:else}
    <!-- Full width for public pages -->
    <main class="min-h-screen bg-gray-50">
      <slot />
    </main>
  {/if}
  <Footer />
</div>