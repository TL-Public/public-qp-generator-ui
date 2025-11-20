<script>

import api from "$lib/utils/api.js";
  
    let status = '' ; 
    let responseData = null ; 
    let error = null ; 
    async function handleSubmit(){
        responseData = null ; 
        console.log(`Submitting with status ${status}`);
        console.log("env link", import.meta.env.VITE_API_BASE_URL)
        const response = await api.viewPapers.getAll(
            {
                status : status 
            }
        ) ; 
        if(response.error) { 
            error = response.error ; 
            throw new Error(error) ; 
        }
        else { 
            console.log(response.data );
            responseData = response.data ; 

        }
        
    }
</script>


<main>

   <form on:submit|preventDefault = {handleSubmit}>
    <input
    id="status-input"
    type="text"
    bind:value={status} 
    placeholder="type here"
    >
    <button
    type ="submit"
    >
    submit here
    </button>
   </form>

   <!-- Display the results -->
  {#if responseData}
    <div class="mt-8">
      <h2 class="text-xl font-bold">Results:</h2>
      <pre class="bg-gray-100 p-4 rounded mt-2">{JSON.stringify(responseData, null, 2)}</pre>
    </div>
  {/if}

  {#if error}
    <div class="mt-8 p-4 bg-red-100 text-red-700 rounded">
      <p><strong>Error:</strong> {error}</p>
    </div>
  {/if}
</main>