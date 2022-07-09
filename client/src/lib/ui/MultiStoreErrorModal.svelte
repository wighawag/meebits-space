<script lang="ts">
import type { StoreWithErrors } from "../utils/stores";

import StoreErrorModal from "./StoreErrorModal.svelte";

export let stores: StoreWithErrors<any  >[];
</script>
{#each stores as store}
  <StoreErrorModal store={store} on:acknowledgement />
{/each}

