import axios, { AxiosInstance } from "axios";
import { baseURL } from "./types/types";
import { CreateCredentialPayload, CreateCredentialResponse } from "./types";
import type {
  ConfigResponse,
  HealthResponse,
  TxPrepareResponse,
  TxSubmitResponse,
  VaultCreateResponse,
  VaultAuthorizeIssuerResponse,
  VaultRevokeIssuerResponse,
  VaultRevokeVaultResponse,
  VcIssueResponse,
  VcRevokeResponse,
  VaultListVcIdsResponse,
  VaultGetVcResponse,
  VaultVerifyVcResponse,
  VerifyStatusResponse,
  RevokeCredentialResponse,
} from "./types/api-responses";

/**
 * ACTA SDK HTTP client.
 *
 * Wraps ACTA API endpoints to issue, store, read, and verify credentials,
 * and to prepare transactions. The network is inferred from the `baseURL`.
 */
export class ActaClient {
  private axios: AxiosInstance;
  private network: "mainnet" | "testnet";
  private configCache: ConfigResponse | null = null;

  /**
   * Initialize a new client instance.
   * @param baseURL - Base API URL for ACTA services (mainnet or testnet).
   * @param apiKey - API key for authentication. If not provided, will be read from environment variables.
   * @throws Error if API key is not provided and environment variable is not set for the network.
   *
   * The API key is required and must be provided either as a parameter or via environment variables.
   * It is automatically configured in the X-ACTA-Key header for all requests.
   *
   * API keys are network-specific. Set in your .env file:
   * - ACTA_API_KEY_MAINNET=your-mainnet-api-key (for mainnet)
   * - ACTA_API_KEY_TESTNET=your-testnet-api-key (for testnet)
   *
   * Or use ACTA_API_KEY as fallback for both networks:
   * - ACTA_API_KEY=your-api-key (works for both networks)
   */
  constructor(baseURL: baseURL, apiKey?: string) {
    this.axios = axios.create({ baseURL });
    this.network = baseURL.includes("mainnet") ? "mainnet" : "testnet";

    // Use provided API key, or read from environment variable (network-specific or fallback)
    const env = typeof process !== "undefined" ? process.env : {};
    const networkSpecificKey =
      this.network === "mainnet"
        ? env.ACTA_API_KEY_MAINNET
        : env.ACTA_API_KEY_TESTNET;

    const finalApiKey = apiKey || networkSpecificKey || env.ACTA_API_KEY;

    if (!finalApiKey || finalApiKey.trim() === "") {
      const networkVar =
        this.network === "mainnet"
          ? "ACTA_API_KEY_MAINNET"
          : "ACTA_API_KEY_TESTNET";

      throw new Error(
        `API key is required for ${this.network}.\n` +
          `Provide it as a parameter or set it in your .env file:\n` +
          `- ${networkVar}=your-${this.network}-api-key (recommended)\n` +
          `- Or ACTA_API_KEY=your-api-key (fallback for both networks)\n\n` +
          `Get your API key from https://dapp.acta.build or create one via:\n` +
          `- POST /testnet/public/api-keys (for testnet)\n` +
          `- POST /mainnet/public/api-keys (for mainnet)`
      );
    }

    // Configure interceptor to automatically add API key header to all requests
    this.axios.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers["X-ACTA-Key"] = finalApiKey.trim();
      return config;
    });
  }

  /**
   * @deprecated Use vcIssue endpoint instead. This method is kept for backward compatibility but will be removed.
   * Create a new credential
   */
  createCredential(data: CreateCredentialPayload) {
    throw new Error(
      "createCredential is deprecated. Use vcIssue endpoint via useCreateCredential hook instead."
    );
  }

  /**
   * Get service health status.
   * @returns Service status, timestamp, and environment info.
   */
  getHealth(): Promise<HealthResponse> {
    return this.axios.get<HealthResponse>("/health").then((r) => r.data);
  }

  /**
   * Get configuration from the API.
   * @returns Configuration: `rpcUrl`, `networkPassphrase`, `actaContractId`.
   * @throws Error if the API is unavailable.
   */
  async getConfig(): Promise<ConfigResponse> {
    if (this.configCache) {
      return this.configCache;
    }

    const response = await this.axios.get<ConfigResponse>("/config");

    this.configCache = response.data;
    return this.configCache;
  }

  /**
   * Get default runtime configuration from the API.
   * @deprecated Use `getConfig()` instead. This method is kept for backward compatibility.
   * @returns Configuration from the API: `rpcUrl`, `networkPassphrase`, `actaContractId`.
   */
  async getDefaults() {
    const config = await this.getConfig();
    return {
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.networkPassphrase,
      actaContractId: config.actaContractId,
      // Legacy support - map to actaContractId
      issuanceContractId: config.actaContractId,
      vaultContractId: config.actaContractId,
    };
  }

  /**
   * Prepare an unsigned XDR to issue a credential (which stores it in the vault).
   * Uses the same endpoint as vcIssue but only prepares the transaction.
   * @param args - Arguments describing the credential details:
   *   - owner: Stellar account address (public key) that owns the credential vault
   *   - vcId: Unique identifier for the credential
   *   - vcData: JSON string containing the credential data/claims. MUST include "@context" field with at least:
   *     ["https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/examples/v2"]
   *   - issuer: Stellar account address (public key) of the credential issuer (who creates the credential)
   *   - holder: DID of the credential holder/recipient in format did:pkh:network:walletAddress
   *   - issuerDid: DID of the issuer in format did:pkh:network:walletAddress
   *   - sourcePublicKey: Stellar public key that will sign the transaction
   *   - contractId: Optional contract ID (defaults to network contract)
   * @returns `{ xdr, network }` to be signed by the caller.
   */
  prepareIssueTx(args: {
    /** Stellar account address (public key) that owns the credential vault */
    owner: string;

    /** Unique identifier for the credential */
    vcId: string;

    /** JSON string containing the credential data/claims. MUST include "@context" field with at least: ["https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/examples/v2"] */
    vcData: string;

    /** Stellar account address (public key) of the credential issuer (who creates the credential) */
    issuer: string;

    /** DID of the credential holder/recipient in format did:pkh:network:walletAddress */
    holder: string;

    /** DID of the issuer in format did:pkh:network:walletAddress */
    issuerDid?: string;

    /** Optional contract ID (defaults to network contract) */
    contractId?: string;

    /** Stellar public key that will sign the transaction */
    sourcePublicKey: string;
  }): Promise<TxPrepareResponse> {
    return this.vcIssue(args).then((r) => {
      if ("tx_id" in r) {
        throw new Error("Unexpected submit response in prepare mode");
      }
      if (!r.xdr || !r.network) {
        throw new Error(
          "Failed to prepare transaction: missing xdr or network"
        );
      }
      return {
        xdr: r.xdr,
        network: r.network,
      };
    });
  }

  /**
   * @deprecated Use vcIssue endpoint directly. This method is kept for backward compatibility.
   * Prepare an unsigned XDR to store a credential in the Vault.
   * Note: Storing is done via vcIssue which stores and marks as valid.
   */
  prepareStoreTx(args: {
    owner: string;
    vcId: string;
    didUri: string;
    fields: Record<string, unknown>;
    vaultContractId?: string;
    issuer?: string;
  }) {
    // Store is handled by vcIssue, so we redirect to that
    if (!args.issuer) {
      throw new Error("Issuer is required to issue/store a credential");
    }
    return this.prepareIssueTx({
      owner: args.owner,
      vcId: args.vcId,
      vcData: JSON.stringify(args.fields),
      issuer: args.issuer,
      holder: args.owner, // Use owner as holder for backward compatibility
      contractId: args.vaultContractId,
      sourcePublicKey: args.owner,
    });
  }

  /**
   * @deprecated These are read operations, not prepare operations. Use vaultListVcIdsDirect instead.
   * List VC IDs from the Vault (read operation, no XDR needed).
   */
  prepareListVcIdsTx(args: { owner: string; vaultContractId?: string }) {
    return this.vaultListVcIdsDirect(args).then(() => {
      throw new Error(
        "prepareListVcIdsTx is deprecated. Use vaultListVcIdsDirect for read operations."
      );
    });
  }

  /**
   * @deprecated These are read operations, not prepare operations. Use vaultGetVcDirect instead.
   * Fetch a VC from the Vault (read operation, no XDR needed).
   */
  prepareGetVcTx(args: {
    owner: string;
    vcId: string;
    vaultContractId?: string;
  }) {
    return this.vaultGetVcDirect(args).then(() => {
      throw new Error(
        "prepareGetVcTx is deprecated. Use vaultGetVcDirect for read operations."
      );
    });
  }

  /**
   * @deprecated Storing is handled automatically by vcIssue. Use vcIssue endpoint instead.
   * Submit a signed XDR to store a credential in the Vault.
   */
  vaultStore(payload: {
    signedXdr: string;
    vcId: string;
    owner?: string;
    vaultContractId?: string;
  }) {
    throw new Error(
      "vaultStore is deprecated. Credentials are stored automatically when issued via vcIssue. Use useIssueCredential hook instead."
    );
  }

  /**
   * Verify a credential against the Vault contract.
   * @param args - Owner, VC ID, and optional contract ID.
   * @returns Verification result with `status` and optional `since`.
   */
  vaultVerify(args: {
    owner: string;
    vcId: string;
    vaultContractId?: string;
    contractId?: string;
  }): Promise<VaultVerifyVcResponse> {
    const contractId = args.vaultContractId || args.contractId;
    return this.axios
      .post<VaultVerifyVcResponse>("/contracts/vault/verify-vc", {
        owner: args.owner,
        vcId: args.vcId,
        contractId,
      })
      .then((r) => r.data);
  }

  /**
   * Verify a credential status via the Issuance contract.
   * @param vcId - Credential identifier.
   * @returns Verification result with `vc_id`, `status`, and optional `since`.
   */
  verifyStatus(vcId: string): Promise<VerifyStatusResponse> {
    return this.axios
      .post<VerifyStatusResponse>(`/verify`, { vcId })
      .then((r) => r.data);
  }

  /**
   * List credential IDs directly from the Vault contract.
   * @param args - Owner and optional contract ID.
   * @returns `{ vc_ids }` or `{ result }` with IDs.
   */
  vaultListVcIdsDirect(args: {
    owner: string;
    vaultContractId?: string;
    contractId?: string;
  }): Promise<VaultListVcIdsResponse> {
    const contractId = args.vaultContractId || args.contractId;
    return this.axios
      .post<VaultListVcIdsResponse>("/contracts/vault/list-vc-ids", {
        owner: args.owner,
        contractId,
      })
      .then((r) => r.data);
  }

  /**
   * List VC IDs in the Vault using either signed XDR or direct owner payload.
   * @param payload - Either `{ signedXdr }` or `{ owner, vaultContractId? }`.
   * @returns `{ vc_ids }` or `{ result }` with IDs.
   */
  vaultListVcIds(
    payload: { signedXdr: string } | { owner: string; vaultContractId?: string }
  ): Promise<VaultListVcIdsResponse> {
    return this.axios
      .post<VaultListVcIdsResponse>("/vault/list_vc_ids", payload)
      .then((r) => r.data);
  }

  /**
   * Read a credential directly from the Vault contract.
   * @param args - Owner, VC ID, and optional contract ID.
   * @returns `{ vc }` or `{ result }` with credential contents.
   */
  vaultGetVcDirect(args: {
    owner: string;
    vcId: string;
    vaultContractId?: string;
    contractId?: string;
  }): Promise<VaultGetVcResponse> {
    const contractId = args.vaultContractId || args.contractId;
    return this.axios
      .post<VaultGetVcResponse>("/contracts/vault/get-vc", {
        owner: args.owner,
        vcId: args.vcId,
        contractId,
      })
      .then((r) => r.data);
  }

  /**
   * Fetch a VC from the Vault using either signed XDR or direct owner payload.
   * @param payload - Either `{ signedXdr }` or `{ owner, vcId, vaultContractId? }`.
   * @returns `{ vc }` or `{ result }` with credential contents.
   */
  vaultGetVc(
    payload:
      | { signedXdr: string }
      | { owner: string; vcId: string; vaultContractId?: string }
  ): Promise<VaultGetVcResponse> {
    return this.axios
      .post<VaultGetVcResponse>("/vault/get_vc", payload)
      .then((r) => r.data);
  }

  /**
   * Revoke an issuer in the Vault using either signed XDR or direct owner payload.
   * @param payload - Either `{ signedXdr }` or `{ owner, issuer, vaultContractId }`.
   * @returns `{ tx_id }` of the revoke transaction.
   */
  vaultRevokeIssuer(
    payload:
      | { signedXdr: string }
      | { owner: string; issuer: string; vaultContractId: string }
  ): Promise<TxSubmitResponse> {
    return this.axios
      .post<TxSubmitResponse>("/vault/revoke_issuer", payload)
      .then((r) => r.data);
  }

  /**
   * Verify credential status via GET (legacy compatibility).
   * @param vcId - Credential identifier.
   * @returns Verification result with `vc_id`, `status`, and optional `since`.
   */
  verifyStatusGet(vcId: string): Promise<VerifyStatusResponse> {
    return this.axios
      .get<VerifyStatusResponse>(`/verify/${encodeURIComponent(vcId)}`)
      .then((r) => r.data);
  }

  /**
   * Revoke a credential via the Issuance contract (admin-signed on server).
   * @param payload - `{ vcId, date? }` where `date` defaults to current ISO timestamp.
   * @returns `{ vc_id, tx_id }` of the revoke transaction.
   */
  revokeCredential(payload: {
    vcId: string;
    date?: string;
  }): Promise<RevokeCredentialResponse> {
    return this.axios
      .post<RevokeCredentialResponse>("/issuance/revoke", payload)
      .then((r) => r.data);
  }

  /**
   * Create (initialize) a vault for an owner via the API.
   * Can prepare an unsigned XDR or submit a signed XDR.
   * @param payload - Either prepare mode: `{ owner, didUri, sourcePublicKey, contractId? }`
   *                  or submit mode: `{ signedXdr }`
   * @returns Prepare mode: `{ xdr, network }` or Submit mode: `{ tx_id }`
   */
  vaultCreate(
    payload:
      | {
          owner: string;
          didUri: string;
          sourcePublicKey: string;
          contractId?: string;
        }
      | { signedXdr: string }
  ): Promise<VaultCreateResponse> {
    return this.axios
      .post<VaultCreateResponse>("/contracts/vault/create", payload)
      .then((r) => r.data);
  }

  /**
   * Authorize an issuer in a vault via the API.
   * Can prepare an unsigned XDR or submit a signed XDR.
   * @param payload - Either prepare mode: `{ owner, issuer, sourcePublicKey, contractId? }`
   *                  or submit mode: `{ signedXdr }`
   * @returns Prepare mode: `{ xdr, network }` or Submit mode: `{ tx_id }`
   */
  vaultAuthorizeIssuer(
    payload:
      | {
          owner: string;
          issuer: string;
          sourcePublicKey: string;
          contractId?: string;
        }
      | { signedXdr: string }
  ): Promise<VaultAuthorizeIssuerResponse> {
    return this.axios
      .post<VaultAuthorizeIssuerResponse>(
        "/contracts/vault/authorize-issuer",
        payload
      )
      .then((r) => r.data);
  }

  /**
   * Revoke a credential via the API.
   * Can prepare an unsigned XDR or submit a signed XDR.
   * @param payload - Either prepare mode: `{ vcId, date?, sourcePublicKey, contractId? }`
   *                  or submit mode: `{ signedXdr }`
   * @returns Prepare mode: `{ xdr, network }` or Submit mode: `{ tx_id }`
   */
  revokeCredentialViaApi(
    payload:
      | {
          vcId: string;
          date?: string;
          sourcePublicKey: string;
          contractId?: string;
        }
      | { signedXdr: string }
  ): Promise<VcRevokeResponse> {
    return this.axios
      .post<VcRevokeResponse>("/contracts/vc/revoke", payload)
      .then((r) => r.data);
  }

  /**
   * Revoke (disable) a vault for an owner via the API.
   * Can prepare an unsigned XDR or submit a signed XDR.
   * @param payload - Either prepare mode: `{ owner, sourcePublicKey, contractId? }`
   *                  or submit mode: `{ signedXdr }`
   * @returns Prepare mode: `{ xdr, network }` or Submit mode: `{ tx_id }`
   */
  vaultRevokeVault(
    payload:
      | {
          owner: string;
          sourcePublicKey: string;
          contractId?: string;
        }
      | { signedXdr: string }
  ): Promise<VaultRevokeVaultResponse> {
    return this.axios
      .post<VaultRevokeVaultResponse>("/contracts/vault/revoke-vault", payload)
      .then((r) => r.data);
  }

  /**
   * Revoke (remove) an authorized issuer from a vault via the API.
   * Can prepare an unsigned XDR or submit a signed XDR.
   * @param payload - Either prepare mode: `{ owner, issuer, sourcePublicKey, contractId? }`
   *                  or submit mode: `{ signedXdr }`
   * @returns Prepare mode: `{ xdr, network }` or Submit mode: `{ tx_id }`
   */
  vaultRevokeIssuerViaApi(
    payload:
      | {
          owner: string;
          issuer: string;
          sourcePublicKey: string;
          contractId?: string;
        }
      | { signedXdr: string }
  ): Promise<VaultRevokeIssuerResponse> {
    return this.axios
      .post<VaultRevokeIssuerResponse>(
        "/contracts/vault/revoke-issuer",
        payload
      )
      .then((r) => r.data);
  }

  /**
   * Issue a credential via the API (stores in vault and marks as valid).
   * Can prepare an unsigned XDR or submit a signed XDR.
   * @param payload - Either prepare mode with credential details, or submit mode with signed XDR:
   *   - owner: Stellar account address (public key) that owns the credential vault
   *   - vcId: Unique identifier for the credential
   *   - vcData: JSON string containing the credential data/claims. MUST include "@context" field with at least:
   *     ["https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/examples/v2"]
   *   - issuer: Stellar account address (public key) of the credential issuer (who creates the credential)
   *   - holder: DID of the credential holder/recipient in format did:pkh:network:walletAddress
   *   - issuerDid: DID of the issuer in format did:pkh:network:walletAddress
   *   - sourcePublicKey: Stellar public key that will sign the transaction
   *   - contractId: Optional contract ID (defaults to network contract)
   *   - signedXdr: For submit mode, the signed XDR transaction string
   * @returns Prepare mode: `{ xdr, network }` or Submit mode: `{ tx_id }`
   */
  vcIssue(
    payload:
      | {
          /** Stellar account address (public key) that owns the credential vault */
          owner: string;

          /** Unique identifier for the credential */
          vcId: string;

          /** JSON string containing the credential data/claims. MUST include "@context" field with at least: ["https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/examples/v2"] */
          vcData: string;

          /** Stellar account address (public key) of the credential issuer (who creates the credential) */
          issuer: string;

          /** DID of the credential holder/recipient in format did:pkh:network:walletAddress */
          holder: string;

          /** DID of the issuer in format did:pkh:network:walletAddress */
          issuerDid?: string;

          /** Stellar public key that will sign the transaction */
          sourcePublicKey: string;

          /** Optional contract ID (defaults to network contract) */
          contractId?: string;
        }
      | { signedXdr: string }
  ): Promise<VcIssueResponse> {
    return this.axios
      .post<VcIssueResponse>("/contracts/vc/issue", payload)
      .then((r) => r.data);
  }
}
