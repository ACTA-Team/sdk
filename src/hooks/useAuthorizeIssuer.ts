import { useActaClient } from "../providers/ActaClientContext"
import { Address, BASE_FEE, Contract, TransactionBuilder, Account, rpc } from "@stellar/stellar-sdk"

/** Function that signs an unsigned XDR with the given network passphrase. */
type Signer = (unsignedXdr: string, opts: { networkPassphrase: string }) => Promise<string>

/**
 * Hook to authorize an issuer address in the Vault contract.
 * @returns `{ authorizeIssuer }` to build, sign, send, and wait for the tx.
 */
export function useAuthorizeIssuer() {
  const client = useActaClient()

  async function waitForTx(server: rpc.Server, hash: string) {
    for (let i = 0; i < 40; i++) {
      try {
        const res = (await server.getTransaction(hash)) as { status?: string }
        const status = res?.status
        if (status === "SUCCESS") return
        if (status === "FAILED") throw new Error("FAILED")
      } catch {}
      await new Promise((r) => setTimeout(r, 1200))
    }
  }

  return {
    /**
     * Authorize `issuer` for `owner` in the Vault.
     * @param args - Owner public key, issuer address, and signer.
     * @returns `{ txId }` of the submitted transaction.
     */
    authorizeIssuer: async (args: { owner: string; issuer: string; signTransaction: Signer }) => {
      const cfg = client.getDefaults()
      const { rpcUrl, networkPassphrase, vaultContractId } = cfg
      if (!vaultContractId) throw new Error("Vault contract ID not configured")
      const server = new rpc.Server(rpcUrl)
      const acct = await server.getAccount(args.owner)
      const seq = typeof (acct as any).sequence === "string" ? (acct as any).sequence : String(((acct as any).sequence ?? "0"))
      const account = new Account(args.owner, seq)
      const contract = new Contract(vaultContractId)
      let tx = new TransactionBuilder(account, { fee: BASE_FEE.toString(), networkPassphrase })
        .addOperation(contract.call("authorize_issuer", Address.fromString(args.owner).toScVal(), Address.fromString(args.issuer).toScVal()))
        .setTimeout(60)
        .build()
      tx = await server.prepareTransaction(tx)
      const signedXdr = await args.signTransaction(tx.toXDR(), { networkPassphrase })
      const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
      const send = await server.sendTransaction(signed)
      if (send.status === "PENDING" || send.status === "DUPLICATE" || send.status === "TRY_AGAIN_LATER") {
        await waitForTx(server, send.hash!)
      } else if (send.status === "ERROR") {
        throw new Error("ERROR")
      }
      return { txId: send.hash! }
    },
  }
}