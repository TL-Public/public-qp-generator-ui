<script> 

    export let groups = [ 
        {
            subject : 'Mathematics',
            group : 'Algebra',
            total : 15, 
            easy : 6, 
            medium : 5, 
            hard : 4, 
            
        },
        {
            subject : 'Mathematics',
            group : 'Geometry',
            total : 15, 
            easy : 6, 
            medium : 5, 
            hard : 4, 
            
        },
        {
            subject : 'English',
            group : 'chapter',
            total : 15, 
            easy : 6, 
            medium : 5, 
            hard : 4, 
            
        },
    ] ; 

    // calculate totals 
    $: totalQuestions = groups.reduce((sum, group) => sum + group.total, 0 ) ; 
    $: totalEasy = groups.reduce((sum,group)=> sum + group.easy, 0)  ; 
    $: totalMedium = groups.reduce((sum,group)=> sum + group.medium, 0 ) ; 
    $: totalHard = groups.reduce((sum,group)=> sum + group.hard, 0 ) ; 

</script>


<div class="bg-white rounded-lg p-6 border">
  <h2 class="text-xl font-semibold mb-6">Question Groups Preview</h2>

  <div class="overflow-x-auto">
    <table class="min-w-full">
      <thead>
        <tr class="bg-gray-50">
          <th class="text-left py-3 px-4">Subject</th>
          <th class="text-left py-3 px-4">Group</th>
          <th class="text-right py-3 px-4">Total</th>
          <th class="text-right py-3 px-4 text-green-600">Easy</th>
          <th class="text-right py-3 px-4 text-orange-600">Medium</th>
          <th class="text-right py-3 px-4 text-red-600">Hard</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each groups as group}
          <tr class="hover:bg-gray-50">
            <td class="py-3 px-4">{group.subject}</td>
            <td class="py-3 px-4">{group.group}</td>
            <td class="py-3 px-4 text-right font-medium">{group.total}</td>
            <td class="py-3 px-4 text-right text-green-600">{group.easy}</td>
            <td class="py-3 px-4 text-right text-orange-600">{group.medium}</td>
            <td class="py-3 px-4 text-right text-red-600">{group.hard}</td>
          </tr>
        {/each}
        <!-- Total Row -->
        <tr class="bg-gray-50 font-semibold">
          <td class="py-3 px-4" colspan="2">Total</td>
          <td class="py-3 px-4 text-right">{totalQuestions}</td>
          <td class="py-3 px-4 text-right text-green-600">{totalEasy}</td>
          <td class="py-3 px-4 text-right text-orange-600">{totalMedium}</td>
          <td class="py-3 px-4 text-right text-red-600">{totalHard}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>