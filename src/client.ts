import axios, { AxiosInstance } from "axios";
import { baseURL, DEFAULT_VAULT_CONTRACT_ID, DEFAULT_ISSUANCE_CONTRACT_ID, DEFAULT_RPC_URL, DEFAULT_NETWORK_PASSPHRASE } from "./types/types";
import { CreateCredentialPayload, CreateCredentialResponse } from "./types";

/**
 * ACTA SDK HTTP client.
 *
 * Wraps ACTA API endpoints to issue, store, read, and verify credentials,
 * and to prepare transactions. The network is inferred from the `baseURL`.
 */
export class ActaClient {
  private axios: AxiosInstance;
  private network: "mainnet" | "testnet";

  /**
   * Initialize a new client instance.
   * @param baseURL - Base API URL for ACTA services (mainnet or testnet).
   * @param apiKey - Optional API key for authenticated endpoints.
   */
  constructor(baseURL: baseURL, apiKey: string) {
    this.axios = axios.create({ baseURL });
    this.network = baseURL.includes("mainnet") ? "mainnet" : "testnet";
    if (apiKey) this.setApiKey(apiKey);
  }

  /**
   * Set the API key for the client
   * @param apiKey - The API key to set
   */
  setApiKey(apiKey: string) {
    this.axios.interceptors.request.clear();
    this.axios.interceptors.request.use((config) => {
      config.headers = config.headers ?? {};
      config.headers["x-api-key"] = apiKey;
      return config;
    });
  }

  /**
   * Create a new credential
   * @param data - The data to create a new credential
   * @returns The response from the API CreateCredentialResponse
   */
  createCredential(data: CreateCredentialPayload) {
    return this.axios
      .post<CreateCredentialResponse>("/credentials", data)
      .then((r) => r.data);
  }

  /**
   * Get service health status.
   * @returns Service status, timestamp, and environment info.
   */
  getHealth() {
    return this.axios.get("/health").then((r) => r.data as {
      status: string;
      timestamp: string;
      service: string;
      port?: number | string;
      env?: Record<string, unknown>;
    });
  }

  /**
   * Get default runtime configuration inferred from network.
   * @returns Defaults: `rpcUrl`, `networkPassphrase`, `issuanceContractId`, `vaultContractId`.
   */
  getDefaults() {
    const net = this.network;
    return {
      rpcUrl: DEFAULT_RPC_URL[net],
      networkPassphrase: DEFAULT_NETWORK_PASSPHRASE[net],
      issuanceContractId: DEFAULT_ISSUANCE_CONTRACT_ID[net],
      vaultContractId: DEFAULT_VAULT_CONTRACT_ID[net],
    };
  }

  /**
   * Prepare an unsigned XDR to store a credential in the Vault.
   * @param args - Arguments describing the owner, VC, DID, and fields.
   * @returns `{ unsignedXdr }` to be signed by the caller.
   */
  prepareStoreTx(args: {
    owner: string;
    vcId: string;
    didUri: string;
    fields: Record<string, unknown>;
    vaultContractId?: string;
    issuer?: string;
  }) {
    return this.axios
      .post("/tx/prepare/store", args)
      .then((r) => r.data as { unsignedXdr: string });
  }

  /**
   * Prepare an unsigned XDR to issue a credential via the Issuance contract.
   * @param args - Arguments describing the owner, VC ID, and VC data.
   * @returns `{ unsignedXdr }` to be signed by the caller.
   */
  prepareIssueTx(args: {
    owner: string;
    vcId: string;
    vcData: string;
    vaultContractId?: string;
    issuer?: string;
    issuerDid?: string;
  }) {
    return this.axios
      .post("/tx/prepare/issue", args)
      .then((r) => r.data as { unsignedXdr: string });
  }

  /**
   * Prepare an unsigned XDR to list VC IDs from the Vault.
   * @param args - `{ owner, vaultContractId? }` identifying the owner and optional Vault contract.
   * @returns `{ unsignedXdr }` to be signed by the caller.
   */
  prepareListVcIdsTx(args: { owner: string; vaultContractId?: string }) {
    return this.axios
      .post("/tx/prepare/list_vc_ids", args)
      .then((r) => r.data as { unsignedXdr: string });
  }

  /**
   * Prepare an unsigned XDR to fetch a VC from the Vault.
   * @param args - `{ owner, vcId, vaultContractId? }` describing the VC to read.
   * @returns `{ unsignedXdr }` to be signed by the caller.
   */
  prepareGetVcTx(args: { owner: string; vcId: string; vaultContractId?: string }) {
    return this.axios
      .post("/tx/prepare/get_vc", args)
      .then((r) => r.data as { unsignedXdr: string });
  }

  /**
   * Prepare an unsigned XDR to initialize a Vault.
   * @param args - `{ owner, ownerDid, vaultContractId? }` describing the vault to initialize.
   * @returns `{ unsignedXdr }` to be signed by the caller.
   */
  prepareInitializeTx(args: { owner: string; ownerDid: string; vaultContractId?: string }) {
    return this.axios
      .post("/tx/prepare/initialize", args)
      .then((r) => r.data as { unsignedXdr: string });
  }

  /**
   * Prepare an unsigned XDR to authorize an issuer in the Vault.
   * @param args - `{ owner, issuer, vaultContractId? }` describing the issuer to authorize.
   * @returns `{ unsignedXdr }` to be signed by the caller.
   */
  prepareAuthorizeIssuerTx(args: { owner: string; issuer: string; vaultContractId?: string }) {
    return this.axios
      .post("/tx/prepare/authorize_issuer", args)
      .then((r) => r.data as { unsignedXdr: string });
  }

