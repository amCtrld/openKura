const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VotingSystem contract...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy the contract
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();

  await votingSystem.waitForDeployment();
  const contractAddress = await votingSystem.getAddress();

  console.log("VotingSystem deployed to:", contractAddress);

  // Wait for a few confirmations
  console.log("Waiting for confirmations...");
  await votingSystem.deploymentTransaction().wait(5);

  console.log("Contract deployed successfully!");
  console.log("\nAdd this to your openqura/.env file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });