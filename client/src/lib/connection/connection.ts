import { JSONWebsocket } from './JSONWebsocket';
import {
  flowFor,
  setupWriteableWithError,
  type StateData,
} from '../utils/stores';
import type {
  SocketAuthentication,
  SocketRequestResponseTypes,
  SocketServerMessageTypes,
} from 'do-verse';
import type { WalletData, WalletStore } from './walletStores';
import { formatError } from '../utils/errors';
import { get } from '../utils/svelte_stores';

export type ConnectionData = StateData<'Connected' | 'Authenticated'> & {
  socket?: JSONWebsocket<SocketRequestResponseTypes, SocketServerMessageTypes>;
  tokenID?: string;
  guest?: boolean;
};

export function createConnection(
  wallet: WalletStore,
  options?: {
    url?: string;
    autoConnect?: boolean;
    autoAuthenticate?: boolean;
  },
) {
  const {
    assign: _assign,
    subscribe,
    _data,
    acknowledgeError,
  } = setupWriteableWithError<ConnectionData>({
    state: 'Idle',
  });

  const assign = (d: Partial<ConnectionData>) => {
    _assign(d);
    console.log(`connection`, d);
  };

  let walletUsed: string | undefined;
  wallet.subscribe(async ($wallet) => {
    if ($wallet.address !== walletUsed) {
      if (walletUsed) {
        deauthenticate();
      }
      if (options.autoAuthenticate && !_data.transitioning) {
        await authenticate(true);
      }
    }
  });

  async function deauthenticate() {
    const response = await _data.socket.request({
      type: 'deauthentication',
    });

    if (response.type === 'deauthentication') {
      walletUsed = undefined;
      assign({
        state: 'Connected',
        tokenID: undefined,
      });
    }
  }

  async function unselect() {
    localStorage.removeItem(`selection_${get(wallet).address}`);
    location.reload();
  }

  async function selectToken(tokenID: string) {
    try {
      const response = await _data.socket.request({
        type: 'select',
        token: tokenID,
      });
      if (response.type === 'error') {
        assign({
          error: {
            message: response.message,
            title: 'Error With Server',
            code: response.code,
          },
        });
      } else {
        assign({ tokenID });
        // TODO ensure wallet did not change after the request was sent

        localStorage.setItem(`selection_${get(wallet).address}`, tokenID);
      }
    } catch (err) {
      if (err.code) {
        assign({ error: { title: 'Request Errored', ...err } });
      } else {
        assign({
          error: {
            title: 'Unknown Error',
            message: formatError(err),
            code: 5000,
            errorObject: err,
          },
        });
      }
      // throw err;
    }
  }

  async function connect() {
    let socket = _data.socket;
    if (!socket) {
      socket = new JSONWebsocket(options?.url);
      socket.onClose = () => {
        assign({
          state: 'Idle',
        });
        console.log(socket.readyState);
        authenticate(true);
      };
    }
    if (_data.transitioning) {
      console.log(`already transitioning: ${_data.transitioning}`);
    }
    assign({
      transitioning: 'connecting',
      socket: undefined,
    });
    await socket.connect();
    console.log('not transitioning, Connected');
    assign({
      transitioning: undefined,
      socket,
      state: 'Connected',
    });
  }
  async function disconnect() {
    let socket = _data.socket;
    let promise;
    if (socket) {
      promise = socket.close();
    }
    console.log('not transitioning, Disconnect');
    assign({
      transitioning: undefined,
      socket: undefined,
      state: 'Idle',
    });
    await promise;
  }

  // TODO deauthenticate when address change and try to reauthenticate

  async function completeAuth($wallet: WalletData, discrete = false) {
    const socket = _data.socket;
    const owner = $wallet.address;
    const accessTokenAsString = localStorage.getItem(`accessToken_${owner}`);

    if (!accessTokenAsString && discrete) {
      console.log('not transitioning, no access token and discrete');
      assign({
        transitioning: undefined,
      });
      return;
    }
    let response: SocketAuthentication['response'];
    if (accessTokenAsString) {
      console.log(`acccesToken found, using it to authenticate....`);
      const accessToken = JSON.parse(accessTokenAsString);
      const timestamp = Math.floor(Date.now() / 1000);
      if (accessToken.expiration < timestamp + 60) {
        console.error(`token expired`);
      } else {
        try {
          response = await socket.request({
            type: 'authentication',
            method: 'accessToken',
            accessToken: accessToken.token,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
    if (!response) {
      const timestamp = Math.floor(Date.now() / 1000); // TODO sync time with server
      console.log(`signature needed...`);
      let message = import.meta.env.VITE_MESSAGE_TEMPLATE;
      message = message.replace(`{owner}`, owner);
      if (message.indexOf('{timestamp}') || message.indexOf('{dateUTC}')) {
        message = message.replace(`{timestamp}`, '' + timestamp);
        message = message.replace(
          `{dateUTC}`,
          new Date(timestamp * 1000).toUTCString(),
        );
      }
      try {
        const signature = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [owner, message],
        });
        console.log(`sending away signature for auth`);
        response = await socket.request({
          type: 'authentication',
          method: 'signature',
          owner,
          signature,
          timestamp,
        });
      } catch (err) {
        console.log('not transitioning, err');
        assign({
          transitioning: undefined,
          error: {
            code: 5000,
            title: 'Could not Authenticate',
            message: formatError(err),
            errorObject: err,
          },
        });
      }
    }

    if (response) {
      if (response.type === 'authentication') {
        walletUsed = owner;
        localStorage.setItem(
          `accessToken_${response.authenticatedAddress}`,
          JSON.stringify(response.accessToken),
        );
      } else {
        console.log('not transitioning, response not auth');
        assign({
          transitioning: undefined,
          error: {
            code: response.code,
            title: 'Could not Authenticate',
            message: response.message,
          },
        });
      }
    }

    console.log('not transitioning, Authenticated');
    assign({
      transitioning: undefined,
      state: 'Authenticated',
    });

    const selection = localStorage.getItem(`selection_${owner}`);
    if (selection) {
      selectToken(selection);
    }
  }

  async function authenticate(discrete = false) {
    let socket = _data.socket;
    if (
      !socket ||
      socket.readyState === 'CLOSED' ||
      socket.readyState === 'UNINITIALIZED' ||
      socket.readyState === 'CLOSING'
    ) {
      await connect();
    }

    assign({
      transitioning: 'authenticating', // TODO break it down in several step ? // fetching accounts, signing....
    });

    await wallet.connect(discrete);
    await completeAuth(get(wallet), discrete);
    // flowFor(
    //   wallet,
    //   ($wallet: WalletData) => !!$wallet.address,
    //   async (wallet) => {
    //     if (!discrete) {
    //       await wallet.connect();
    //     }
    //   },
    // ));
  }

  function guestMode() {
    assign({ guest: true });
  }

  if (!_data.transitioning) {
    if (options?.autoAuthenticate) {
      authenticate(true);
    } else if (options?.autoConnect) {
      connect();
    }
  }

  return {
    unselect,
    acknowledgeError,
    subscribe,
    authenticate,
    connect,
    disconnect,
    selectToken,
    guestMode,
  };
}
