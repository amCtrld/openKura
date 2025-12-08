# OpenKura - Decentralized Voting System

A modern, blockchain-powered voting platform built with Next.js and Ethereum. Features secure, transparent, and tamper-proof elections on Sepolia testnet.

## 🌟 Features

- **Blockchain-Secured Voting**: All votes are recorded on Ethereum blockchain
- **Transparent Elections**: Complete voting transparency and auditability  
- **Real-time Results**: Live vote counts and participant tracking
- **MetaMask Integration**: Seamless wallet connection for voting
- **Admin Dashboard**: Create and manage elections
- **Responsive Design**: Modern UI works on all devices
- **Firebase Integration**: Metadata storage for enhanced user experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MetaMask browser extension
- Sepolia testnet ETH (for deployment)

### 1. Installation

```bash
# Clone and navigate to project
cd openqura

# Install dependencies
npm install

# Install Hardhat dependencies for smart contract deployment
npm install @nomicfoundation/hardhat-toolbox hardhat dotenv --save-dev
```

### 2. Environment Setup

Copy `.env` and configure:

```bash
## Sepolia Configuration
SEPOLIA_INFURA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

## Smart Contract (Will be set after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=

## For Contract Deployment
PRIVATE_KEY=your_wallet_private_key_for_deployment
ETHERSCAN_API_KEY=your_etherscan_api_key_for_verification

## Firebase Configuration (Already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB5-6fUilBbvDR6y8gMCGVB4DjqT-S_CDE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=openkura.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=openkura
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=openkura.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1063974556750
NEXT_PUBLIC_FIREBASE_APP_ID=1:1063974556750:web:a32164a5fcee17ad741f1f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-9YPLNHG4F9
```

### 3. Deploy Smart Contract

**Option A: Deploy to Sepolia Testnet (Recommended)**

```bash
# Compile contract
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

**Option B: Local Development**

```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy locally
npm run deploy:localhost
```

After deployment, copy the contract address and add it to `.env`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x123...your_contract_address
```

### 4. Run Application

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

## 📱 Usage

### For Voters

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Browse Elections**: View active elections on the homepage
3. **Cast Vote**: Click on an election → Click "Cast Vote" → Confirm transaction
4. **View Results**: See real-time vote counts and voter addresses

### For Administrators

1. **Access Admin Panel**: Navigate to `/admin`
2. **Create Elections**: Use the "Create Election" button
3. **Manage Elections**: View, edit, or end elections
4. **Monitor Stats**: Track participation and voting metrics

## 🏗️ Project Structure

```
openqura/
├── app/                    # Next.js pages
│   ├── admin/             # Admin dashboard
│   └── vote/[id]/         # Individual election pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── *.tsx             # Feature-specific components
├── contracts/            # Smart contracts
│   └── VotingSystem.sol  # Main voting contract
├── lib/                  # Utilities and hooks
│   ├── contract.ts       # Contract interaction logic
│   ├── use-wallet.ts     # Wallet connection hook
│   └── use-voting-contract.ts # Voting operations hook
├── scripts/              # Deployment scripts
└── types/                # TypeScript definitions
```

## 🔧 Smart Contract Features

The `VotingSystem.sol` contract provides:

- **Election Creation**: Create elections with title, description, and end time
- **Secure Voting**: One vote per address, tamper-proof recording
- **Vote Tracking**: Real-time vote counts and voter lists
- **Election Management**: End elections, check status
- **Gas Optimization**: Efficient storage and retrieval

### Key Functions

```solidity
// Create a new election
createElection(title, description, endTime) → electionId

// Cast a vote
vote(electionId)

// Check voting status
hasVoted(electionId, voterAddress) → bool
getTotalVotes(electionId) → uint256
getVoters(electionId) → address[]

// Get election details  
getElection(electionId) → (title, description, endTime, isActive, totalVotes)
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run compile      # Compile smart contracts
npm run deploy:sepolia   # Deploy to Sepolia testnet  
npm run deploy:localhost # Deploy to local network
npm run node         # Start local Hardhat node
npm run test:contract    # Run contract tests
```

### Testing

The application includes comprehensive testing:

- **Frontend**: React component testing
- **Smart Contracts**: Hardhat test suite
- **Integration**: End-to-end voting flow tests

## 🔗 Network Configuration

### Sepolia Testnet

- **Network Name**: Sepolia Test Network
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- **Chain ID**: 11155111
- **Currency**: SepoliaETH
- **Block Explorer**: https://sepolia.etherscan.io

### Getting Test ETH

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Request test ETH for deployment and transactions

## 🔒 Security Considerations

- **Smart Contract Audited**: Core voting logic reviewed for vulnerabilities
- **Reentrancy Protection**: Safe external calls and state updates
- **Access Controls**: Owner-only functions for sensitive operations
- **Input Validation**: Comprehensive parameter checking
- **Gas Optimization**: Efficient contract design

## 🚀 Deployment to Production

### 1. Mainnet Preparation

```bash
# Update hardhat.config.js for mainnet
networks: {
  mainnet: {
    url: process.env.MAINNET_URL,
    accounts: [process.env.PRIVATE_KEY],
  }
}
```

### 2. Deploy Contract

```bash
npm run deploy:mainnet
```

### 3. Update Frontend Configuration

```bash
# Update .env for production
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...mainnet_contract_address
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
```

### 4. Build and Deploy

```bash
npm run build
# Deploy to Vercel, Netlify, or your hosting platform
```

## 📊 Monitoring and Analytics

- **Transaction Monitoring**: Track all voting transactions on Etherscan
- **Gas Usage**: Monitor contract interaction costs
- **User Analytics**: Firebase Analytics for user engagement
- **Error Tracking**: Comprehensive error logging and alerting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important Notes

- **Testnet Only**: Currently configured for Sepolia testnet
- **Gas Costs**: Consider gas prices for mainnet deployment
- **Private Keys**: Never commit private keys to version control
- **Backup**: Always backup your wallet and private keys
- **Testing**: Thoroughly test on testnet before mainnet deployment

## 📞 Support

- **Issues**: Create GitHub issues for bugs and feature requests
- **Documentation**: Check inline code comments for detailed explanations
- **Community**: Join our Discord for real-time support

---

**Built with ❤️ for transparent democracy on the blockchain**