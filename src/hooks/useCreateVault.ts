import { useActaClient } from "../providers/ActaClientContext"

/** Function that signs an unsigned XDR with the given network passphrase. */
type Signer = (unsignedXdr: string, opts: { networkPassphrase: string }) => Promise<string>

/**
 * Hook to initialize a Vault for an owner.
 * @returns `{ createVault }` to prepare, sign, and send the `initialize` tx via the API.
 */
export function useCreateVault() {
  const client = useActaClient()

  return {
    /**
     * Create a new Vault bound to `owner` and `ownerDid`.
     * @param args - Owner public key, owner DID, signer, and optional vault contract ID.
     * @returns `{ tx_id }` of the submitted transaction.
     */
    createVault: async (args: { owner: string; ownerDid: string; signTransaction: Signer; vaultContractId?: string }) => {
      const cfg = client.getDefaults()
      const { networkPassphrase } = cfg
      
      // Prepare the transaction via API
      const { unsignedXdr } = await client.prepareInitializeTx({
        owner: args.owner,
        ownerDid: args.ownerDid,
        vaultContractId: args.vaultContractId,
      })
      
      // Sign the transaction
      const signedXdr = await args.signTransaction(unsignedXdr, { networkPassphrase })
      
      // Submit via API
      const result = await client.vaultInitialize({ signedXdr })
      return { txId: result.tx_id }
    },
  }
}