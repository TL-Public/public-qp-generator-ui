<script>
  import { goto } from "$app/navigation";

  const features = [
    {
      title: "Create Question Paper",
      description: "Generate high quality question paper",
      icon: "📝",
      route: "/create-paper",
    },
    // {
    //     title : 'Edit Question paper',
    //     description:  'Review, modify and manage your existing paper with our editor',
    //     icon: '✏️',
    //     route:'/edit'  ,
    // },
    {
      title: "View Question Papers",
      description: "Quickly find and access all your created question papers ",
      icon: "🔍",
      route: "/questionPapers",
    },
  ];

  function navigateTo(route) {
    goto(route);
  }
</script>

<main class="min-h-screen bg-gray-50">
  <!-- Hero Section -->
  <div class="bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center">
        <h1
          class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
        >
          <span class="block">Manage your exams with</span>
          <span class="block text-primary">Smart QP</span>
        </h1>
        <p
          class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
        >
          Automate question creation and generate high-quality,
          curriculum-aligned questions in seconds.
        </p>
      </div>
    </div>
  </div>

  <!-- Features Grid -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
      {#each features as feature}
        <button
          on:click={() => navigateTo(feature.route)}
          class="relative group bg-white p-6 focus:outline-none rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div>
            <span class="text-4xl">{feature.icon}</span>
            <h3
              class="mt-4 text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors"
            >
              {feature.title}
            </h3>
            <p class="mt-2 text-gray-500">
              {feature.description}
            </p>
          </div>
          <span
            class="absolute bottom-4 right-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden="true"
          >
            →
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- How it Works Section -->
  <div class="bg-white py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          How Smart Q Works
        </h2>
        <p class="mt-4 text-lg text-gray-500">
          Three simple steps to transform your content into high-quality
          assessment questions
        </p>
      </div>

      <div class="mt-16">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <!-- Step 1 -->
          <div class="relative">
            <div
              class="absolute flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xl font-bold -left-2"
            >
              1
            </div>
            <div class="pl-16">
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Create question paper
              </h3>
              <p class="text-gray-500">Setup your question paper</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative">
            <div
              class="absolute flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xl font-bold -left-2"
            >
              2
            </div>
            <div class="pl-16">
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Review the question paper
              </h3>
              <p class="text-gray-500">
                Review the settings of your question paper.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative">
            <div
              class="absolute flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xl font-bold -left-2"
            >
              3
            </div>
            <div class="pl-16">
              <h3 class="text-xl font-bold text-gray-900 mb-4">
                Generate question paper
              </h3>
              <p class="text-gray-500">
                Generate the question paper of your preferred settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Call to Action -->
  <div class="bg-primary mt-12">
    <div class="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        <span class="block">Ready to transform your assessment process?</span>
      </h2>
      <p class="mt-4 text-lg leading-6 text-blue-100">
        Join thousands of educators who are saving time and creating better
        assessments.
      </p>
      <button
        on:click={() => navigateTo("/(protected)/create-paper")}
        class="mt-8 w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-blue-50 transition-colors"
      >
        Get Started
      </button>
    </div>
  </div>
</main>
