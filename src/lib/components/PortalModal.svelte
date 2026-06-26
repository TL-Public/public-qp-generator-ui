<script>
    import Portal from "$lib/components/Portal.svelte";
    import PortalBackdrop from "$lib/components/PortalBackdrop.svelte";
</script>

<Portal>
    <PortalBackdrop>
        <slot></slot>
    </PortalBackdrop>
</Portal>
