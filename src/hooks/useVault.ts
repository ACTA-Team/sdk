import { useActaClient } from "../providers/ActaClientContext";
import { isTxPrepareResponse, isTxSubmitResponse } from "../types/api-responses";

/** Function that signs an unsigned XDR with the given network passphrase. */
type Signer = (
  unsignedXdr: string,
  opts: { networkPassphrase: string }
) => Promise<string>;

/**
 * Hook for vault operations: create, authorize issuer, revoke issuer.
 * @returns Methods to manage vault operations via the API.
 */
export function useVault() {
  const client = useActaClient();

  return {
    /**
     * Create (initialize) a vault for an owner.
     * @returns Transaction ID of the submitted transaction.
     */
    createVault: async (args: {
      /** Wallet address of the vault owner */
      owner: string;

      /** DID of the vault owner */
      ownerDid: string;

      /** Function to sign transactions */
      signTransaction: Signer;

      /** Contract ID (optional, defaults to network contract) */
      contractId?: string;
    }) => {
      const cfg = await client.getConfig();
      const contractId = args.contractId || cfg.actaContractId;

      if (!contractId) throw new Error("Contract ID not configured");

      // Prepare the transaction via API
      const prepareResult = await client.vaultCreate({
        owner: args.owner,
        didUri: args.ownerDid,
        sourcePublicKey: args.owner,
        contractId: contractId,
      });

      if (!isTxPrepareResponse(prepareResult)) {
        throw new Error("Failed to prepare vault creation transaction");
      }

      // Sign the transaction
      const signedXdr = await args.signTransaction(prepareResult.xdr, {
        networkPassphrase: prepareResult.network,
      });

      // Submit the signed transaction via API
      const submitResult = await client.vaultCreate({ signedXdr });

      if (!isTxSubmitResponse(submitResult)) {
        throw new Error("Failed to submit vault creation transaction");
      }

      return { txId: submitResult.tx_id };
    },

    /**
     * Authorize an issuer in a vault.
     * @returns Transaction ID of the submitted transaction.
     */
    authorizeIssuer: async (args: {
      /** Wallet address of the vault owner */
      owner: string;

      /** Wallet address of the issuer to authorize */
      issuer: string;

      /** Function to sign transactions */
      signTransaction: Signer;

      /** Contract ID (optional, defaults to network contract) */
      contractId?: string;
    }) => {
      const cfg = await client.getConfig();
      const contractId = args.contractId || cfg.actaContractId;

      if (!contractId) throw new Error("Contract ID not configured");

      // Prepare the transaction via API
      const prepareResult = await client.vaultAuthorizeIssuer({
        owner: args.owner,
        issuer: args.issuer,
        sourcePublicKey: args.owner,
        contractId: contractId,
      });

      if (!isTxPrepareResponse(prepareResult)) {
        throw new Error("Failed to prepare authorize issuer transaction");
      }

      // Sign the transaction
      const signedXdr = await args.signTransaction(prepareResult.xdr, {
        networkPassphrase: prepareResult.network,
      });

      // Submit the signed transaction via API
      const submitResult = await client.vaultAuthorizeIssuer({ signedXdr });

      if (!isTxSubmitResponse(submitResult)) {
        throw new Error("Failed to submit authorize issuer transaction");
      }

      return { txId: submitResult.tx_id };
    },

    /**
     * Revoke (remove) an authorized issuer from a vault.
     * @returns Transaction ID of the submitted transaction.
     */
    revokeIssuer: async (args: {
      /** Wallet address of the vault owner */
      owner: string;

      /** Wallet address of the issuer to revoke */
      issuer: string;

      /** Function to sign transactions */
      signTransaction: Signer;

      /** Contract ID (optional, defaults to network contract) */
      contractId?: string;
    }) => {
      const cfg = await client.getConfig();
      const contractId = args.contractId || cfg.actaContractId;

      if (!contractId) throw new Error("Contract ID not configured");

      // Prepare the transaction via API
      const prepareResult = await client.vaultRevokeIssuerViaApi({
        owner: args.owner,
        issuer: args.issuer,
        sourcePublicKey: args.owner,
        contractId: contractId,
      });

      if (!isTxPrepareResponse(prepareResult)) {
        throw new Error("Failed to prepare revoke issuer transaction");
      }

      // Sign the transaction
      const signedXdr = await args.signTransaction(prepareResult.xdr, {
        networkPassphrase: prepareResult.network,
      });

      // Submit the signed transaction via API
      const submitResult = await client.vaultRevokeIssuerViaApi({ signedXdr });

      if (!isTxSubmitResponse(submitResult)) {
        throw new Error("Failed to submit revoke issuer transaction");
      }

      return { txId: submitResult.tx_id };
    },
  };
}
