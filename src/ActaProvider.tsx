"use client";

import React, { ReactNode, useContext, useState } from "react";
import { baseURL } from "./types/types";
import { ActaClient } from "./client";

const ActaContext = React.createContext<{
  client: ActaClient | null;
}>({ client: null });

export interface ActaConfigProps {
  baseURL: baseURL;
  apiKey: string;
  children: ReactNode;
}

export const ActaConfig = ({ baseURL, apiKey, children }: ActaConfigProps) => {
  const [client] = useState(() => new ActaClient(baseURL, apiKey));

  return (
    <ActaContext.Provider value={{ client }}>{children}</ActaContext.Provider>
  );
};

export function useActaClient() {
  const ctx = useContext(ActaContext);

  if (!ctx.client) {
    throw new Error("useActaClient must be inside ActaConfig");
  }

  return ctx.client;
}