  /**
   * Submit a signed XDR to store a credential in the Vault.
   * @param payload - Signed XDR and identifiers.
   * @returns Store result with `vc_id`, `tx_id`, optional `issue_tx_id`, and `verification`.
   */
  vaultStore(payload: {
    signedXdr: string;
    vcId: string;
    owner?: string;
    vaultContractId?: string;
  }) {
    return this.axios.post("/vault/store", payload).then((r) => r.data as {
      vc_id: string;
      tx_id: string;
      issue_tx_id?: string;
      verification?: { status?: string; since?: string };
    });
  }

  /**
   * Verify a credential against the Vault contract.
   * @param args - Owner, VC ID, and optional Vault contract ID.
   * @returns Verification result with `vc_id`, `status`, and optional `since`.
   */
  vaultVerify(args: { owner: string; vcId: string; vaultContractId?: string }) {
    return this.axios
      .post("/verify", args)
      .then((r) => r.data as { vc_id: string; status: string; since?: string });
  }

  /**
   * Verify a credential status via the Issuance contract.
   * @param vcId - Credential identifier.
   * @returns Verification result with `vc_id`, `status`, and optional `since`.
   */
  verifyStatus(vcId: string) {
    return this.axios
      .post(`/verify`, { vcId })
      .then((r) => r.data as { vc_id: string; status: string; since?: string });
  }

  /**
   * List credential IDs directly from the Vault contract.
   * @param args - Owner and optional Vault contract ID.
   * @returns `{ vc_ids }` or `{ result }` with IDs.
   */
  vaultListVcIdsDirect(args: { owner: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/list_vc_ids", args)
      .then((r) => r.data as { vc_ids?: string[]; result?: string[] });
  }

  /**
   * List VC IDs in the Vault using either signed XDR or direct owner payload.
   * @param payload - Either `{ signedXdr }` or `{ owner, vaultContractId? }`.
   * @returns `{ vc_ids }` or `{ result }` with IDs.
   */
  vaultListVcIds(payload: { signedXdr: string } | { owner: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/list_vc_ids", payload)
      .then((r) => r.data as { vc_ids?: string[]; result?: string[] });
  }

  /**
   * Read a credential directly from the Vault contract.
   * @param args - Owner, VC ID, and optional Vault contract ID.
   * @returns `{ vc }` or `{ result }` with credential contents.
   */
  vaultGetVcDirect(args: { owner: string; vcId: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/get_vc", args)
      .then((r) => r.data as { vc?: unknown; result?: unknown });
  }

  /**
   * Fetch a VC from the Vault using either signed XDR or direct owner payload.
   * @param payload - Either `{ signedXdr }` or `{ owner, vcId, vaultContractId? }`.
   * @returns `{ vc }` or `{ result }` with credential contents.
   */
  vaultGetVc(payload: { signedXdr: string } | { owner: string; vcId: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/get_vc", payload)
      .then((r) => r.data as { vc?: unknown; result?: unknown });
  }

  /**
   * Revoke an issuer in the Vault using either signed XDR or direct owner payload.
   * @param payload - Either `{ signedXdr }` or `{ owner, issuer, vaultContractId }`.
   * @returns `{ tx_id }` of the revoke transaction.
   */
  vaultRevokeIssuer(payload: { signedXdr: string } | { owner: string; issuer: string; vaultContractId: string }) {
    return this.axios
      .post("/vault/revoke_issuer", payload)
      .then((r) => r.data as { tx_id: string });
  }

  /**
   * Verify credential status via GET (legacy compatibility).
   * @param vcId - Credential identifier.
   * @returns Verification result with `vc_id`, `status`, and optional `since`.
   */
  verifyStatusGet(vcId: string) {
    return this.axios
      .get(`/verify/${encodeURIComponent(vcId)}`)
      .then((r) => r.data as { vc_id: string; status: string; since?: string });
  }

  /**
   * Revoke a credential via the Issuance contract (admin-signed on server).
   * @param payload - `{ vcId, date? }` where `date` defaults to current ISO timestamp.
   * @returns `{ vc_id, tx_id }` of the revoke transaction.
   */
  revokeCredential(payload: { vcId: string; date?: string }) {
    return this.axios
      .post('/issuance/revoke', payload)
      .then((r) => r.data as { vc_id: string; tx_id: string });
  }

  /**
   * Initialize a Vault for an owner via the API.
   * @param payload - `{ signedXdr }` (signed transaction) or `{ owner, ownerDid, vaultContractId? }` (direct call).
   * @returns `{ tx_id }` of the initialize transaction.
   */
  vaultInitialize(payload: { signedXdr: string } | { owner: string; ownerDid: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/initialize", payload)
      .then((r) => r.data as { tx_id: string });
  }

  /**
   * Authorize an issuer in the Vault via the API.
   * @param payload - `{ signedXdr }` (signed transaction) or `{ owner, issuer, vaultContractId? }` (direct call).
   * @returns `{ tx_id }` of the authorize transaction.
   */
  vaultAuthorizeIssuer(payload: { signedXdr: string } | { owner: string; issuer: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/authorize_issuer", payload)
      .then((r) => r.data as { tx_id: string });
  }
}
