const websocketHandler = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected websocket', { status: 400 });
  }
  return fetchGlobalDO(env.ROOMS, request);
};

// export for tests
export async function handleRequest(
  request: Request,
  env: Env,
  ctx?: ExecutionContext,
) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  try {
    const { patharray } = pathFromURL(request.url);

    switch (new URL(request.url).pathname) {
      case '/events/setup': // TODO should be guarded by admin authentication
      case '/events/list':
      case '/events/feed': // TODO should be guarded by admin authentication
      case '/events/status':
      case '/events/trigger-alarm': // TODO remove or admin gated
      // case '/events/set-alarm-if-stuck': // TODO remove or admin gated
      case '/query':
        // we only need one DO so we use _GLOBAL_ id
        const namespace = env.ETHEREUM_EVENTS;
        const DO = namespace.get(namespace.idFromName('_GLOBAL_'));

        return DO.fetch(request);
    }

    switch (patharray[0]) {
      case 'assets':
        return meebitAsset(
          {
            ETHEREUM_STORE: getGlobalDO(env.ETHEREUM_EVENTS),
            FILES: env.FILES,
            ACCOUNTS: env.ACCOUNTS,
          },
          patharray,
        );
      case 'ws':
        return websocketHandler(request, env);
      default:
        return new Response('Not found', { status: 404 });
    }
  } catch (err) {
    return new Response((err as any).toString());
  }
}

const worker: ExportedHandler<Env> = {
  fetch: handleRequest,

  // required to ensure alarm redundency
  // => does not work actually

  // scheduled: async (controller, env) => {
  //   const namespace = env.ETHEREUM_EVENTS;
  //   const DO = namespace.get(namespace.idFromName('_GLOBAL_'));
  //   try {
  //     const response = await DO.fetch(
  //       new Request('http://localhost/events/set-alarm-if-stuck'),
  //     );
  //     console.log(`response: ${await response.text()}`);
  //   } catch (e) {
  //     console.error(`error`, e);
  //   }
  // },

  // simply process on CRON
  // we still have the alarm enabled, let see...
  scheduled: async (controller, env) => {
    const namespace = env.ETHEREUM_EVENTS;
    const DO = namespace.get(namespace.idFromName('_GLOBAL_'));
    try {
      const response = await DO.fetch(
        new Request('http://localhost/events/fetchLogsAndProcess'),
      );
      console.log(
        `response: ${JSON.stringify(await response.json(), null, 2)}`,
      );
    } catch (e) {
      console.error(`error`, e);
    }
  },
};

import { Room } from '../lib/do-verse/src/Room';
Room.signatureTemplate = `Verifying account ownership of {owner} for Meebits owner access.`;

import { MeebitsRoom } from './MeebitsRoom';
import {
  fetchGlobalDO,
  getGlobalDO,
  handleOptions,
  pathFromURL,
} from '../lib/do-verse/src/utils/request';
import { meebitAsset } from './meebits/utils';

// export Durable Object Classes
export { MeebitsRoom as Room };

import { EthereumEventsDO } from '../lib/do-verse/lib/do-ethereum-events/src/EthereumEventsDO';
EthereumEventsDO.alarm = {
  interval: 15,
  individualCall: true,
};

export { Blockchain as EthereumEventsDO } from '../lib/do-verse/src/Blockchain';

// export worker
export default worker;
