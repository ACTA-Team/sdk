import { useActaClient } from "../providers/ActaClientContext"

/**
 * Hook to prepare unsigned XDRs for store/issue/vault flows.
 * @returns `{ prepareStore, prepareIssue, prepareInitialize, prepareAuthorizeIssuer }` request builders.
 */
export function useTxPrepare() {
  const client = useActaClient()
  return {
    /** Build request for `/tx/prepare/store`. */
    prepareStore: (args: {
      owner: string
      vcId: string
      didUri: string
      fields: Record<string, unknown>
      vaultContractId?: string
      issuer?: string
    }) => client.prepareStoreTx(args),
    /** Build request for `/tx/prepare/issue`. */
    prepareIssue: (args: {
      owner: string
      vcId: string
      vcData: string
      vaultContractId?: string
      issuer?: string
      issuerDid?: string
    }) => client.prepareIssueTx(args),
    /** Build request for `/tx/prepare/list_vc_ids`. */
    prepareListVcIds: (args: { owner: string; vaultContractId?: string }) => client.prepareListVcIdsTx(args),
    /** Build request for `/tx/prepare/get_vc`. */
    prepareGetVc: (args: { owner: string; vcId: string; vaultContractId?: string }) => client.prepareGetVcTx(args),
    /** Build request for `/tx/prepare/initialize`. */
    prepareInitialize: (args: { owner: string; ownerDid: string; vaultContractId?: string }) => client.prepareInitializeTx(args),
    /** Build request for `/tx/prepare/authorize_issuer`. */
    prepareAuthorizeIssuer: (args: { owner: string; issuer: string; vaultContractId?: string }) => client.prepareAuthorizeIssuerTx(args),
  }
}