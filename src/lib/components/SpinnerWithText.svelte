<script>
  export let size = "md"; // xs, sm, md, lg, xl
  export let variant = "primary"; // primary, secondary, danger, success
  export let message = ""; // Optional text message to display under the spinner
  export let orientation = "vertical"; // vertical or horizontal

  // Map sizes to Tailwind dimension classes
  const sizeClasses = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  // Map variants to Tailwind text color classes
  const variantClasses = {
    primary: "text-primary",
    secondary: "text-gray-500",
    danger: "text-red-600",
    success: "text-green-600"
  };
</script>

<div class="text-center py-6 flex {orientation === 'horizontal' ? 'flex-row items-center justify-center gap-2' : 'flex-col items-center justify-center'}">
  <svg
    class="animate-spin {sizeClasses[size] || sizeClasses['md']} {variantClasses[variant] || variantClasses['primary']}"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
  {#if message}
    <p class="text-gray-500 text-sm {orientation === 'vertical' ? 'mt-2' : ''}">{message}</p>
  {/if}
</div>
