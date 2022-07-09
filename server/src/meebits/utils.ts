// TODO get rid of this dependencies
// instead pass callbacks for account
import { Account, ACCOUNTS } from '@/accounts/utils';
import { corsHeaders } from '../../lib/do-verse/src/utils/request';

export async function fetchMeebit(
  FILES: KVNamespace,
  {
    signature,
    meebitID,
    message,
    extension,
  }: {
    signature: string;
    message: string;
    extension: string;
    meebitID: string;
  },
): Promise<Response> {
  console.log(`getting cookie...`);
  const response = await fetch(
    `http://meebits.app/meebits/verifySignature?signedMessage=${signature}&origMessage=${encodeURI(
      message,
    )}&index=${meebitID}`,
    {
      method: 'GET',
      headers: {
        // Accept:
        //   'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        // 'Accept-Encoding': 'gzip, deflate',
        // 'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        // Connection: 'keep-alive',
        Host: 'meebits.app',
        // 'Upgrade-Insecure-Requests': '1',
        // 'User-Agent':
        //   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
      },
      redirect: 'manual',
    },
  );
  // PLAY_ERRORS=; Max-Age=0; Expires=Wed, 22 Jun 2022 09:28:30 GMT; Path=/, PLAY_FLASH=; Max-Age=0; Expires=Wed, 22 Jun 2022 09:28:30 GMT; Path=/, PLAY_SESSION=84c897cde6fde0fd110d9a88ebe4a5d87b90adf8-account-from-signature=0xe363C2fBa75Cbd27487b17430e1eFbdD2ADD374e; Path=/
  const setCookies = response.headers.getAll('set-cookie');

  if (!setCookies) {
    return new Response('Not found (Auth Failure)', { status: 404 });
  }

  // console.log({ setCookies });
  const downloadResponse = await fetch(
    `http://meebits.app/meebits/ownerdownload?tpose=true&file=${extension}&index=${meebitID}`,
    {
      headers: {
        Cookie: setCookies
          .filter((c) => c.startsWith('PLAY_SESSION'))
          .join(';'),
      },
    },
  );
  if (downloadResponse.status === 200) {
    await FILES.put(
      `${meebitID}.${extension}`,
      await (await downloadResponse.blob()).arrayBuffer(),
    );
    return new Response(downloadResponse.body, {
      headers: { ...corsHeaders },
    });
  } else {
    return new Response('Not found (Download Failure)', { status: 404 });
  }
}

export async function meebitAsset(
  env: {
    ETHEREUM_STORE: DurableObjectStub;
    FILES: KVNamespace;
    ACCOUNTS: KVNamespace;
  },
  patharray: string[],
): Promise<Response> {
  const filepath = patharray.slice(1).join('/');
  const streamFromV = await env.FILES.get(filepath, 'stream');
  if (streamFromV) {
    return new Response(streamFromV, { headers: { ...corsHeaders } });
  }

  const filepathSplitted = filepath.split('.');
  const filepathWithoutExtension = filepathSplitted[0];
  const extension = filepathSplitted[1];

  const meebitID = filepathWithoutExtension;

  let owner: string | undefined;
  try {
    const response = await env.ETHEREUM_STORE.fetch(
      new Request(`http://localhost/events/get?typeName=Token&id=${meebitID}`),
    );

    console.log(`response received`);

    const json: { result?: { owner: string }; success?: boolean; error?: any } =
      await response.json();
    if (json.error || (!json.result && !json.success)) {
      console.log(`json received`);
      throw new Error(json.error || 'No Result');
    }
    owner = json.result?.owner;
  } catch (e) {
    throw e;
  }

  if (!owner) {
    return new Response(`Not found (id not indexed))`, {
      status: 404,
    });
  }

  const account = await env.ACCOUNTS.get<Account>(ACCOUNTS.ID(owner), 'json');
  if (!account) {
    return new Response(`Not found (account ${owner} not registered)`, {
      status: 404,
    });
  }

  return fetchMeebit(env.FILES, {
    signature: account.authentication.signature,
    message: account.authentication.message,
    meebitID,
    extension,
  });
}
