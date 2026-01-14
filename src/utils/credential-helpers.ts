/**
 * Helper functions for credential operations.
 */

/**
 * Build a DID from wallet address and network.
 * @param walletAddress - Stellar wallet address
 * @param network - Network type (mainnet or testnet)
 * @param blockchain - Blockchain name (default: "stellar")
 * @returns DID in format did:pkh:{blockchain}:{network}:{walletAddress}
 */
export function buildDidFromAddress(
  walletAddress: string,
  network: "mainnet" | "testnet",
  blockchain: string = "stellar"
): string {
  return `did:pkh:${blockchain}:${network}:${walletAddress}`;
}

/**
 * Normalize a DID or wallet address to a full DID format.
 * If already a DID, returns as-is. Otherwise constructs from wallet address.
 * @param didOrAddress - Either a full DID or a wallet address
 * @param network - Network type (mainnet or testnet)
 * @param blockchain - Blockchain name (default: "stellar")
 * @returns Full DID string
 */
export function normalizeDid(
  didOrAddress: string,
  network: "mainnet" | "testnet",
  blockchain: string = "stellar"
): string {
  // If it already starts with "did:", assume it's already a full DID
  if (didOrAddress.startsWith("did:")) {
    return didOrAddress;
  }
  // Otherwise, construct the DID from the wallet address
  return buildDidFromAddress(didOrAddress, network, blockchain);
}

/**
 * Ensure vcData includes @context field.
 * If vcData is a string (JSON), parses it and adds @context if missing.
 * If vcData is an object, adds @context if missing.
 * @param vcData - Credential data as JSON string or object
 * @returns JSON string with @context included
 */
export function ensureContextInVcData(
  vcData: string | Record<string, unknown>
): string {
  const requiredContext = [
    "https://www.w3.org/ns/credentials/v2",
    "https://www.w3.org/ns/credentials/examples/v2",
  ];

  let data: Record<string, unknown>;
  
  if (typeof vcData === "string") {
    try {
      data = JSON.parse(vcData);
    } catch (e) {
      throw new Error(
        `Invalid JSON in vcData: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  } else {
    data = { ...vcData };
  }

  // Add @context if not present or not properly formatted
  if (!data["@context"] || !Array.isArray(data["@context"])) {
    data["@context"] = requiredContext;
  } else {
    // Ensure required context URLs are present
    const existingContext = data["@context"] as string[];
    const missingContext = requiredContext.filter(
      (url) => !existingContext.includes(url)
    );
    if (missingContext.length > 0) {
      data["@context"] = [...existingContext, ...missingContext];
    }
  }

  return JSON.stringify(data);
}
