<script>
  import { api } from '$lib/utils/api';
  import { goto } from '$app/navigation';

  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let roleCode = '101'; // Default to teacher role
  let error = null;
  let loading = false;

  const roles = [
    { code: '100', name: 'Admin' },
    { code: '101', name: 'Teacher' }
  ];

  async function handleSubmit(event) {
    event.preventDefault();
    loading = true;
    error = null;

    // Validate passwords match
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      loading = false;
      return;
    }

    try {
      const response = await api.auth.register({
        username,
        // email,
        password,
        role_code: roleCode
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Registration successful
      console.log('Registration successful:', response.data);
      
      // Redirect to login page
      goto('/login');
      
    } catch (err) {
      error = err.message;
      console.error('Registration error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-md">
    <!-- Logo/Header Section -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Hello! Register to get started</h1>
      <p class="text-gray-600">Create your new account</p>
    </div>

    <!-- Registration Form -->
    <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <form on:submit={handleSubmit} class="space-y-6">
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-xl p-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm text-red-700">{error}</span>
            </div>
          </div>
        {/if}

        <!-- Username Input -->
        <div class="space-y-2">
          <label for="username" class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              id="username"
              name="username"
              type="text"
              required
              bind:value={username}
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter your username"
            />
          </div>
        </div>

        <!-- Email Input -->
        <!-- <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              bind:value={email}
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter your email"
            />
          </div>
        </div> -->

        <!-- Password Input -->
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              bind:value={password}
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <!-- Confirm Password Input -->
        <div class="space-y-2">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              bind:value={confirmPassword}
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white
                {confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}"
              placeholder="Confirm your password"
            />
          </div>
          {#if confirmPassword && password !== confirmPassword}
            <p class="text-sm text-red-600 mt-1">Passwords do not match</p>
          {/if}
        </div>

        <!-- Role Selection -->
        <!-- <div class="space-y-2">
          <label for="role" class="block text-sm font-medium text-gray-700">
            Role
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <select
              id="role"
              name="role"
              required
              bind:value={roleCode}
              class="block w-full pl-10 pr-8 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
            >
              {#each roles as role}
                <option value={role.code}>{role.name}</option>
              {/each}
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div> -->

        <!-- Register Button -->
        <button
          type="submit"
          disabled={loading || (confirmPassword && password !== confirmPassword)}
          class="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Creating account...
          {:else}
            Register
          {/if}
        </button>
      </form>

      <!-- Login Link -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600">
          Already have an account? 
          <a href="/login" class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
            Login Now
          </a>
        </p>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="mt-8 text-center">
      <p class="text-xs text-gray-500">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  </div>
</div>