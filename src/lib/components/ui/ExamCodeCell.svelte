<script>
  export let data;
  export let onClick;

  function handleClick(e) {
    if (onClick) {
      onClick(data);
    }
  }
</script>

<button
  type="button"
  class="text-primary hover:text-primary-dark focus:outline-none focus:underline font-mono text-sm transition-colors duration-150"
  on:click={handleClick}
>
  {data.exam_code}
</button>
