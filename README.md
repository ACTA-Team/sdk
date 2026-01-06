# ACTA SDK

React SDK to interact with ACTA API and manage verifiable credentials on Stellar blockchain.

## Quick Start

```bash
npm install @acta-team/acta-sdk
```

```typescript
import { ActaConfig, mainNet, useVault } from '@acta-team/acta-sdk';

// Configure API key in .env: ACTA_API_KEY_MAINNET=your-api-key
<ActaConfig baseURL={mainNet}>
  <App />
</ActaConfig>
```

## Documentation

📖 **[Full Documentation →](./docs/README.md)**

The complete guide includes:

- Installation and configuration
- All available hooks (`useVault`, `useCredential`, `useVaultRead`)
- Code examples
- Transaction flow
- API keys and roles

## Features

- ✅ **API-driven**: 100% integrated with ACTA API
- ✅ **Type-safe**: Full TypeScript support
- ✅ **React hooks**: Idiomatic React usage
- ✅ **Multi-network**: Supports mainnet and testnet
- ✅ **Auto-configuration**: Fetches network config dynamically

## License

MIT
