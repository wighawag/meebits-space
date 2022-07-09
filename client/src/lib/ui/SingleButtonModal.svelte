<script lang="ts">
import { createEventDispatcher } from "svelte";
import ModalWrapper from "./ModalWrapper.svelte";
export let message: string;
export let buttonLabel: string;
const dispatch = createEventDispatcher();

</script>
<ModalWrapper>
  <div>
    <div class="m-3 text-center sm:m-5">
      <h3 class="text-lg leading-6 font-medium text-gray-100" id="modal-title">{message}</h3>
    </div>
  </div>
  <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
    <button on:click={() => dispatch('click')}
    type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm">{buttonLabel}</button>

  </div>
</ModalWrapper>
