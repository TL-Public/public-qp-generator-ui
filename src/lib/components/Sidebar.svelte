<script context="module">
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import { authStore } from "$lib/stores/authStore";

  export function handleViewProfile() {
    const userId = get(authStore)?.userId;
    goto(userId ? `/myProfile/${userId}` : "/home");
  }

  export async function handleLogout() {
    try {
      const res = await fetch("/apis/logout", { method: "POST" });
      if (res.ok) {
        authStore.set({});
        await goto("/login", { invalidateAll: true });
      } else {
        alert("Logout failed.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed.");
    }
  }
</script>

<script>
  import {
    Home,
    FileText,
    HelpCircle,
    Search,
    Users,
    User,
    History,
    FilePlus,
    LogOut,
    ChevronDown,
    ChevronRight,
  } from "@lucide/svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  // import { roles } from "$lib/config.js";

  // import { roles } from '$lib/config.js';
  // import { userDetails } from '/src/routes/store.js';
  // import { menuItems, rolesWithCentreDetailsLabel, rolesWithStateDetailsLabel } from '$lib/data.js';
  export let sidebarList = [];
  $: route = $page.url.pathname;

  let filteredSidebarList = [];
  let expandedItems = new Set();

  // this function checks which of the side bar is currently active
  function compareRouteBase(route1, route2) {
    // remove '/' from the front
    route1 = route1?.slice(1);
    route2 = route2?.slice(1);

    // separeate all using the '/'
    route1 = route1?.split("/");
    route2 = route2?.split("/");

    // compair the first of each array to check if they are same then base route is same
    if (route1?.[0] == route2?.[0]) {
      return true;
    }
    return false;
  }

  // Exact route match for nested items (more precise than compareRouteBase)
  function isExactRouteMatch(route1, route2) {
    // Normalize routes by removing leading/trailing slashes
    const normalizedRoute1 = route1?.replace(/^\/+|\/+$/g, "") || "";
    const normalizedRoute2 = route2?.replace(/^\/+|\/+$/g, "") || "";

    // Exact match comparison
    return normalizedRoute1 === normalizedRoute2;
  }

  // Check if a nested child route is active
  function isChildRouteActive(item) {
    if (!item.children) return false;
    return item.children.some((child) => isExactRouteMatch(child.link, route));
  }

  // Check if item itself is active (NOT its children - parent should not be highlighted when child is active)
  function isItemActive(item) {
    // Only return true if the item's own link matches, not if children match
    // For parent items with children, we don't want to highlight them when a child is active
    if (item.children && item.children.length > 0) {
      // For parent items, only highlight if the parent link itself matches
      // Since parent items usually have link="#", this will be false
      return compareRouteBase(item.link, route) && item.link !== "#";
    }
    // For regular items without children, check normally
    return compareRouteBase(item.link, route);
  }

  // Toggle expand/collapse for nested items
  function toggleExpand(itemKey) {
    if (expandedItems.has(itemKey)) {
      expandedItems.delete(itemKey);
    } else {
      expandedItems.add(itemKey);
    }
    expandedItems = expandedItems; // Trigger reactivity
  }

  async function handleLogout() {
    await authStore.logout();
    goto("/login");
  }

  // Auto-expand if child route is active, and auto-collapse when navigating away
  // Explicitly depend on route to ensure it runs when route changes
  $: if (route && filteredSidebarList) {
    const newExpandedItems = new Set();
    filteredSidebarList.forEach((item) => {
      if (item.children && isChildRouteActive(item)) {
        // Only expand if a child is currently active
        newExpandedItems.add(item.key);
      }
    });
    // Update expandedItems to match current route state (this will collapse items when navigating away)
    expandedItems = newExpandedItems;
  }

  let sidebarOpen = false;
  function toogleMenu() {
    sidebarOpen = !sidebarOpen;
  }

  // handleLogout is now imported from context=module
  // -------------------{--------------- Role based functions --------------------------------
  function roleBasedAcessSetting() {
    // Filter the sidebar list by checking if the item's key is not in the restrictedMenuList
    // commented out since there are no rbac implemented in smart qp
    // filteredSidebarList = sidebarList?.filter((item) => {
    //   // Only include items that are NOT in the restricted menu list
    //   return !roles[$authStore?.roleCode]?.restrictedMenuList?.includes(
    //     item?.key?.toLowerCase()?.trim()
    //   );
    // });
    filteredSidebarList = sidebarList;
  }

  onMount(() => {
    const unsubscribe = authStore?.subscribe((user) => {
      if (user && Object.keys(user)?.length > 0) {
        roleBasedAcessSetting(user);
      } else {
        filteredSidebarList = sidebarList;
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  });
</script>

<aside
  class="w-1/5 min-w-60 p-4 border-r border-gray-50 md:block hidden bg-slate-800 text-white shadow-xl"
>
  <div class="px-6 py-4 border-b border-slate-700 mb-4">
    <a href="/home" class="flex items-center space-x-3">
      <div
        class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"
      >
        <FileText size={20} class="text-white" />
      </div>
      <div>
        <div class="text-xl font-bold text-white">Smart QP</div>
      </div>
    </a>
  </div>

  {#each filteredSidebarList as item, index (index)}
    {#if item.children && item.children.length > 0}
      <!-- Nested menu item -->
      <div class="mb-2">
        <div
          class="p-2 rounded-md font-medium text-primary text-sm 2xl:text-base {isItemActive(
            item,
          )
            ? 'bg-indigo-600 text-white hover:none'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
        >
          <button
            on:click={() => toggleExpand(item.key)}
            class="flex items-center gap-3 w-full cursor-pointer"
          >
            <svelte:component this={item.icon} size={18} class="shrink-0" />
            <h3 class="text-base leading-none flex-1 text-left">{item.name}</h3>
            <svelte:component
              this={expandedItems.has(item.key) ? ChevronDown : ChevronRight}
              size={16}
              class="shrink-0 chevron-icon transition-transform duration-300 {expandedItems.has(
                item.key,
              )
                ? 'rotate-0'
                : ''}"
            />
          </button>
        </div>
        {#if expandedItems.has(item.key)}
          <div
            class="ml-4 mt-1 space-y-1 nested-menu"
            transition:slide={{ duration: 300 }}
          >
            {#each item.children as child}
              <a
                href={child.link}
                class="flex items-center gap-3 p-2 rounded-md text-sm nested-item {isExactRouteMatch(
                  child.link,
                  route,
                )
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'}"
              >
                <svelte:component
                  this={child.icon}
                  size={16}
                  class="shrink-0"
                />
                <span class="text-sm leading-none">{child.name}</span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Regular menu item -->
      <div
        aria-current={compareRouteBase(item.link, route) ? "page" : undefined}
        class="p-2 rounded-md font-medium mb-2 text-primary text-sm 2xl:text-base {compareRouteBase(
          item.link,
          route,
        )
          ? 'bg-indigo-600 text-white hover:none'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
      >
        <a href={item.link} class="flex items-center gap-3 w-full">
          <svelte:component this={item.icon} size={18} class="shrink-0" />
          <h3 class="text-base leading-none">{item.name}</h3>
        </a>
      </div>
    {/if}
  {/each}

  <div class="p-4 border-t border-slate-700 mt-4">
    <button on:click={handleViewProfile} class="cursor-pointer">
      <div class="flex items-center space-x-3 px-4 py-3">
        <div
          class="h-10 w-10 rounded-full ring-2 ring-slate-600 bg-slate-700 flex items-center justify-center"
        >
          <User size={20} class="text-indigo-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white truncate">
            {$authStore?.userName || "-"}
          </p>
          <span class="text-xs font-medium text-slate-400 truncate"
            >{$authStore?.roleName || "-"}</span
          >
        </div>
      </div>
    </button>

    <button
      on:click={handleLogout}
      class="w-full flex items-center space-x-3 px-4 py-2 mt-2 text-slate-300 hover:bg-red-400 hover:text-white rounded-lg transition-all duration-200"
    >
      <svelte:component this={LogOut} size={18} />
      <span class="font-medium text-sm">Sign Out</span>
    </button>
  </div>
</aside>

<style>
  .nested-menu {
    overflow: hidden;
  }

  .nested-item {
    animation: slideIn 0.6s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .chevron-icon {
    transition: transform 0.3s ease;
  }
</style>
