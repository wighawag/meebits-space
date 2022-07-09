import { chainParameters, nameForChainId } from './lib/utils/networks';
import {
  getParamsFromLocation,
  getHashParamsFromLocation,
} from './lib/utils/web';

let root = undefined;
if (typeof window !== 'undefined') {
  root =
    window.location.protocol +
    '//' +
    window.location.host +
    (window as any).BASE;
}
console.log(`VERSION: ${__APP_VERSION__}`);

export const hashParams = getHashParamsFromLocation();
export const { params } = getParamsFromLocation();
// export const VERSION = '1';

const chainId = (import.meta.env.VITE_CHAIN_ID as string) || '1';
const {
  finality,
  blockTime,
  nativeTokenDecimal,
  nativeTokenName,
  nativeTokenSymbol,
} = chainParameters[chainId];
let fallbackURL: string | undefined;

let webWalletURL: string | undefined = import.meta.env
  .VITE_WEB_WALLET_ETH_NODE as string | undefined;
if (webWalletURL && webWalletURL.startsWith('__')) {
  webWalletURL = undefined;
}

let localDev = false;
if (chainId === '1337' || chainId === '31337') {
  localDev = true;
  fallbackURL = import.meta.env.VITE_ETH_NODE_URI_LOCALHOST as string;
  if (fallbackURL && fallbackURL.startsWith('__')) {
    fallbackURL = undefined;
  }
  let webWalletURLFromENV = import.meta.env
    .VITE_WEB_WALLET_ETH_NODE_LOCALHOST as string;
  if (webWalletURLFromENV && webWalletURLFromENV.startsWith('__')) {
    webWalletURLFromENV = undefined;
  }
  if (webWalletURLFromENV) {
    webWalletURL = webWalletURLFromENV;
  }

  // const localEthNode = import.meta.env.VITE_ETH_NODE_URI_LOCALHOST as string;
  // if (localEthNode && localEthNode !== '') {
  //   fallbackURL = localEthNode;
  // } else {
  //   fallbackURL = 'http://localhost:8545';
  // }
}

const chainName = nameForChainId(chainId);

if (!fallbackURL) {
  const url = import.meta.env.VITE_ETH_NODE_URI as string; // TODO use query string to specify it // TODO settings
  if (url && url !== '' && !url.startsWith('__')) {
    fallbackURL = url;
  }
}

const lowFrequencyFetch = blockTime * 8;
const mediumFrequencyFetch = blockTime * 4;
const highFrequencyFetch = blockTime * 2;

const globalQueryParams = [
  'debug',
  'log',
  'subgraph',
  'ethnode',
  '_d_eruda',
  'options',
];

const version = __APP_VERSION__;

const options: { [option: string]: boolean } = {};
if (params['options']) {
  const splitted = params['options'].split(',');
  for (const split of splitted) {
    options[split] = true;
  }
}

const serverURL = params.server || (import.meta.env.VITE_SERVER as string);

export {
  finality,
  fallbackURL,
  webWalletURL,
  chainId,
  blockTime,
  chainName,
  nativeTokenSymbol,
  nativeTokenName,
  nativeTokenDecimal,
  lowFrequencyFetch,
  mediumFrequencyFetch,
  highFrequencyFetch,
  globalQueryParams,
  localDev,
  version,
  options,
  serverURL,
};

if (typeof window !== 'undefined') {
  (window as any).env = import.meta.env;
}
