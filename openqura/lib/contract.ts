import { ethers } from "ethers"

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.infura.io/v3/ad84f504037949cdb7f6668d8fed5da9"

// Enhanced ABI for the voting contract with comprehensive election management
export const VOTING_ABI = [
  // Election management
  "function createElection(string memory _title, string memory _description, uint256 _endTime) public returns (uint256)",
  "function getElection(uint256 electionId) public view returns (string memory title, string memory description, uint256 endTime, bool isActive, uint256 totalVotes)",
  "function getElectionCount() public view returns (uint256)",
  "function getAllElections() public view returns (tuple(uint256 id, string title, string description, uint256 endTime, bool isActive, uint256 totalVotes)[])",
  
  // Voting functions
  "function vote(uint256 electionId) public",
  "function hasVoted(uint256 electionId, address voter) public view returns (bool)",
  "function getTotalVotes(uint256 electionId) public view returns (uint256)",
  "function getVoters(uint256 electionId) public view returns (address[] memory)",
  
  // Admin functions
  "function endElection(uint256 electionId) public",
  "function owner() public view returns (address)",
  
  // Events
  "event ElectionCreated(uint256 indexed electionId, string title, address creator)",
  "event Voted(uint256 indexed electionId, address indexed voter)",
]

export function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  return new ethers.JsonRpcProvider(RPC_URL)
}

export function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || getProvider()
  return new ethers.Contract(CONTRACT_ADDRESS, VOTING_ABI, provider)
}

// Helper function to check if contract is properly configured
export function isContractConfigured(): boolean {
  return CONTRACT_ADDRESS !== "" && RPC_URL !== ""
}
