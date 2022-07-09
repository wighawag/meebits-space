export type ChainParameters = {
  name: string;
  fallbackUrl?: string;
  finality: number;
  blockTime: number;
  nativeTokenSymbol: string;
  nativeTokenName: string;
  nativeTokenDecimal: number;
};
export const chainParameters: { [chainId: string]: ChainParameters } = {
  '1': {
    name: 'Mainnet',
    finality: 12,
    blockTime: 15,
    nativeTokenSymbol: 'ETH',
    nativeTokenName: 'ETH',
    nativeTokenDecimal: 18,
  },
  '3': {
    name: 'Ropsten',
    finality: 12, // TODO
    blockTime: 15, // TODO
    nativeTokenSymbol: 'ETH',
    nativeTokenName: 'Ropsten ETH',
    nativeTokenDecimal: 18,
  },
  '4': {
    name: 'Rinkeby',
    finality: 12, // TODO
    blockTime: 15, // TODO
    nativeTokenSymbol: 'ETH',
    nativeTokenName: 'Rinkeby ETH',
    nativeTokenDecimal: 18,
  },
  '5': {
    name: 'Goerli',
    finality: 12, // TODO
    blockTime: 15, // TODO
    nativeTokenSymbol: 'ETH',
    nativeTokenName: 'Goerli ETH',
    nativeTokenDecimal: 18,
  },
  '42': {
    name: 'Kovan',
    finality: 12, // TODO
    blockTime: 15, // TODO
    nativeTokenSymbol: 'ETH',
    nativeTokenName: 'Kovan ETH',
    nativeTokenDecimal: 18,
  },
  '100': {
    name: 'Gnosis Chain',
    finality: 8, // TODO
    blockTime: 5,
    nativeTokenSymbol: 'XDAI',
    nativeTokenName: 'XDAI',
    nativeTokenDecimal: 18,
  },
  '1337': {
    name: 'localhost Chain',
    finality: 3,
    blockTime: 5, // TODO allow to get it from the chain
    nativeTokenSymbol: 'ETH',
    nativeTokenName: 'Local ETH',
    nativeTokenDecimal: 18,
  },
  '31337': {
    name: 'localhost Chain',
    finality: 3,
    blockTime: 5, // TODO allow to get it from the chain
    nativeTokenSymbol: 'ETH',
    nativeTokenName: 'Local ETH',
    nativeTokenDecimal: 18,
  },
};

export function nameForChainId(chainId: string): string {
  const params = chainParameters[chainId];
  if (params) {
    return params.name;
  }
  return `chain with id ${chainId}`;
}
