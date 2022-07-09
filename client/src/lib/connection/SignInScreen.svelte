<script lang="ts">
import { connection, myavatars, wallet } from "../../state";
import MessageModal from "../ui/MessageModal.svelte";
import ModalWrapper from "../ui/ModalWrapper.svelte";
import MultiStoreErrorModal from "../ui/MultiStoreErrorModal.svelte";
import SingleButtonModal from "../ui/SingleButtonModal.svelte";
import { flowFor, type FlowStore } from "../utils/stores";


let flow: FlowStore<any>;
async function pickAvatar() {
  flow = flowFor(connection, ($connection) => $connection.state === 'Authenticated' && ($connection.tokenID !== undefined || $connection.guest))();
  connection.authenticate();
  flow.subscribe(v => console.log('flow', v));
}

function justWatch() {
  connection.guestMode();
}
</script>

{#if !$connection.guest &&  !$connection.tokenID }

  {#if $flow && $flow.state === 'SettingUp'}
    {#if $connection.transitioning}
      <MessageModal message="Pease Wait..."/>
    {:else}
      {#if $connection.state === 'Idle'}
        <SingleButtonModal message="You need to connect to the server" buttonLabel="connect" on:click={() => connection.connect()}/>
      {:else if $connection.state === 'Connected'}
        <SingleButtonModal message="You need to authenticate to the server" buttonLabel="authenticate" on:click={() => connection.authenticate()}/>
      {:else if $connection.state === 'Authenticated'}
        {#if !$wallet.address}
        <SingleButtonModal message="Please connect your wallet" buttonLabel="Connect" on:click={() => wallet.connect()}/>
        {:else if !$myavatars?.data}
          <MessageModal message="Loading your Meebits...."/>
        {:else if $myavatars.data.length === 0}
          <SingleButtonModal message="You don't have any Meebits" buttonLabel="Just Watch" on:click={() => justWatch()}/>
        {:else}

          <ModalWrapper>
            {#each $myavatars.data as token}
              <button class="m-2" on:click={() => connection.selectToken(token.id)}>{token.id}</button>
            {/each}
          </ModalWrapper>


        {/if}
      {:else}
        <MessageModal message={`invalid state for connection: ${$connection.state}`}/>
      {/if}

    {/if}
  {:else}
    <ModalWrapper>
      <div>
        <img class="mx-auto w-32" src="/meebits/logo2.svg" alt="meebits logo" />
        <div class="mt-3 text-center sm:mt-5">
          <h3 class="text-lg leading-6 font-medium text-gray-100" id="modal-title">Weclome to Meebits.space</h3>
          <div class="mt-2">
            <p class="text-sm text-gray-400">A place to meet other meebits</p>
          </div>
        </div>
      </div>
      <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
        <button on:click={() => pickAvatar()}
        type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm">Your Meebit</button>
        <button on:click={() => justWatch()}
        type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm">Just Watch</button>
      </div>
    </ModalWrapper>
  {/if}

  <MultiStoreErrorModal stores={[connection, myavatars]} on:acknowledgement={() => flow.cancel()}/>
{/if}
