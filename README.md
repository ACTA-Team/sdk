# ACTA SDK

Concise overview for judges and contributors to understand what the SDK is and how it works.

## Overview
- React-friendly SDK to interact with ACTA’s credential services on Stellar.
- Typed client, hooks, and provider to manage VCs, vault operations, and issuer authorization.
- Designed for dApps that issue, store, and verify credentials on `mainnet` or `testnet`.

## Core Concepts
- Verifiable Credential (VC): Signed, portable proof bound to a subject (`vc_id`).
- Vault: On-chain contract that stores and verifies VCs per owner.
- Issuance Contract: On-chain contract responsible for issuing credentials.
- Network: Auto-detected from the base URL; defaults applied per network.

## Architecture
- Provider: Wrap React trees with `ActaConfig` to supply a configured `ActaClient` via context.
  - `src/providers/ActaProvider.tsx:14`
- Client: `ActaClient` wraps ACTA HTTP APIs for config, transaction prep, vault ops, and verification.
  - `src/client.ts:5`
- Hooks: Thin wrappers around the client for idiomatic React usage.
  - `src/hooks/index.ts:4`
- Entry points and constants: `src/index.ts:4`, `src/types/types.ts:8`.

## Exports
- Root (`acta-sdk`): `ActaConfig`, `useActaClient`, `mainNet`, `testNet`, hooks, and types.
- Subpaths:
  - `acta-sdk/types` → typed payloads and responses.
  - `acta-sdk/hooks` → React hooks.
- See `package.json:10` for export map; build outputs under `dist`.

## Client Surface
- Configuration
  - `getConfig()` → resolves RPC URL, network passphrase, and contract IDs (with defaults).
    - `src/client.ts:26`, defaults in `src/types/types.ts:8`.
- Credential Issuance
  - `createCredential(payload)` → creates a VC via `/credentials`.
    - `src/client.ts:20`, payload in `src/types/type.payload.ts:1`, response in `src/types/types.response.ts:1`.
- Transaction Preparation (unsigned XDR)
  - `prepareStoreTx(args)` → `/tx/prepare/store` returns `{ unsignedXdr }`.
    - `src/client.ts:44`
  - `prepareIssueTx(args)` → `/tx/prepare/issue` returns `{ unsignedXdr }`.
    - `src/client.ts:57`
- Vault API
  - `vaultStore(payload)` → submit signed XDR to store a credential.
    - `src/client.ts:70`
  - `vaultVerify(args)` → verify credential status in the vault.
    - `src/client.ts:84`
  - `vaultListVcIdsDirect(args)`, `vaultGetVcDirect(args)` → direct reads.
    - `src/client.ts:96`
- Verification
  - `verifyStatus(vcId)` → current verification status.
    - `src/client.ts:90`

## React Hooks
- `useConfig()` → `{ getConfig }` (`src/hooks/useConfig.ts:3`).
- `useCreateCredential()` → `{ createCredential }` (`src/hooks/useCreateCredential.ts:8`).
- `useTxPrepare()` → `{ prepareStore, prepareIssue }` (`src/hooks/useTxPrepare.ts:3`).
- `useVaultStore()` → `{ vaultStore }` (`src/hooks/useVaultStore.ts:3`).
- `useVaultApi()` → `{ listVcIdsDirect, getVcDirect, verifyInVault }` (`src/hooks/useVaultApi.ts:3`).
- `useAuthorizeIssuer()` → authorize issuer in the vault contract (`src/hooks/useAuthorizeIssuer.ts:6`).
- `useCreateVault()` → initialize vault for an owner (`src/hooks/useCreateVault.ts:6`).

## Typical Flows
- Initialize a vault for an owner
  - Retrieve config → build `initialize` tx → sign XDR → submit → wait.
- Authorize an issuer for a vault
  - Retrieve config → build `authorize_issuer` tx → sign → submit → confirm.
- Issue a credential
  - Server-driven via `createCredential(payload)` or client-driven via `prepareIssueTx` + sign.
- Store and verify in the vault
  - Prepare `store` XDR → sign → `vaultStore()` → `vaultVerify()` or `verifyStatus()`.
- Read credentials
  - `vaultListVcIdsDirect()` to list IDs; `vaultGetVcDirect()` to fetch VC content.

## Networks & Contracts
- Base URLs
  - `mainNet`: `https://acta.build/api/mainnet` (`src/index.ts:8`).
  - `testNet`: `https://acta.build/api/testnet` (`src/index.ts:9`).
- Default Contract IDs (used when server does not provide overrides)
  - Vault: `src/types/types.ts:8`.
  - Issuance: `src/types/types.ts:13`.
- Default USDC issuer IDs: `src/types/types.ts:18`.

## Transactions & Signing
- The SDK prepares unsigned XDR locally (vault ops) or via ACTA endpoints.
- Applications must supply a signer: `signTransaction(unsignedXdr, { networkPassphrase })`.
- Hooks handle send-and-wait via Stellar RPC; see `useCreateVault()` and `useAuthorizeIssuer()`.

## Error Handling
- `useActaClient()` throws outside `ActaConfig` (`src/providers/ActaClientContext.ts:6`).
- Network selection is inferred from `baseURL` (`src/client.ts:9`).
- Vault operations require `vaultContractId`; defaults applied or hooks throw (`src/hooks/useCreateVault.ts:25`, `src/hooks/useAuthorizeIssuer.ts:25`).
- Direct reads may return `null`; callers should handle accordingly (`src/hooks/useVaultApi.ts:6`).

## Build & Distribution
- Build: `npm run build` using `tsup` to produce ESM, CJS, and `d.ts` (`package.json:27`).
- Exports: root and subpaths in `package.json:10`.
- Peer Dependencies: `react`, `react-dom` `>=18 <20` (`package.json:55`).

## Glossary
- `VC`: Verifiable Credential.
- `Vault`: Smart contract for storing/verifying VCs per owner.
- `XDR`: External Data Representation for Stellar transactions.
- `RPC`: Remote Procedure Call endpoint used to fetch accounts and submit transactions.