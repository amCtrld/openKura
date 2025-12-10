# openKura Setup Guide: Step-by-Step Instructions

This guide will walk you through setting up the openKura decentralized voting system from scratch, including obtaining API keys and configuring all necessary services.

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask** browser extension - [Install here](https://metamask.io/)
- A **code editor** (VS Code recommended)

## 🚀 Quick Start

### 1. Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/amCtrld/openKura.git
cd openKura/openqura

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `openqura` directory:

```bash
# Create .env file
touch .env
```

## 🔑 API Keys Setup Guide

### 1. Infura Setup (Ethereum RPC Provider)

**Why needed:** To connect to Ethereum blockchain without running your own node.

1. Go to [Infura.io](https://infura.io/)
2. Sign up for a free account
3. Create a new project
4. Select "Web3 API" as the product
5. Name your project (e.g., "openKura")
6. Copy the **Project ID** from the dashboard
7. Your Sepolia URL will be: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### 2. Firebase Setup (Database & Authentication)

**Why needed:** For admin authentication and metadata storage.

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "openkura-voting")
4. Disable Google Analytics (optional)
5. Click "Create project"

#### Enable Authentication
1. In Firebase console, go to **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

#### Setup Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select your preferred location
4. Click **Done**

#### Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click **Web app** icon (`</>`): 
4. Register app with a nickname (e.g., "openKura")
5. Copy the `firebaseConfig` object values

### 3. Etherscan API Setup (Optional - for contract verification)

**Why needed:** To verify deployed contracts on Etherscan.

1. Go to [Etherscan.io](https://etherscan.io/)
2. Create an account and log in
3. Go to [API Keys page](https://etherscan.io/apis)
4. Click "Add" to create a new API key
5. Name it (e.g., "openKura") and create
6. Copy the generated API key

### 4. MetaMask Wallet Setup

**Why needed:** For deploying contracts and testing voting.

1. Install MetaMask browser extension
2. Create a new wallet or import existing one
3. **IMPORTANT:** Use a test wallet with no real funds for development
4. Switch to **Sepolia testnet**:
   - Click network dropdown in MetaMask
   - Enable "Show test networks" in settings if not visible
   - Select "Sepolia test network"
5. Get test ETH from [Sepolia faucet](https://sepoliafaucet.com/)

### 5. Export Private Key (For Deployment Only)

⚠️ **Security Warning:** Never use wallets with real funds for development!

1. In MetaMask, click three dots → Account details
2. Click "Export private key"
3. Enter your password
4. Copy the private key (starts with 0x)

## 📝 Complete .env Configuration

Create your `.env` file with all the obtained values:

```bash
## Ethereum Network Configuration
SEPOLIA_INFURA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

## Smart Contract Configuration
# Will be populated after deployment
NEXT_PUBLIC_CONTRACT_ADDRESS=

## Deployment Configuration
PRIVATE_KEY=your_metamask_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here

## Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Example .env with placeholder values:
```bash
## Ethereum Network Configuration
SEPOLIA_INFURA_URL=https://sepolia.infura.io/v3/abc123def456ghi789
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/abc123def456ghi789

## Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

## Deployment Configuration
PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
ETHERSCAN_API_KEY=ABC123DEF456GHI789

## Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB1234567890abcdefghijklmnop
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-voting-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-voting-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-voting-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## 🔨 Development Setup

### 1. Compile Smart Contracts

```bash
# Compile Solidity contracts
npm run compile
```

### 2. Deploy Smart Contract to Sepolia

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia
```

**Expected output:**
```
Deploying VotingSystem contract...
Deploying contracts with the account: 0x742d35Cc6634C0532925a3b844Bc9e759...
Account balance: 1.0 ETH
VotingSystem deployed to: 0x1234567890123456789012345678901234567890
Transaction hash: 0xabcdef...
Waiting for confirmations...
Contract deployed successfully!

Add this to your .env file:
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### 3. Update .env with Contract Address

Copy the deployed contract address and add it to your `.env` file:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### 4. Start Development Server

```bash
# Start Next.js development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 🧪 Testing the Application

### 1. Test Frontend (No Wallet)

1. Open `http://localhost:3000`
2. You should see the election list with demo data
3. The system will show a "Contract not configured" message if there are issues

### 2. Test Wallet Connection

1. Click "Connect Wallet" button
2. MetaMask should open asking for connection approval
3. Approve the connection
4. Ensure you're on Sepolia network (MetaMask will prompt to switch)

### 3. Test Voting

1. Click on any active election
2. Click "Cast Vote" button
3. MetaMask will ask you to sign the transaction
4. Approve the transaction (small gas fee required)
5. Wait for confirmation
6. Vote count should update in real-time

### 4. Test Admin Features

1. Go to `http://localhost:3000/admin`
2. Create a Firebase user account (or use existing)
3. Log in with your credentials
4. Try creating a new election
5. Fill out the form and submit
6. The election should appear on the main page

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. "npm install" fails
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 2. Contract compilation fails
```bash
# Check Solidity version
npx hardhat --version
# Should show Hardhat version with Solidity 0.8.19
```

#### 3. Deployment fails with "insufficient funds"
- Get more test ETH from [Sepolia faucet](https://sepoliafaucet.com/)
- Wait 24 hours between faucet requests

#### 4. MetaMask connection issues
- Make sure you're on Sepolia testnet
- Try disconnecting and reconnecting wallet
- Clear browser cache and cookies

#### 5. Firebase authentication errors
- Check Firebase configuration in `.env`
- Ensure Authentication is enabled in Firebase console
- Verify the domain is added to authorized domains

#### 6. "Contract not configured" message
- Ensure `NEXT_PUBLIC_CONTRACT_ADDRESS` is set in `.env`
- Verify the contract was successfully deployed
- Check that `NEXT_PUBLIC_RPC_URL` is correct

#### 7. Transaction failures
- Check you have sufficient Sepolia ETH
- Verify you're on the correct network
- Try increasing gas limit in MetaMask

### Environment Validation

Create this test to verify your setup:

```bash
# Test environment variables
node -e "
require('dotenv').config();
console.log('RPC URL:', process.env.NEXT_PUBLIC_RPC_URL ? '✅' : '❌');
console.log('Contract Address:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? '✅' : '❌');  
console.log('Firebase API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅' : '❌');
console.log('Private Key:', process.env.PRIVATE_KEY ? '✅' : '❌');
"
```

## 🎯 Production Deployment

### 1. Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/)
3. Import your repository
4. Add all environment variables in Vercel dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add each variable from your `.env` file
   - **DO NOT** include `PRIVATE_KEY` in production
5. Deploy

### 2. Manual Deployment Steps

```bash
# Build for production
npm run build

# Start production server locally (test)
npm start

# Deploy to your preferred hosting platform
```

## 🔒 Security Checklist

- [ ] Never commit `.env` file to version control
- [ ] Use different Firebase projects for development/production  
- [ ] Don't use real wallets with actual funds for testing
- [ ] Rotate API keys regularly
- [ ] Enable Firebase security rules in production
- [ ] Use environment-specific contract addresses
- [ ] Verify smart contract on Etherscan

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [MetaMask Developer Docs](https://docs.metamask.io/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Ethereum Sepolia Testnet](https://sepolia.etherscan.io/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are correctly set
3. Ensure you have sufficient test ETH for transactions
4. Check browser console for detailed error messages
5. Verify Firebase configuration and permissions

## 🏁 Success Indicators

You've successfully set up openKura when:

- ✅ Application loads at `http://localhost:3000`
- ✅ Wallet connects successfully to Sepolia
- ✅ You can view elections and vote counts
- ✅ Voting transactions complete successfully
- ✅ Admin panel allows election creation
- ✅ Real-time updates work correctly

---

*Happy voting! 🗳️*