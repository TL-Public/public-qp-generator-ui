<script>
  export let data;
  export let onClick;

  function handleClick(e) {
    if (onClick) {
      onClick(data);
    }
  }
</script>

<div class="word-wrap">
  <button
    type="button"
    class="text-primary text-sm hover:text-primary-dark focus:outline-none focus:underline text-left font-medium transition-colors duration-150"
    on:click={handleClick}
  >
    <span class="word-wrap">{data.exam_name || "Untitled Exam"}</span>
    <br />
    <span class="text-xs text-red-600 font-normal"
      >({data.total_questions || 0} Questions)</span
    >
  </button>
</div>
