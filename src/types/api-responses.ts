/**
 * API Response Types
 * Type definitions for all ACTA API endpoint responses
 */

/**
 * Configuration response from /config endpoint
 */
export interface ConfigResponse {
  rpcUrl: string;
  networkPassphrase: string;
  actaContractId: string;
}

/**
 * Health check response from /health endpoint
 */
export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  port?: number | string;
  env?: Record<string, unknown>;
}

/**
 * Transaction preparation response (prepare mode)
 * Returns unsigned XDR and network passphrase
 */
export interface TxPrepareResponse {
  xdr: string;
  network: string;
}

/**
 * Transaction submission response (submit mode)
 * Returns transaction ID
 */
export interface TxSubmitResponse {
  tx_id: string;
}

/**
 * Combined response for endpoints that support both prepare and submit
 * Type guard helpers are available to distinguish between prepare and submit responses
 */
export type TxResponse = TxPrepareResponse | TxSubmitResponse;

/**
 * Type guard to check if response is a prepare response
 */
export function isTxPrepareResponse(
  response: TxResponse
): response is TxPrepareResponse {
  return "xdr" in response && "network" in response;
}

/**
 * Type guard to check if response is a submit response
 */
export function isTxSubmitResponse(
  response: TxResponse
): response is TxSubmitResponse {
  return "tx_id" in response;
}

/**
 * Vault create response
 */
export type VaultCreateResponse = TxResponse;

/**
 * Vault authorize issuer response
 */
export type VaultAuthorizeIssuerResponse = TxResponse;

/**
 * Vault revoke issuer response
 */
export type VaultRevokeIssuerResponse = TxResponse;

/**
 * VC issue response
 */
export type VcIssueResponse = TxResponse;

/**
 * VC revoke response
 */
export type VcRevokeResponse = TxResponse;

/**
 * Vault revoke vault response
 */
export type VaultRevokeVaultResponse = TxResponse;

/**
 * Vault list VC IDs response
 */
export interface VaultListVcIdsResponse {
  vc_ids?: string[];
  result?: string[];
}

/**
 * Vault get VC response
 */
export interface VaultGetVcResponse {
  vc?: unknown;
  result?: unknown;
}

/**
 * Vault verify VC response
 */
export interface VaultVerifyVcResponse {
  status: "valid" | "revoked";
  since?: string;
}

/**
 * Legacy verification response (for backward compatibility)
 */
export interface VerifyStatusResponse {
  vc_id: string;
  status: string;
  since?: string;
}

/**
 * Revoke credential response (legacy endpoint)
 */
export interface RevokeCredentialResponse {
  vc_id: string;
  tx_id: string;
}
