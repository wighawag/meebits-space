import {
  triggered,
  type Content,
  type PeriodicFetchStore,
} from '../utils/fetch';
import type { WalletStore } from './walletStores';

export type MyAvatars = { id: string }[];
export type MyAvatarsData = Content<MyAvatars>;

export function createMyAvatars(
  wallet: WalletStore,
  url: string,
): PeriodicFetchStore<MyAvatars> {
  let lastAddress: string | undefined;
  return triggered(
    wallet,
    async ($wallet) => {
      if (!$wallet.address) {
        lastAddress = $wallet.address;
        return [];
      }

      const response = await fetch(`${url}/query?owner=${$wallet.address}`);
      const json = await response.json();
      if (json.error) {
        throw json.error;
      }
      const result = json.result;
      lastAddress = $wallet.address;

      // if (
      //   lastAddress.toLowerCase() ===
      //   '0x7773Ae67403d2E30102a84c48cc939919C4C881c'.toLowerCase()
      // ) {
      //   return [{ id: '1' }];
      // }

      // if (
      //   lastAddress.toLowerCase() ===
      //   '0x18abF1a59d02Ee7c210dDBF157B648DC6f37969b'.toLowerCase()
      // ) {
      //   return [{ id: '4' }, { id: '5' }];
      // }

      return result;
    },
    ($wallet) => $wallet.address !== lastAddress,
    60000, // TODO config for interval
  );
}
