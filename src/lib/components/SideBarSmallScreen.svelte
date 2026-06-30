<script>
  import { createEventDispatcher } from "svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/authStore";
  import {
    handleLogout,
    handleViewProfile,
  } from "$lib/components/Sidebar.svelte";
  import { X, ChevronDown, ChevronRight, LogOut } from "@lucide/svelte";

  export let show = false;
  export let sidebarList = [];

  const dispatch = createEventDispatcher();
  $: route = $page.url.pathname;

  let expandedItems = new Set();

  function close() {
    dispatch("close");
  }

  function compareRouteBase(route1, route2) {
    if (!route1 || !route2) return false;
    route1 = route1.slice(1).split("/");
    route2 = route2.slice(1).split("/");
    return route1[0] === route2[0];
  }

  function isExactRouteMatch(route1, route2) {
    const normalizedRoute1 = route1?.replace(/^\/+|\/+$/g, "") || "";
    const normalizedRoute2 = route2?.replace(/^\/+|\/+$/g, "") || "";
    return normalizedRoute1 === normalizedRoute2;
  }

  function isChildRouteActive(item) {
    if (!item.children) return false;
    return item.children.some((child) => isExactRouteMatch(child.link, route));
  }

  function toggleExpand(itemKey) {
    if (expandedItems.has(itemKey)) {
      expandedItems.delete(itemKey);
    } else {
      expandedItems.add(itemKey);
    }
    expandedItems = expandedItems;
  }

  $: if (route && sidebarList) {
    const newExpandedItems = new Set();
    sidebarList.forEach((item) => {
      if (item.children && isChildRouteActive(item)) {
        newExpandedItems.add(item.key);
      }
    });
    expandedItems = newExpandedItems;
  }
</script>

{#if show}
  <!-- Backdrop Overlay -->
  <div
    class="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50"
    on:click={close}
    on:keydown={(e) => e.key === "Escape" && close()}
    role="button"
    tabindex="0"
    aria-label="Close menu backdrop"
    transition:fade={{ duration: 200 }}
  ></div>

  <!-- Sidebar Panel -->
  <aside
    class="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-800 text-white shadow-2xl z-50 flex flex-col"
    transition:fly={{ x: -320, duration: 300 }}
  >
    <!-- Header/Close -->
    <div
      class="px-6 py-5 border-b border-slate-700 flex items-center justify-between"
    >
      <a href="/home" class="flex items-center space-x-3" on:click={close}>
        <div
          class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"
        >
          {#if sidebarList[0]?.icon}
            <svelte:component
              this={sidebarList[0].icon}
              size={20}
              class="text-white"
            />
          {/if}
        </div>
        <span class="text-xl font-bold text-white">Smart QP</span>
      </a>
      <button
        type="button"
        on:click={close}
        class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        aria-label="Close navigation menu"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Navigation Scrollable Panel -->
    <nav class="flex-1 overflow-y-auto p-4">
      <ul class="space-y-2">
        {#each sidebarList as item, index (index)}
          {#if item.children && item.children.length > 0}
            <!-- Collapsible Parent -->
            <li>
              <button
                on:click={() => toggleExpand(item.key)}
                class="flex items-center gap-3 w-full p-3 rounded-lg font-medium text-sm transition-all duration-200 {isChildRouteActive(
                  item,
                )
                  ? 'text-indigo-400'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
              >
                <svelte:component this={item.icon} size={18} class="shrink-0" />
                <span class="flex-1 text-left">{item.name}</span>
                <svelte:component
                  this={expandedItems.has(item.key)
                    ? ChevronDown
                    : ChevronRight}
                  size={16}
                  class="shrink-0 transition-transform duration-300"
                />
              </button>
              {#if expandedItems.has(item.key)}
                <ul
                  class="ml-6 mt-1 space-y-1"
                  transition:slide={{ duration: 300 }}
                >
                  {#each item.children as child}
                    <li>
                      <a
                        href={child.link}
                        on:click={close}
                        class="flex items-center gap-3 p-2.5 rounded-md text-sm transition-colors {isExactRouteMatch(
                          child.link,
                          route,
                        )
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-400 hover:bg-slate-700 hover:text-white'}"
                      >
                        <svelte:component
                          this={child.icon}
                          size={16}
                          class="shrink-0"
                        />
                        <span>{child.name}</span>
                      </a>
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {:else}
            <!-- Regular menu item -->
            <li>
              <a
                href={item.link}
                on:click={close}
                class="flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all duration-200 {compareRouteBase(
                  item.link,
                  route,
                )
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
              >
                <svelte:component this={item.icon} size={18} class="shrink-0" />
                <span>{item.name}</span>
              </a>
            </li>
          {/if}
        {/each}
      </ul>
    </nav>

    <!-- User Profile & Action Footer -->
    <div class="p-4 border-t border-slate-700 bg-slate-900/30">
      <button
        on:click={() => {
          handleViewProfile();
          close();
        }}
        class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
      >
        <img
          src="https://ui-avatars.com/api/?name={$authStore?.userName ||
            'User'}&background=6366f1&color=ffffff"
          alt="User Avatar"
          class="h-9 w-9 rounded-full ring-2 ring-slate-600"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white truncate">
            {$authStore?.userName || "-"}
          </div>
          <div class="text-xs text-slate-400 truncate">
            {$authStore?.roleName || "-"}
          </div>
        </div>
      </button>

      <!-- Logout Button -->
      <button
        on:click={() => {
          handleLogout();
          close();
        }}
        class="w-full flex items-center space-x-3 px-3 py-2.5 mt-2 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors text-left"
      >
        <LogOut size={18} class="shrink-0" />
        <span class="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  </aside>
{/if}
