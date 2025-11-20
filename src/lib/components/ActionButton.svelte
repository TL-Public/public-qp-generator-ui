<script>
  export let icon = '';
  export let label = '';
  export let variant = 'default'; // 'default' or 'danger'
</script>

<button class="inline-flex items-center {variant === 'danger' ? 'text-red-600 hover:text-red-800' : 'text-gray-600 hover:text-gray-800'}">
  <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {@html icon}
  </svg>
  {label}
</button>