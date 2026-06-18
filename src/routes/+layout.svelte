<!-- <script>
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
    <main class="ml-64 min-h-screen bg-gray-50">
      <div class="p-6">
        <slot />
      </div>
    </main>
  {:else}
    <main class="min-h-screen bg-gray-50">
      <slot />
    </main>
  {/if}
  <Footer />
</div> -->

<script>
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import Footer from '$lib/components/Footer.svelte';
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/authStore";
  import Sidebar from "$lib/components/Sidebar.svelte";
  // import Header2 from "$lib/components/reusable/Header2.svelte";
  import BreadCrumbs from "$lib/components/BreadCrumbs.svelte";
  import {onMount} from 'svelte'
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
    School,
    Landmark,
    Building2,
    Database,
    BookMarked,
    BookOpen,
    Upload, 
    Layers2 ,
    BookA,
    Notebook,
  } from "@lucide/svelte";
  // import { PUBLIC_APP_NAME } from "$env/static/public";
  import { checkSidebarRules } from "$lib/utils/helper.js";
  // import { injectGAHead } from '$lib/utils/helper.js';

  export let data;

  $: isAuthenticated = data?.session?.isAuthenticated;

  let title;

    // Routes where padding should be removed
  const noPaddingRoutes = ["/quiz/:exam_code/attempt","/exams/:exam_code/attempt"];

  // Routes where breadcrumbs should be hidden
  const hideBreadcrumbsRoutes = ["/forgot-password", "/quiz/:exam_code/attempt", "/exams/:exam_code/attempt","/login"];

  $: sidebarList = [
    { name: "Dashboard", link: "/home", key: "DASHBOARD", icon: Home },
   

    {
    name: "Create Paper",
    link: "/create-paper",
    key: "CREATE_PAPER",
    icon: FilePlus,
  },
    { name: "View Papers", link: "/questionPapers", key: "VIEW_PAPERS", icon: Search },
     { name: "Users", link: "/admin", key: "USERS", icon: Users },

    //  {
    //   name: "Masterdata",
    //   link: "#",
    //   key: "MASTERDATA",
    //   icon: Database,
    //   children: [
    //     {
    //       name: "Mediums",
    //       link: "/masterdata/mediums",
    //       key: "MEDIUM",
    //       icon: BookA,
    //     },
    //     {
    //       name: "Subjects",
    //       link: "/masterdata/subjects",
    //       key: "SUBJECT",
    //       icon: Notebook,
    //     },
    //   ],
    // },

    {
      name: "My Profile",
      link: $authStore?.userId ? `/updateProfile/${$authStore.userId}` : "/home",
      key: "PROFILE",
      icon: User,
    },
  ];

  const excludedRoutes = ["/questionPapers", "/create-paper"];


  const staticRouteTitles = {
    "/home": "Dashboard",
    "/create-paper": "Create Paper",
    "/papers": "Regions",
    "/schools": "Schools",
    "/users": "Users",
    // "/quiz": "Quizzes",
    "/exams": "Exams",
    "/questions": "Questions",
    "/uploadHistory": "Upload History",
    "/masterdata/medium": "Mediums",
    "/masterdata/subjects": "Subjects",
  };

  $: {
    const path = $page.url.pathname;
    if (Object.keys(staticRouteTitles).includes(path)) {
      title = `Smart QP | ${staticRouteTitles[path] || ""}`;
    } else if ($page.data.pageTitle) {
      // title = $page.data.pageTitle;
      title = `Smart QP | ${$page.data.pageTitle || ""}`;
    }
  }

  // Developer only defines simple rules here:
  const sidebarHideRules = [
    { route: "/" },
    { route: "/login" },
    { route: "/exams/:exam_code/attempt" },
    // Add more rules as needed
    // format is as below. if query params are present, add as below
    // { route: '/quiz/:exam_code/attempt', query: { step: 'running' } },
  ];

  



  function checkNoPaddingRules(routes, currentUrl) {
    const currentPath = currentUrl.pathname;

    return routes.some((route) => {
      // Convert route pattern to regex
      const pattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    });
  }

  function checkHideBreadcrumbsRules(routes, currentUrl) {
    const currentPath = currentUrl.pathname;

    return routes.some((route) => {
      // Convert route pattern to regex
      const pattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    });
  }
  
  $: hidesidebar = checkSidebarRules(sidebarHideRules, $page.url);

  $: removePadding = checkNoPaddingRules(noPaddingRoutes, $page.url);

  $: hideBreadcrumbs = checkHideBreadcrumbsRules(hideBreadcrumbsRoutes, $page.url);



  $: filteredSidebarList = (() => {
       return sidebarList;
  
  })();




</script>

<svelte:head>
  <title>{title ?? "Smart QP"}</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
  <div class="md:hidden">
    <Header sidebarList={filteredSidebarList} isLoggedIn={isAuthenticated} />
  </div>

  <div class="flex-1 flex flex-row min-h-0">
    {#if !hidesidebar}
      <Sidebar sidebarList={filteredSidebarList} />
    {/if}
    <main
      class={removePadding
        ? "flex-1 min-w-0 bg-gray-50 min-h-screen"
        : "flex-1 min-w-0 bg-gray-50 p-4 pt-20 md:pt-4 px-8 min-h-screen"}
    >
    {#if !hideBreadcrumbs}
      <div class="mb-4 md:mb-8">
        <BreadCrumbs
          route={$page.route.id}
          params={$page.params}
          searchParams={$page.url.searchParams.toString()}
        />
      </div>
    {/if}
      <slot></slot>
    </main>
  </div>

  <Footer />
</div>
