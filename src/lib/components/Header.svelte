<script>
    import { authStore } from '$lib/stores/authStore';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    // Use the store value directly
    $: isAuthenticated = $authStore.isAuthenticated;
    $: currentPath = $page.url.pathname;

    async function handleLogout() {
      await authStore.logout();
      goto('/login');
    }

    // Check if a route is active
    function isActiveRoute(route) {
      return currentPath === route || currentPath.startsWith(route + '/');
    }
</script>

{#if isAuthenticated}
  <!-- Vertical Sidebar -->
  <aside class="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white shadow-xl z-50">
    <!-- Header/Logo Section -->
    <div class="p-6 border-b border-slate-700">
      <a href="/home" class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <div class="text-xl font-bold text-white">SmartQP</div>
          <div class="text-xs text-slate-400">Question Paper System</div>
        </div>
      </a>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        <!-- Dashboard -->
        <li>
          <a 
            href="/home" 
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute('/home') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
            </svg>
            <span class="font-medium">Dashboard</span>
          </a>
        </li>
        <!-- View Papers -->
        <li>
          <a 
            href="/questionPapers" 
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute('/questionPapers') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m-5-8h8m-8 4h8m-7-8h8m-8 8h8M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            <span class="font-medium">View Papers</span>
          </a>
        </li>
        <!-- Create Paper -->
        <li>
          <a 
            href="/create-paper" 
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute('/create-paper') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="font-medium">Create Paper</span>
          </a>
        </li>

      

        <!-- Create Quiz -->
        <!-- <li>
          <a 
            href="/quiz" 
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute('/quiz') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-medium">Create Quiz</span>
          </a>
        </li> -->

     

        <!-- Users/Admin -->
        <li>
          <a 
            href="/admin" 
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute('/admin') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span class="font-medium">Users</span>
          </a>
        </li>

        <!-- Profile -->
        <li>
          <a 
            href="/updateProfile/[id]" 
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute('/updateProfile') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="font-medium">Profile</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- User Section at Bottom -->
    <div class="p-4 border-t border-slate-700">
      <div class="flex items-center space-x-3 px-4 py-3">
        <img
          src="https://ui-avatars.com/api/?name=User&background=6366f1&color=ffffff"
          alt="User Avatar"
          class="h-10 w-10 rounded-full ring-2 ring-slate-600"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white truncate">admin</div>
          <div class="text-xs text-slate-400 truncate">admin@example.com</div>
        </div>
      </div>
      
      <!-- Logout Button -->
      <button
        on:click={handleLogout}
        class="w-full flex items-center space-x-3 px-4 py-2 mt-2 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="font-medium">Sign Out</span>
      </button>
    </div>
  </aside>

  <!-- Main Content Spacer -->
  <div class="ml-64">
    <!-- This div pushes main content to the right of the sidebar -->
  </div>

  
{/if}