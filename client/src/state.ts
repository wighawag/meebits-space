import { serverURL } from './config';
import { createConnection } from './lib/connection/connection';
import { createMyAvatars } from './lib/connection/myavatars';
import { createWalletStores } from './lib/connection/walletStores';
import { get } from './lib/utils/svelte_stores';

export const { wallet } = createWalletStores({ autoConnect: true });

export const myavatars = createMyAvatars(wallet, serverURL);

export const connection = createConnection(wallet, {
  autoConnect: true,
  autoAuthenticate: true,
  url: serverURL,
});

let lastWallet: string | undefined;
wallet.subscribe(($wallet) => {
  if ($wallet.address !== lastWallet) {
    if (lastWallet) {
      window.location.reload();
    }
    lastWallet = $wallet.address;
  }
});

// connection.subscribe((v) => console.log(`connection`, v));
(window as any).connection = connection;

// wallet.subscribe((v) => console.log(`wallet`, v));
(window as any).wallet = wallet;

// myavatars.subscribe((v) => console.log(`myavatars`, v));
(window as any).myavatars = myavatars;

(window as any).get = get;
