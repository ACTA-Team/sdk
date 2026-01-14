import { useActaClient } from "../providers/ActaClientContext";
import { isTxPrepareResponse, isTxSubmitResponse } from "../types/api-responses";
import {
  normalizeDid,
  ensureContextInVcData,
} from "../utils/credential-helpers";

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
     * @returns Transaction ID of the submitted transaction.
     */
    issue: async (args: {
      /** Wallet address of the vault owner */
      owner: string;

      /** Credential ID */
      vcId: string;

      /** Credential data (object or JSON string). @context is added automatically */
      vcData: string | Record<string, unknown>;

      /** Wallet address of the issuer */
      issuer: string;

      /** Wallet address or DID of the holder (DID is constructed automatically if wallet address) */
      holder: string;

      /** Wallet address or DID of the issuer (DID is constructed automatically if wallet address) */
      issuerDid?: string;

      /** Function to sign transactions */
      signTransaction: Signer;

      /** Contract ID (optional, defaults to network contract) */
      contractId?: string;
    }) => {
      const cfg = await client.getConfig();
      const contractId = args.contractId || cfg.actaContractId;

      if (!contractId) throw new Error("Contract ID not configured");

      // Get network to construct DIDs
      const network = client.getNetwork();

      // Normalize holder and issuerDid to full DIDs
      const holderDid = normalizeDid(args.holder, network);
      const issuerDid = args.issuerDid
        ? normalizeDid(args.issuerDid, network)
        : undefined;

      // Ensure @context is present in vcData
      const vcDataWithContext = ensureContextInVcData(args.vcData);

      // Prepare the transaction via API
      const prepareResult = await client.vcIssue({
        owner: args.owner,
        vcId: args.vcId,
        vcData: vcDataWithContext,
        issuer: args.issuer,
        holder: holderDid,
        issuerDid: issuerDid,
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
     * @returns Transaction ID of the submitted transaction.
     */
    revoke: async (args: {
      /** Wallet address of the vault owner */
      owner: string;

      /** Credential ID to revoke */
      vcId: string;

      /** Function to sign transactions */
      signTransaction: Signer;

      /** Revocation date (ISO timestamp, optional, defaults to now) */
      date?: string;

      /** Contract ID (optional, defaults to network contract) */
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

