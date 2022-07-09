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

const worker: ExportedHandler<Env> = { fetch: handleRequest };

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

export { Blockchain as EthereumEventsDO } from '../lib/do-verse/src/Blockchain';

// export worker
export default worker;
