import axios, { AxiosInstance } from "axios";
import { baseURL } from "./types/types";
import { CreateCredentialPayload, CreateCredentialResponse } from "./types";

export class ActaClient {
  private axios: AxiosInstance;

  constructor(baseURL: baseURL, apiKey: string) {
    this.axios = axios.create({ baseURL });
    // if (apiKey) this.setApiKey(apiKey);
  }

  /**
   * Create a new credential
   * @param data - The data to create a new credential
   * @returns The response from the API CreateCredentialResponse
   */
  createCredential(data: CreateCredentialPayload) {
    return this.axios
      .post<CreateCredentialResponse>("/credentials", data)
      .then((r) => r.data);
  }
}
