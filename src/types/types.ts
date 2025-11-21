/**
 * Base API URL type for ACTA services.
 */
export type baseURL =
  | "https://acta.build/api/mainnet"
  | "https://acta.build/api/testnet";

/** Default Vault contract IDs per network. */
export const DEFAULT_VAULT_CONTRACT_ID = {
  mainnet: "CAN2LSCQQGY6K2TZYZELHVNMXHMVNJBNII4RH2VTHMMJEWOTK2IFZYJF",
  testnet: "CDK642PLEPCQH7WUBLHYYSKRJZOUIRIPY7GXQRHOETGR2JJ76UK6SWLZ",
};

/** Default Issuance contract IDs per network. */
export const DEFAULT_ISSUANCE_CONTRACT_ID = {
  mainnet: "CB7SUT2VJUEIIQR4JZKSWTH3QMDY3NJWXP532BCRRSMKLH45UPN6O5AA",
  testnet: "CDQ6543O3WFZ6I5BVCAO3BQCOSGQECCTLIBBTOTNCGQGCDHXBS43FKX3",
};

/** Default USDC issuer IDs per network. */
export const DEFAULT_USDC_ISSUER = {
  mainnet: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  testnet: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
};

/** Default Soroban RPC URLs per network. */
export const DEFAULT_RPC_URL = {
  mainnet: "https://soroban.stellar.org",
  testnet: "https://soroban-testnet.stellar.org",
};

/** Default network passphrases per network. */
export const DEFAULT_NETWORK_PASSPHRASE = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015",
};
