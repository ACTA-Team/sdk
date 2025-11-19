export type CreateCredentialPayload =
  | {
      signedXdr: string;
      vcId: string;
    }
  | {
      owner: string;
      vcId: string;
      vcData: string;
      vaultContractId: string;
      didUri?: string;
    };
