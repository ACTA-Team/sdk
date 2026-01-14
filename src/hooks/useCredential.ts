import { useActaClient } from "../providers/ActaClientContext";
import { isTxPrepareResponse, isTxSubmitResponse } from "../types/api-responses";

/** Function that signs an unsigned XDR with the given network passphrase. */
type Signer = (
  unsignedXdr: string,
  opts: { networkPassphrase: string }
) => Promise<string>;

/**
 * Hook for credential operations: issue and revoke.
 * @returns Methods to manage credentials via the API.
 */
export function useCredential() {
  const client = useActaClient();

  return {
    /**
     * Issue a credential (stores in vault and marks as valid).
     * @param args - Credential details:
     *   - owner: Stellar account address (public key) that owns the credential vault
     *   - vcId: Unique identifier for the credential
     *   - vcData: JSON string containing the credential data/claims. MUST include "@context" field with at least:
     *     ["https://www.w3.org/ns/credentials/v2", "https://www.w3.org/ns/credentials/examples/v2"]
     *   - issuer: Stellar account address (public key) of the credential issuer (who creates the credential)
     *   - holder: DID of the credential holder/recipient in format did:pkh:network:walletAddress
     *   - issuerDid: DID of the issuer in format did:pkh:network:walletAddress
     *   - signTransaction: Function to sign the XDR transaction
     *   - contractId: Optional contract ID (defaults to network contract)
     * @returns `{ txId }` of the submitted transaction.
     */
    issue: async (args: {
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
      /** Function to sign the XDR transaction */
      signTransaction: Signer;
      /** Optional contract ID (defaults to network contract) */
      contractId?: string;
    }) => {
      const cfg = await client.getConfig();
      const contractId = args.contractId || cfg.actaContractId;

      if (!contractId) throw new Error("Contract ID not configured");

      // Prepare the transaction via API
      const prepareResult = await client.vcIssue({
        owner: args.owner,
        vcId: args.vcId,
        vcData: args.vcData,
        issuer: args.issuer,
        holder: args.holder,
        issuerDid: args.issuerDid,
        sourcePublicKey: args.issuer,
        contractId: contractId,
      });

      if (!isTxPrepareResponse(prepareResult)) {
        throw new Error("Failed to prepare issue credential transaction");
      }

      // Sign the transaction
      const signedXdr = await args.signTransaction(prepareResult.xdr, {
        networkPassphrase: prepareResult.network,
      });

      // Submit the signed transaction via API
      const submitResult = await client.vcIssue({ signedXdr });

      if (!isTxSubmitResponse(submitResult)) {
        throw new Error("Failed to submit issue credential transaction");
      }

      return { txId: submitResult.tx_id };
    },

    /**
     * Revoke a credential.
     * @param args - Owner, VC ID, signer, optional date, and optional contract ID.
     * @returns `{ txId }` of the submitted transaction.
     */
    revoke: async (args: {
      owner: string;
      vcId: string;
      signTransaction: Signer;
      date?: string;
      contractId?: string;
    }) => {
      const cfg = await client.getConfig();
      const contractId = args.contractId || cfg.actaContractId;

      if (!contractId) throw new Error("Contract ID not configured");

      // Prepare the transaction via API
      const prepareResult = await client.revokeCredentialViaApi({
        vcId: args.vcId,
        date: args.date || new Date().toISOString(),
        sourcePublicKey: args.owner,
        contractId: contractId,
      });

      if (!isTxPrepareResponse(prepareResult)) {
        throw new Error("Failed to prepare revoke credential transaction");
      }

      // Sign the transaction
      const signedXdr = await args.signTransaction(prepareResult.xdr, {
        networkPassphrase: prepareResult.network,
      });

      // Submit the signed transaction via API
      const submitResult = await client.revokeCredentialViaApi({ signedXdr });

      if (!isTxSubmitResponse(submitResult)) {
        throw new Error("Failed to submit revoke credential transaction");
      }

      return { txId: submitResult.tx_id };
    },
  };
}

