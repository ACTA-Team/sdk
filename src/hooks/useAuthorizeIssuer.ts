import { useActaClient } from "../providers/ActaClientContext"

/** Function that signs an unsigned XDR with the given network passphrase. */
type Signer = (unsignedXdr: string, opts: { networkPassphrase: string }) => Promise<string>

/**
 * Hook to authorize an issuer address in the Vault contract.
 * @returns `{ authorizeIssuer }` to prepare, sign, and send the tx via the API.
 */
export function useAuthorizeIssuer() {
  const client = useActaClient()

  return {
    /**
     * Authorize `issuer` for `owner` in the Vault.
     * @param args - Owner public key, issuer address, signer, and optional vault contract ID.
     * @returns `{ tx_id }` of the submitted transaction.
     */
    authorizeIssuer: async (args: { owner: string; issuer: string; signTransaction: Signer; vaultContractId?: string }) => {
      const cfg = client.getDefaults()
      const { networkPassphrase } = cfg
      
      // Prepare the transaction via API
      const { unsignedXdr } = await client.prepareAuthorizeIssuerTx({
        owner: args.owner,
        issuer: args.issuer,
        vaultContractId: args.vaultContractId,
      })
      
      // Sign the transaction
      const signedXdr = await args.signTransaction(unsignedXdr, { networkPassphrase })
      
      // Submit via API
      const result = await client.vaultAuthorizeIssuer({ signedXdr })
      return { txId: result.tx_id }
    },
  }
}