/** Minimal human-written ABIs — only what the UI calls. */

export const FLOW_ABI = [
  {
    type: "function",
    name: "createStream",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "ratePerSecond", type: "uint256" },
      { name: "initialFunding", type: "uint256" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "fundStream",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setPaused",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "paused", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "closeStream",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "streamOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "payer", type: "address" },
      { name: "recipient", type: "address" },
      { name: "ratePerSecond", type: "uint256" },
      { name: "balance", type: "uint256" },
      { name: "start", type: "uint64" },
      { name: "paused", type: "bool" },
      { name: "accrued", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "streamIdsFor",
    stateMutability: "view",
    inputs: [{ name: "who", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
] as const;

export const SPLIT_ABI = [
  {
    type: "function",
    name: "createSplit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "payees", type: "address[]" },
      { name: "sharesBps", type: "uint16[]" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "depositAndSplit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "splitOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "payees", type: "address[]" },
      { name: "sharesBps", type: "uint16[]" },
    ],
  },
  {
    type: "function",
    name: "splitIdsFor",
    stateMutability: "view",
    inputs: [{ name: "who", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const FLOW_EVENTS = {
  StreamCreated: "event StreamCreated(uint256 indexed id, address indexed payer, address indexed recipient, uint256 ratePerSecond, uint256 funded, uint64 start)",
} as const;

export const SPLIT_EVENTS = {
  SplitCreated: "event SplitCreated(uint256 indexed id, address indexed owner, address[] payees, uint16[] sharesBps)",
} as const;
