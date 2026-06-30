<script>
  import { authStore } from "$lib/stores/authStore";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Menu, BookOpen } from "@lucide/svelte";
  import SideBarSmallScreen from "$lib/components/SideBarSmallScreen.svelte";

  export let sidebarList = [];
  export let isLoggedIn = false;

  // Use the store value directly

  $: currentPath = $page.url.pathname;

  let isMobileMenuOpen = false;

  async function handleLogout() {
    await authStore.logout();
    goto("/login");
  }
</script>

{#if isLoggedIn}
  <header
    class="bg-slate-800 text-white shadow-md flex items-center justify-between px-4 py-3 z-40 sticky top-0"
  >
    <div class="flex items-center space-x-3">
      <!-- Mobile menu button -->
      <button
        type="button"
        on:click={() => (isMobileMenuOpen = true)}
        class="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      <!-- Logo and App Name -->
      <a href="/home" class="flex items-center space-x-2">
        <div
          class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"
        >
          <BookOpen size={18} />
        </div>
        <span class="text-lg font-bold">Smart QP</span>
      </a>
    </div>

    <!-- Profile Avatar shortcut -->
    <a href="/myProfile" class="flex items-center">
      <img
        src="https://ui-avatars.com/api/?name={$authStore?.userName ||
          'User'}&background=6366f1&color=ffffff"
        alt="User Profile"
        class="h-8 w-8 rounded-full ring-2 ring-slate-600"
      />
    </a>
  </header>

  <!-- SideBarSmallScreen mounting -->
  <SideBarSmallScreen
    show={isMobileMenuOpen}
    {sidebarList}
    on:close={() => (isMobileMenuOpen = false)}
  />
{/if}
