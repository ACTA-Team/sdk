import { useActaClient } from "../ActaProvider"

export function useTxPrepare() {
  const client = useActaClient()
  return {
    prepareStore: (args: {
      owner: string
      vcId: string
      didUri: string
      fields: Record<string, unknown>
      vaultContractId?: string
      issuer?: string
    }) => client.prepareStoreTx(args),
    prepareIssue: (args: {
      owner: string
      vcId: string
      vcData: string
      vaultContractId?: string
      issuer?: string
      issuerDid?: string
    }) => client.prepareIssueTx(args),
  }
}