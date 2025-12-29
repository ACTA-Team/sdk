import { useActaClient } from "../providers/ActaClientContext"

/**
 * Hook to revoke a credential via the API.
 * @returns `{ revokeCredential }` to revoke a credential via the Issuance contract (admin-signed on server).
 */
export function useRevokeCredential() {
  const client = useActaClient()

  return {
    /**
     * Revoke a credential via the Issuance contract.
     * @param payload - `{ vcId, date? }` where `date` defaults to current ISO timestamp.
     * @returns `{ tx_id }` of the revoke transaction.
     */
    revokeCredential: (payload: { vcId: string; date?: string }) => {
      return client.revokeCredential(payload).then((r) => ({ txId: r.tx_id }))
    },
  }
}