<script>
    import { goto } from "$app/navigation";
    import RecentTableList from "$lib/components/ui/RecentTableList.svelte";
    import { authStore } from "$lib/stores/authStore.js";
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";

    const dispatch = createEventDispatcher();
    
    // Get correct data from auth store
    $: isAuthenticatedFromStore = $authStore.isAuthenticated;
    $: userNameFromStore = $authStore.username;
    $: roleCodeFromStore = $authStore.roleCode;
    $: roleFromStore = $authStore.roleName;
    $: userIdFromStore = $authStore.userId ; 

   
    // Admin check using correct authStore properties
    $: isAdmin = !!(isAuthenticatedFromStore && roleCodeFromStore === '100');

   // Filter features based on user role
    $: filteredFeatures = features.filter(feature => {
        // Show admin feature only to admins
        if (feature.route === '/admin') {
            return isAdmin;
        }
        // Show profile management only to authenticated users with userId
        if (feature.route?.includes('/updateProfile/')) {
            return isAuthenticatedFromStore && userIdFromStore;
        }
        // Show all other features to authenticated users
        return isAuthenticatedFromStore;
    });

    $: features = [
        {
            title: 'Create Question Paper',
            description: 'Generate high quality question paper',
            icon: '📝',
            route: '/create-paper',
        },
        {
            title: 'View Question Papers',
            description: 'Quickly find and access all your created question papers',
            icon: '🔍',
            route: '/questionPapers',
        },
        {
            title: 'Admin',
            description: 'Manage users and system settings',
            icon: '👑',
            route: '/admin',
        },
        {
          title: 'Manage Profile',
          description :'Update your profile',
          icon: '👤',
          route : `/updateProfile/${userIdFromStore}` ,
        },
        {
            title:'Quiz',
            description: 'Start the quiz',
            icon: '🧠',
            route :'/quiz'
        },
        
        
        
    ];

    // Mock stats data for the second widget
    $: stats = [
        { label: 'Total Exams', value: '91', icon: '📊' },
        { label: 'This Month', value: '12', icon: '📅' },
        { label: 'Published', value: '78', icon: '✅' },
        { label: 'Draft', value: '13', icon: '📝' },
    ];

    // Check authStore on mount
    onMount(() => {
        console.log('Home page mounted');
        console.log('AuthStore on mount:', $authStore);
        
        // If not authenticated, redirect to login
        if (!$authStore.isAuthenticated) {
            console.warn('User not authenticated, checking localStorage...');
            
            // Try to restore from localStorage
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                const user = localStorage.getItem('user');
                
                console.log('Token in localStorage:', !!token);
                console.log('User in localStorage:', !!user);
                
                if (!token) {
                    console.log('No token found, redirecting to login');
                    goto('/auth/login');
                }
            }
        }
    });

    function navigateTo(route) {
        // Additional auth check before navigation
        if (!isAuthenticatedFromStore && route !== '/auth/login') {
            console.warn('Not authenticated, redirecting to login');
            goto('/auth/login');
            return;
        }
        
        // Check admin access for admin route
        if (route === '/admin' && !isAdmin) {
            console.warn('Not authorized for admin access');
            alert('You do not have permission to access the admin panel.');
            return;
        }
        
        goto(route);
    }
</script>

<main class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 py-2 sm:py-4">
            <div class="text-center">
                <h1 class="text-2xl  tracking-tight font-extrabold text-gray-900">
                    <p class="leading-tight">
                        Welcome back, 
                        <span class="text-blue-600 block sm:inline">
                            {userNameFromStore || 'User'}
                        </span>
                    </p>
                </h1>
                <p class="mt-1 max-w-md mx-auto  text-lg md:mt-1  md:max-w-3xl text-gray-500">
                    {#if isAdmin}
                        Manage your exams and users with Smart QP
                    {:else}
                        Manage your exams with Smart QP
                    {/if}
                </p>
            </div>
        </div>
    </div>

    <!-- Authentication Warning -->
    {#if !isAuthenticatedFromStore}
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h4 class="text-sm font-medium text-red-800">Authentication Required</h4>
                        <p class="text-sm text-red-700 mt-1">Please log in to access your dashboard.</p>
                        <button 
                            on:click={() => goto('/auth/login')}
                            class="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Dashboard Content -->
    {#if isAuthenticatedFromStore}
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <!-- Dashboard Stats - Responsive layout -->
            <div class="mb-6 sm:mb-8">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard Stats</h2>
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <!-- Widget Header -
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 class="text-sm font-medium text-gray-900">Overview</h3>
                    </div>-->

                    <!-- Widget Content - Responsive grid -->
                    <div class="p-1 sm:p-1">
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                            {#each stats as stat}
                                <div class="p-3 sm:p-4 bg-gray-50 rounded-lg flex flex-row items-center justify-center">
                                    <div class="text-lg sm:text-2xl mr-3 sm:mr-4">{stat.icon}</div>
                                    <div class="flex flex-row items-baseline justify-center h-full">
                                        <div class="text-lg sm:text-2xl font-bold text-gray-900 mr-2">{stat.value}</div>
                                        <div class="text-xs sm:text-sm text-gray-500">{stat.label}</div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content - Responsive layout -->
            <div class="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
                <!-- Quick Actions - Stacks on mobile, sidebar on desktop -->
               <!-- <div class="lg:col-span-1">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 class="text-sm font-medium text-gray-900">Actions</h3>
                        </div>
                        <div class="p-2">
                            <!-- Mobile: Grid layout, Desktop: Vertical list 
                            <nav class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1 sm:gap-2 lg:gap-1">
                                {#each filteredFeatures as feature}
                                    <button
                                        on:click={() => navigateTo(feature.route)}
                                        class="w-full text-left px-3 py-3 rounded-md hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group border border-transparent"
                                    >
                                        <div class="flex items-start space-x-3">
                                            <span class="text-lg sm:text-xl flex-shrink-0">{feature.icon}</span>
                                            <div class="flex-1 min-w-0">
                                                <h3 class="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                                    {feature.title}
                                                </h3>
                                                <p class="text-xs text-gray-500 mt-1 leading-relaxed hidden sm:block lg:block">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                {/each}
                            </nav>
                        </div>
                    </div>
                </div>-->
                
                <!-- Recent Exams Widget - Full width on mobile, 3/4 on desktop -->
                <div class="lg:col-span-4">
                    <!--<h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Exams</h2>-->
                    <RecentTableList />
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="mt-6 sm:mt-8">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 class="text-sm font-medium text-gray-900">Recent Activity</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-3">
                            <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-sm">
                                <div class="flex items-center space-x-3">
                                    <div class="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                                    <span class="text-gray-600">Exam "Social Science 1" was published</span>
                                </div>
                                <span class="text-gray-400 text-xs sm:text-sm ml-5 sm:ml-0">2 hours ago</span>
                            </div>
                            <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-sm">
                                <div class="flex items-center space-x-3">
                                    <div class="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                                    <span class="text-gray-600">New quiz created for Class 10</span>
                                </div>
                                <span class="text-gray-400 text-xs sm:text-sm ml-5 sm:ml-0">4 hours ago</span>
                            </div>
                            <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-sm">
                                <div class="flex items-center space-x-3">
                                    <div class="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                                    <span class="text-gray-600">Profile updated successfully</span>
                                </div>
                                <span class="text-gray-400 text-xs sm:text-sm ml-5 sm:ml-0">1 day ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</main>