// originally copied from https://github.com/svelte-society/sveltesociety-utilities
import type { ErrorData } from './stores';
import { type Writable, writable, type Readable } from './svelte_stores';
// import { equals } from 'rambda';

export type Content<T> = {
  data?: T; // will be set once first success
  fetching?: boolean; // will be true every time a new fetch is taking place to refresh data
  stale?: boolean; // will be true if a fetch did not succeed
  error?: ErrorData; // will show error
};

export type PeriodicFetchStore<T> = {
  subscribe: Writable<Content<T>>['subscribe'];
  acknowledgeError: () => void;
};

export function periodicFetch<Payload>(
  url: string,
  interval: number,
): PeriodicFetchStore<Payload> {
  let timeoutId;
  let $store: Content<Payload> = {};
  const { subscribe, set } = writable<Content<Payload>>($store, (set) => {
    async function refetch() {
      $store.fetching = true;
      set($store);
      try {
        const response = await fetch(url);
        const data = await response.json();
        // we need to reset fetching to false so no point checking equality as we need to emit the event in any case
        // TODO option to not have fetching ?
        // if (!equals($store.data, data)) {
        $store.data = data;
        $store.stale = false;
        $store.fetching = false;
        $store.error = undefined;
        set($store);
        // }
      } catch (err) {
        $store.error = err;
        if ($store.data) {
          $store.stale = true;
        }
        $store.fetching = false;
        set($store);
      } finally {
        timeoutId = setTimeout(refetch, interval);
      }
    }
    refetch();
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };
  });

  return {
    subscribe,
    acknowledgeError() {
      $store.error = undefined;
      set($store);
    },
  };
}

export function triggered<Dep, Payload>(
  deps: Readable<Dep>,
  action: ($dep: Dep) => Promise<Payload>,
  invalidate: ($dep: Dep) => boolean,
  interval?: number,
): PeriodicFetchStore<Payload> {
  let timeoutId;
  let $store: Content<Payload> = {};
  let $dep: Dep | undefined;

  const { set, subscribe } = writable<Content<Payload>>($store, () => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };
  });

  async function refetch($dep: Dep, intervalTriggered: boolean) {
    if (!intervalTriggered) {
      const isInvalidated = invalidate($dep);
      if (!isInvalidated) {
        return;
      } else {
        if (interval) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        $store.data = undefined;
        $store.stale = false;
      }
    }

    $store.fetching = true;
    set($store);
    try {
      const data = await action($dep);
      console.log({ data });
      $store.data = data;
      $store.stale = false;
      $store.fetching = false;
      $store.error = undefined;
      set($store);
    } catch (err) {
      $store.error = err;
      if ($store.data) {
        $store.stale = true;
      }
      $store.fetching = false;
      set($store);
    } finally {
      if (interval) {
        timeoutId = setTimeout(() => refetch($dep, true), interval);
      }
    }
  }

  deps.subscribe((new$dep) => {
    $dep = new$dep;
    refetch($dep, false);
  });

  return {
    subscribe,
    acknowledgeError() {
      $store.error = undefined;
      set($store);
    },
  };
}
