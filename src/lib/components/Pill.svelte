<script>
  export let variant = "primary"; // primary, secondary, tertiary, danger, success, warning
  export let size = "md"; // sm, md, lg
  export let customClass = ""; // user-provided custom styles
  export let label = ""; // Fallback content if slot is empty

  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-150";

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const variantStyles = {
    primary: "bg-blue-100 text-blue-800 border border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border border-gray-200",
    tertiary: "bg-slate-100 text-slate-700 border border-slate-200",
    danger: "bg-red-100 text-red-800 border border-red-200",
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  };
</script>

<span
  class="{baseStyles} {sizeStyles[size] || sizeStyles['md']} {variantStyles[variant] || variantStyles['primary']} {customClass}"
  {...$$restProps}
>
  <slot>{@html label}</slot>
</span>
