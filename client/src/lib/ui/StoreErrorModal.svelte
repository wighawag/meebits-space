<script lang="ts">
import { createEventDispatcher } from "svelte";

import type { StoreWithErrors } from "../utils/stores";
import ErrorModal from "./ErrorModal.svelte";
export let store: StoreWithErrors<any>;

const dispatch = createEventDispatcher();

function acknowledge() {
  store.acknowledgeError();
  dispatch('acknowledgement');
}
</script>
{#if $store.error}
  <ErrorModal title={$store.error.title} message={$store.error.message} on:close={acknowledge}/>
{/if}
