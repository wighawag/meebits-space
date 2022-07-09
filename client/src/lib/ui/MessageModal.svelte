<script lang="ts">
import ModalWrapper from "./ModalWrapper.svelte";
export let message: string;
</script>
<ModalWrapper>
  <div>
    <div class="m-3 text-center sm:m-5">
      <h3 class="text-lg leading-6 font-medium text-gray-100" id="modal-title">{message}</h3>
    </div>
  </div>

</ModalWrapper>
