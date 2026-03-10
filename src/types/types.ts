/**
 * Base API URL type for ACTA services.
 */
export type baseURL =
  | "https://acta.build/api/mainnet"
  | "https://acta.build/api/testnet";

export interface ActaConfigProps {
  baseURL: baseURL;
  children: any;
  apiKey?: string;
}
