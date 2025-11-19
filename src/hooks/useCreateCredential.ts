import { useActaClient } from "../ActaProvider";
import { CreateCredentialPayload } from "../types";

/**
 * Use the useCreateCredential hook to create a new credential.
 * @returns A function to create a new credential.
 */
export function useCreateCredential() {
  const client = useActaClient();

  return {
    createCredential: (payload: CreateCredentialPayload) =>
      client.createCredential(payload),
  };
}
