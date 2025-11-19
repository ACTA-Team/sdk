import axios, { AxiosInstance } from "axios";
import { baseURL } from "./types/types";
import { CreateCredentialPayload, CreateCredentialResponse } from "./types";

export class ActaClient {
  private axios: AxiosInstance;

  constructor(baseURL: baseURL, apiKey: string) {
    this.axios = axios.create({ baseURL });
    // if (apiKey) this.setApiKey(apiKey);
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

  getConfig() {
    return this.axios.get("/config").then((r) => r.data as {
      rpcUrl: string;
      networkPassphrase: string;
      issuanceContractId?: string;
      vaultContractId: string;
    });
  }

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

  vaultVerify(args: { owner: string; vcId: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/verify", args)
      .then((r) => r.data as { vc_id: string; status: string; since?: string });
  }

  verifyStatus(vcId: string) {
    return this.axios
      .get(`/verify/${encodeURIComponent(vcId)}`)
      .then((r) => r.data as { vc_id: string; status: string; since?: string });
  }

  vaultListVcIdsDirect(args: { owner: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/list_vc_ids_direct", args)
      .then((r) => r.data as { vc_ids?: string[]; result?: string[] });
  }

  vaultGetVcDirect(args: { owner: string; vcId: string; vaultContractId?: string }) {
    return this.axios
      .post("/vault/get_vc_direct", args)
      .then((r) => r.data as { vc?: unknown; result?: unknown });
  }
}
