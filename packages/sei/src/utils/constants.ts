export interface IToken {
  id: string;
  attributes: {
    address: `0x${string}`;
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: string;
    logoUrl: string;
  };
}

export const SEI_RPC_URL = "https://evm-rpc.sei-apis.com/";
// Common Tokens on Sei
export const TOKENS: { [key: `0x${string}`]: IToken } = {
  "0x0": {
    id: "sei_native_sei",
    attributes: {
      address: "0x0",
      name: "sei",
      symbol: "sei",
      decimals: 18,
      initialSupply: "",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/Sei.png",
    },
  },
  "0x5f0e07dfee5832faa00c63f2d33a0d79150e8598": {
    id: "sei_0x5f0e07dfee5832faa00c63f2d33a0d79150e8598",
    attributes: {
      address: "0x5f0e07dfee5832faa00c63f2d33a0d79150e8598",
      name: "seiyan",
      symbol: "seiyan",
      decimals: 6,
      initialSupply: "1000000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/SEIYAN.png",
    },
  },
  "0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7": {
    id: "sei_0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7",
    attributes: {
      address: "0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7",
      name: "wrapped sei",
      symbol: "wsei",
      decimals: 18,
      initialSupply: "10000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/Sei.png",
    },
  },
  "0x5cf6826140c1c56ff49c808a1a75407cd1df9423": {
    id: "sei_0x5cf6826140c1c56ff49c808a1a75407cd1df9423",
    attributes: {
      address: "0x5cf6826140c1c56ff49c808a1a75407cd1df9423",
      name: "isei",
      symbol: "isei",
      decimals: 6,
      initialSupply: "10000000000000000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/iSEI.png",
    },
  },
  "0x3894085ef7ff0f0aedf52e2a2704928d1ec074f1": {
    id: "sei_0x3894085ef7ff0f0aedf52e2a2704928d1ec074f1",
    attributes: {
      address: "0x3894085ef7ff0f0aedf52e2a2704928d1ec074f1",
      name: "usd coin",
      symbol: "usdc",
      decimals: 6,
      initialSupply: "10000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/USDCoin.svg",
    },
  },
  "0xb75d0b03c06a926e488e2659df1a861f860bd3d1": {
    id: "sei_0xb75d0b03c06a926e488e2659df1a861f860bd3d1",
    attributes: {
      address: "0xb75d0b03c06a926e488e2659df1a861f860bd3d1",
      name: "tether usd",
      symbol: "usdt",
      decimals: 6,
      initialSupply: "10000000000000000000000000000000",
      logoUrl:
        "https://assets.coingecko.com/coins/images/325/standard/Tether.png?1696501661",
    },
  },
  "0x160345fc359604fc6e70e3c5facbde5f7a9342d8": {
    id: "sei_0x160345fc359604fc6e70e3c5facbde5f7a9342d8",
    attributes: {
      address: "0x160345fc359604fc6e70e3c5facbde5f7a9342d8",
      name: "bridged wrapped ether (stargate)",
      symbol: "weth",
      decimals: 18,
      initialSupply: "10000000000000000000000000000000",
      logoUrl:
        "https://raw.githubusercontent.com/Sei-Public-Goods/sei-assetlist/main/images/BridgedWrappedEther(Stargate).png",
    },
  },
} as const;
