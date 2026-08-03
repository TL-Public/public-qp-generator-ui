<script>
  import PortalModal from "$lib/components/PortalModal.svelte";
  import Button from "$lib/components/Button.svelte";
  import DataTable from "$lib/components/DataTable.svelte";
  import Pagination from "$lib/components/SearchPageComponents/Pagination.svelte";
  import Tabs from "$lib/components/TabTable/Tabs.svelte";
  import Tab from "$lib/components/TabTable/Tab.svelte";
  import TabPanel from "$lib/components/TabTable/TabPanel.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";
  import { X, Loader2 } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let subjectName = "";
  export let selectedClass = "";
  export let mediumName = "";
  export let questionPoolLoading = false;
  export let questionPoolError = null;
  export let poolActiveTab = "available";
  export let availableQuestions = [];
  export let qtn_codes_to_exclude = [];
  export let excludedQuestionsList = [];
  export let paginatedAvailableQuestions = [];
  export let paginatedExcludedQuestions = [];
  export let availableCurrentPage = 1;
  export let availableTotalPages = 1;
  export let excludedCurrentPage = 1;
  export let excludedTotalPages = 1;
  export let poolItemsPerPage = 10;
  export let poolTableHeaders = [];
  export let availableActionConfig = {};
  export let excludedActionConfig = {};
  export let questionCustomRenderers = {};
  export let retryHandler = () => {};

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close");
  }

  function handleRestoreAll() {
    dispatch("restoreAll");
  }

  function handleTableAction(detail) {
    dispatch("tableActionClick", detail);
  }

  function handleAvailablePageChange(page) {
    dispatch("availablePageChange", page);
  }

  function handleExcludedPageChange(page) {
    dispatch("excludedPageChange", page);
  }
</script>

{#if open}
  <PortalModal>
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div
        class="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-900">Review Question Pool</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Syllabus question pool for {subjectName} (Class {selectedClass}
            - {mediumName})
          </p>
        </div>
        <button
          type="button"
          on:click={handleClose}
          class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body with Tabs -->
      <div class="p-6 overflow-y-auto flex-1">
        {#if questionPoolLoading}
          <div
            class="flex flex-col items-center justify-center py-16 space-y-3"
          >
            <Loader2 class="w-8 h-8 text-primary animate-spin" />
            <p class="text-sm font-medium text-slate-600">
              Loading questions from selected chapters...
            </p>
          </div>
        {:else if questionPoolError}
          <div class="py-6">
            <InlineNotification
              kind="error"
              title="Failed to load question pool"
              subtitle={questionPoolError}
              action={{ text: "Retry", handler: retryHandler }}
              hideCloseButton={true}
            />
          </div>
        {:else}
          <Tabs bind:active={poolActiveTab}>
            <div class="border-b border-slate-200 bg-white">
              <nav class="flex space-x-0">
                <Tab
                  name="available"
                  title={`Available Questions (${availableQuestions.length})`}
                />
                <Tab
                  name="excluded"
                  title={`Excluded Questions (${qtn_codes_to_exclude.length})`}
                />
              </nav>
            </div>

            <TabPanel name="available">
              <DataTable
                tableHeadersDisplay={poolTableHeaders}
                tableData={paginatedAvailableQuestions}
                showPagination={false}
                serverSidePagination={true}
                apiCurrentPage={availableCurrentPage}
                apiTotalItems={availableQuestions.length}
                apiPageSize={poolItemsPerPage}
                actionConfigObject={availableActionConfig}
                customRenderers={questionCustomRenderers}
                notFoundMessage="No available questions remaining in pool."
                on:tableActionClick={(e) => handleTableAction(e.detail)}
              />

              {#if availableQuestions.length > poolItemsPerPage}
                <Pagination
                  currentPage={availableCurrentPage}
                  totalPages={availableTotalPages}
                  on:pageChange={(e) => handleAvailablePageChange(e.detail)}
                />
              {/if}
            </TabPanel>

            <TabPanel name="excluded">
              <div class="space-y-4">
                {#if excludedQuestionsList.length > 0}
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-slate-500 font-medium">
                      {excludedQuestionsList.length} question(s) excluded
                    </span>
                    <Button
                      btnType="secondary"
                      customClass="!px-3 !py-1.5 !text-xs rounded-lg"
                      on:click={handleRestoreAll}
                    >
                      Restore All
                    </Button>
                  </div>
                {/if}

                <DataTable
                  tableHeadersDisplay={poolTableHeaders}
                  tableData={paginatedExcludedQuestions}
                  showPagination={false}
                  serverSidePagination={true}
                  apiCurrentPage={excludedCurrentPage}
                  apiTotalItems={excludedQuestionsList.length}
                  apiPageSize={poolItemsPerPage}
                  actionConfigObject={excludedActionConfig}
                  customRenderers={excludedActionConfig}
                  notFoundMessage="No questions excluded yet."
                  on:tableActionClick={(e) => handleTableAction(e.detail)}
                />

                {#if excludedQuestionsList.length > poolItemsPerPage}
                  <Pagination
                    currentPage={excludedCurrentPage}
                    totalPages={excludedTotalPages}
                    on:pageChange={(e) => handleExcludedPageChange(e.detail)}
                  />
                {/if}
              </div>
            </TabPanel>
          </Tabs>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between"
      >
        <span class="text-xs font-semibold text-slate-600">
          {availableQuestions.length} Available · {qtn_codes_to_exclude.length}
          Excluded
        </span>
        <Button
          btnType="primary"
          customClass="!px-6 !py-2.5 rounded-xl font-bold text-xs"
          on:click={handleClose}
        >
          Done
        </Button>
      </div>
    </div>
  </PortalModal>
{/if}
