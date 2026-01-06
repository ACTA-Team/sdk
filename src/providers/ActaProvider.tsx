"use client";

import React, { useState } from "react";
import { baseURL } from "../types/types";
import { ActaClient } from "../client";
import { ActaProviderContext, useActaClient } from "./ActaClientContext";

export interface ActaConfigProps {
  baseURL: baseURL;
  children: any;
}

/**
 * React provider that instantiates and exposes an `ActaClient`.
 * Wrap your app with this component to make the client available via `useActaClient()`.
 * 
 * The API key is automatically read from ACTA_API_KEY environment variable.
 * Set it in your .env file:
 * 
 * ACTA_API_KEY=your-api-key-here
 * 
 * API keys have roles (admin, standard, custom, early) that determine:
 * - Which endpoints can be accessed
 * - What fees are applied to transactions
 * 
 * Get your API key from https://dapp.acta.build or create one via:
 * - POST /testnet/public/api-keys (for testnet)
 * - POST /mainnet/public/api-keys (for mainnet)
 * 
 * @example
 * // .env: ACTA_API_KEY=your-api-key
 * <ActaConfig baseURL={mainNet}>
 *   <App />
 * </ActaConfig>
 */
export const ActaConfig = ({ baseURL, children }: ActaConfigProps) => {
  const [client] = useState(() => new ActaClient(baseURL));

  return (
    <ActaProviderContext.Provider value={{ client }}>{children}</ActaProviderContext.Provider>
  );
};
