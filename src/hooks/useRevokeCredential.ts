import { useActaClient } from "../providers/ActaClientContext"
import { BASE_FEE, Contract, TransactionBuilder, Account, rpc, xdr } from "@stellar/stellar-sdk"

type Signer = (unsignedXdr: string, opts: { networkPassphrase: string }) => Promise<string>

export function useRevokeCredential() {
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
    revokeCredential: async (args: { owner: string; vcId: string; signTransaction: Signer }) => {
      const cfg = client.getDefaults()
      const { rpcUrl, networkPassphrase, issuanceContractId } = cfg
      if (!issuanceContractId) throw new Error("Issuance contract ID not configured")
      const server = new rpc.Server(rpcUrl)
      const acct = await server.getAccount(args.owner)
      const seq = typeof (acct as any).sequence === "string" ? (acct as any).sequence : String(((acct as any).sequence ?? "0"))
      const account = new Account(args.owner, seq)
      const contract = new Contract(issuanceContractId)
      let tx = new TransactionBuilder(account, { fee: BASE_FEE.toString(), networkPassphrase })
        .addOperation(contract.call("revoke", xdr.ScVal.scvString(args.vcId), xdr.ScVal.scvString(new Date().toISOString())))
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