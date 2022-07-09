<script lang="ts">
import { onMount } from 'svelte';
import SignInScreen from './lib/connection/SignInScreen.svelte';
import {start} from './lib/game/setup';
import { connection } from './state';

onMount(() => {
  start();
})
</script>

<div id="scene-container"></div>

<button class="top-0 right-0 fixed bg-white text-black" on:click={() => connection.unselect()}>back</button>

<SignInScreen />

<style>
  #scene-container {
    top: 0;
    left: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
</style>
