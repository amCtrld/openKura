const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VotingSystem contract...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance));

  // Deploy the contract
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();

  await votingSystem.deployed();

  console.log("VotingSystem deployed to:", votingSystem.address);
  console.log("Transaction hash:", votingSystem.deployTransaction.hash);

  // Wait for a few confirmations
  console.log("Waiting for confirmations...");
  await votingSystem.deployTransaction.wait(5);

  console.log("Contract deployed successfully!");
  console.log("\nAdd this to your .env file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${votingSystem.address}`);

  // Verify on Etherscan if on a public network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nVerifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: votingSystem.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });