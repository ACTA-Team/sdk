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

📖 **[Full Documentation →](https://docs.acta.build)**

The complete guide includes:

- Installation and configuration
- All available hooks (`useVault`, `useCredential`, `useVaultRead`)
- Code examples
- Transaction flow
- API keys and roles

## License

MIT License – see the LICENSE file for details.T
