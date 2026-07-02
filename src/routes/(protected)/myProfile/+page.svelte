<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { apiClient } from "$lib/utils/api.js";
    import { authStore } from "$lib/stores/authStore.js";
    import Input from "$lib/components/Input.svelte";
    import Button from "$lib/components/Button.svelte";
    import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
    import InlineNotification from "$lib/components/InlineNotification.svelte";
    import { User, ShieldUser, KeyRound } from "@lucide/svelte";
    import { goto } from "$app/navigation";
    import Pill from "$lib/components/Pill.svelte";
    import UpdatePasswordForm from "$lib/components/Admin/UpdatePasswordForm.svelte";

    export let data;

    // Retrieve user ID from layout session data
    $: userId = data?.session?.userId;
    $: currentRole = data?.session?.roleName || "User";

    // State variables
    let user = null;
    let username = "";
    let roleName = "";
    let isActive = true;

    let loading = true;
    let saving = false;
    let error = "";
    let success = "";
    let validationErrors = {};
    let showPasswordSection = false;

    // Fetch profile on mount
    onMount(async () => {
        if (!userId) {
            error = "User session not found. Please log in again.";
            loading = false;
            return;
        }
        await fetchUserProfile();
    });

    async function fetchUserProfile() {
        loading = true;
        error = "";
        try {
            const res = await apiClient({ url: `/apis/profile` });
            if (!res.ok) {
                throw new Error(
                    `Failed to load profile details (HTTP ${res.status})`,
                );
            }
            const data = await res.json();
            user = data;
            username = data.username || "";
            roleName = data.role?.role_name;
            isActive = data.is_active ?? true;
        } catch (err) {
            error = err.message || "Failed to load profile details";
            console.error("Error fetching user profile:", err);
        } finally {
            loading = false;
        }
    }

    function validateForm() {
        validationErrors = {};
        let isValid = true;

        if (!username.trim()) {
            validationErrors.username = "Username is required";
            isValid = false;
        } else if (username.trim().length < 3) {
            validationErrors.username =
                "Username must be at least 3 characters";
            isValid = false;
        } else if (username.trim().length > 50) {
            validationErrors.username = "Username cannot exceed 50 characters";
            isValid = false;
        } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
            validationErrors.username =
                "Username can only contain letters, numbers, underscores, and hyphens";
            isValid = false;
        }

        return isValid;
    }

    async function handleSave(event) {
        if (event) event.preventDefault();

        if (!validateForm()) return;

        saving = true;
        error = "";
        success = "";

        let res;

        try {
            const payload = {
                username: username.trim(),
                role_code: user.role?.role_code,
                is_active: user.is_active,
            };

            res = await apiClient({
                url: `/apis/users/${userId}`,
                options: {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        errorData.error ||
                        `Failed to update profile! status: ${res?.status}`,
                );
            }

            authStore.update((curr) => ({
                ...curr,
                userName: username.trim(),
            }));

            success = "Profile updated successfully!";
        } catch (err) {
            error =
                err.message ||
                `Failed to update profile! status: ${res?.status}`;
            console.error("Error saving profile changes:", err);
        } finally {
            saving = false;
        }
    }

    function handleInputChange() {
        if (validationErrors.username) {
            validationErrors.username = "";
        }
        error = "";
        success = "";
    }

    function handleCancel() {
        window.history.back();
    }
</script>

<svelte:head>
    <title>My Profile - Smart QP</title>
</svelte:head>

<main class="min-h-screen py-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <!-- <div class="mb-8">
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
                My Profile
            </h1>
            <p class="mt-2 text-sm text-gray-600">
                View and manage your personal account settings
            </p>
        </div> -->

        <!-- Main Container -->
        <div class="bg-white rounded-xl overflow-hidden border border-stroke">
            <!-- Loading State -->
            {#if loading}
                <div class="text-center py-20">
                    <LoadingSpinner
                        size="large"
                        message="Loading profile details..."
                    />
                </div>
            {:else}
                <!-- Profile Banner -->
                <div
                    class="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 text-dark relative"
                >
                    <div class="flex items-center gap-5">
                        <div
                            class="w-16 h-16 flex-shrink-0 rounded-full bg-white backdrop-blur-md flex items-center justify-center border-2 border-white/40 shadow-inner"
                        >
                            <User class="h-6 w-6 text-primary " />
                        </div>
                        <div class="">
                            <h2 class="text-lg font-medium">
                                {username || "User Profile"}
                            </h2>
                            <p class="text-sm mt-1">
                                <Pill size="sm">
                                    {roleName.charAt(0).toUpperCase() +
                                        roleName.slice(1)}
                                </Pill>
                            </p>
                        </div>
                    </div>
                </div>

                <div class="p-6 sm:p-8">
                    <!-- Notification Banners -->
                    {#if success}
                        <div class="mb-6">
                            <InlineNotification
                                kind="success"
                                title={success}
                                on:close={() => (success = "")}
                            />
                        </div>
                    {/if}

                    {#if error}
                        <div class="mb-6">
                            <InlineNotification
                                kind="error"
                                title={error}
                                on:close={() => (error = "")}
                            />
                        </div>
                    {/if}

                    <!-- Form -->
                    <form
                        on:submit|preventDefault={handleSave}
                        class="space-y-6"
                    >
                        <div class="grid grid-cols-1 gap-6">
                            <!-- Username (Editable) -->
                            <Input
                                label="Username"
                                placeholder="Enter your username"
                                required={true}
                                disabled={saving}
                                bind:value={username}
                                on:handleInputData={handleInputChange}
                                validationErrors={validationErrors.username}
                            />

                            <!-- Role (Read-only) -->
                            <div>
                                <label
                                    class="block text-xs font-semibold tracking-wider mb-2"
                                    for="assigned-role"
                                >
                                    Assigned Role
                                </label>
                                <div
                                    id="assigned-role"
                                    class="px-4 py-2 bg-gray-50 text-sm border border-stroke rounded-lg text-subtext font-medium capitalize flex items-center justify-between"
                                >
                                    <span>{roleName || "N/A"}</span>
                                    <span
                                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200/50 text-gray-600 border border-gray-300"
                                    >
                                        Read-only
                                    </span>
                                </div>
                            </div>

                            <!-- Account Status (Read-only) -->
                            <div>
                                <label
                                    for="status"
                                    class="block text-xs font-semibold tracking-wider mb-2"
                                >
                                    Account Status
                                </label>
                                <div
                                    id="status"
                                    class="px-4 py-2 bg-gray-50 text-sm border border-gray-200 rounded-lg text-subtext font-medium flex items-center justify-between"
                                >
                                    <div class="flex items-center">
                                        <span
                                            class="w-2.5 h-2.5 rounded-full {isActive
                                                ? 'bg-green-500'
                                                : 'bg-red-500'} mr-2.5"
                                        ></span>
                                        <span
                                            >{isActive
                                                ? "Active"
                                                : "Inactive"}</span
                                        >
                                    </div>
                                    <span
                                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200/50 text-gray-600 border border-gray-300"
                                    >
                                        Read-only
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- Password Management Section -->
                        <div class="mt-8 pt-8 border-t border-gray-200">
                            <div class="flex justify-between items-center mb-4">
                                <div>
                                    <h4
                                        class="text-sm font-medium text-gray-900"
                                    >
                                        Password Management
                                    </h4>
                                    <p class="text-xs text-gray-500 mt-0.5">
                                        Manage your account password
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    on:click={() =>
                                        (showPasswordSection =
                                            !showPasswordSection)}
                                    btnType="secondary"
                                >
                                    {showPasswordSection ? "Hide" : "Update"} Password
                                </Button>
                            </div>

                            {#if showPasswordSection}
                                <UpdatePasswordForm
                                    {userId}
                                    onSuccess={() => {
                                        setTimeout(() => {
                                            showPasswordSection = false;
                                        }, 3000);
                                    }}
                                />
                            {/if}
                        </div>

                        <!-- Form Actions -->
                        <div
                            class="pt-6 border-t border-gray-100 flex justify-end gap-4"
                        >
                            <Button btnType="secondary" on:click={handleCancel}
                                >Cancel</Button
                            >
                            <Button
                                type="submit"
                                disabled={saving || !username.trim()}
                                btnType="primary"
                            >
                                {#if saving}
                                    <div class="flex items-center gap-2">
                                        <LoadingSpinner
                                            size="small"
                                            color="white"
                                        />
                                        <span>Saving Changes...</span>
                                    </div>
                                {:else}
                                    Save Changes
                                {/if}
                            </Button>
                        </div>
                    </form>
                </div>
            {/if}
        </div>
    </div>
</main>

<style>
    :global(input:disabled) {
        cursor: not-allowed;
    }
</style>
