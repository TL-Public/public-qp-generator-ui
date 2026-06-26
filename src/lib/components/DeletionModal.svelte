<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/Button.svelte";
  import Input from "$lib/components/Input.svelte";
  import { Trash2 } from "@lucide/svelte";
  import LineLoader from "$lib/components/LineLoader.svelte";
  import InlineNotification from "$lib/components/InlineNotification.svelte";

  import PortalModal from "$lib/components/PortalModal.svelte";

  export let item = {};
  export let deletionUrl = null; // Accept deletion URL as prop
  export let itemType = "quiz"; // quiz or exam or question paper
  export let itemName = ""; // Specific name of the item
  export let details = []; // Array of { label: string, value: any }
  export let requireConfirmInput = true; // Set to false to bypass typing "confirm" or "DELETE"
  export let confirmText = "DELETE"; // Text required to confirm deletion (case-insensitive)
  export let confirmButtonText = ""; // Custom text for confirm button

  const dispatch = createEventDispatcher();
  let confirmationText = "";
  let error = {
    type: "",
    message: "",
    cbFn: null,
  };
  let loading = false;

  // Reactively compute the item name if not explicitly provided
  $: resolvedItemName =
    itemName || item?.exam_name || item?.name || item?.title || "";

  // Reactively compute details list if not provided
  $: resolvedDetails =
    details.length > 0
      ? details
      : [
          { label: "Name", value: resolvedItemName },
          { label: "Code", value: item?.exam_code || item?.code || item?.id },
          { label: "Status", value: item?.status },
        ].filter(
          (d) => d.value !== undefined && d.value !== null && d.value !== "",
        );

  $: resolvedConfirmButtonText = confirmButtonText || `Delete ${itemType}`;

  $: isConfirmDisabled =
    loading ||
    (requireConfirmInput &&
      confirmationText.toLowerCase().trim() !==
        confirmText.toLowerCase().trim());

  function resetError() {
    error = {
      type: "",
      message: "",
      cbFn: null,
    };
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleConfirmInput(event) {
    confirmationText = event.detail.value;
    resetError();
  }

  async function handleDelete() {
    if (
      requireConfirmInput &&
      confirmationText.toLowerCase().trim() !== confirmText.toLowerCase().trim()
    ) {
      error = {
        type: "error",
        message: `Please type ${confirmText} to confirm`,
        cbFn: null,
      };
      return;
    }

    const url =
      deletionUrl || `/apis/exams/${item?.exam_code || item?.code || item?.id}`;
    loading = true;
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.detail ||
            `Failed to delete ${itemType}`,
        );
      }

      const successPayload = {
        item,
        message: `Successfully deleted ${itemType} '${resolvedItemName}'.`,
      };

      if (response.status === 204) {
        dispatch("success", successPayload);
        return;
      }

      await response.json().catch(() => ({}));
      dispatch("success", successPayload);
    } catch (err) {
      console.error(`Error deleting ${itemType}:`, err);
      error = {
        type: "error",
        message:
          err.message || `Failed to delete ${itemType}. Please try again.`,
        cbFn: handleDelete,
      };
    } finally {
      loading = false;
    }
  }
</script>

<PortalModal>
  <div class="bg-neutral-100 p-6 rounded-md max-w-3xl width-[90%]">
    {#if loading}
      <div class="mb-4">
        <LineLoader loaderColor={"bg-red-600"} />
      </div>
    {/if}

    {#if error.message}
      <div class="mb-4">
        <InlineNotification
          kind={error.type}
          title={error.message}
          hideCloseButton={true}
        >
          <span slot="actions">
            {#if error.type === "error" && error.cbFn}
              <Button btnType="secondary" on:click={error.cbFn}>Retry</Button>
            {/if}
          </span>
        </InlineNotification>
      </div>
    {/if}

    <div class="mb-4">
      <div class="flex items-center gap-2">
        <Trash2 class="h-5 w-5 text-red-600" />
        <div>
          <h2 class="text-base font-semibold text-red-600">
            About to delete the {itemType} - {resolvedItemName || "-"}
          </h2>
        </div>
      </div>
    </div>

    <p class="text-sm text-dark-gray mb-2 mx-1">
      Are you sure you want to delete this {itemType}? This action cannot be
      undone.
    </p>

    <div class="space-y-6">
      {#if resolvedDetails.length > 0}
        <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
          <dl class="space-y-2">
            {#each resolvedDetails as detail}
              <div class="flex items-start">
                <dt
                  class="text-sm font-medium text-gray-500 w-24 flex-shrink-0"
                >
                  {detail.label}:
                </dt>
                <dd class="text-sm text-dark-gray break-all">
                  {detail.value}
                </dd>
              </div>
            {/each}
          </dl>
        </div>
      {/if}

      {#if requireConfirmInput}
        <div class="border-t border-gray-200 pt-2">
          <p class="text-sm text-gray-700 mb-3">
            Please type <span class="font-medium text-red-600"
              >{confirmText}</span
            > to confirm.
          </p>
          <Input
            type="text"
            placeholder={`Type ${confirmText} to confirm`}
            value={confirmationText}
            disabled={loading}
            on:handleInputData={handleConfirmInput}
          />
        </div>
      {/if}
    </div>

    <div class="mt-6 flex items-center justify-end gap-x-3">
      <Button
        btnType="secondary"
        on:click={handleCancel}
        disabled={loading}
        title="Cancel"
      >
        Cancel
      </Button>
      <Button
        btnType="danger"
        on:click={handleDelete}
        disabled={isConfirmDisabled}
        title={resolvedConfirmButtonText}
      >
        {resolvedConfirmButtonText}
      </Button>
    </div>
  </div>
</PortalModal>
