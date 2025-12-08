// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingSystem {
    struct Election {
        string title;
        string description;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
        mapping(address => bool) hasVoted;
        address[] voters;
    }
    
    mapping(uint256 => Election) public elections;
    uint256 public electionCount;
    address public owner;
    
    event ElectionCreated(uint256 indexed electionId, string title, address creator);
    event Voted(uint256 indexed electionId, address indexed voter);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier electionExists(uint256 electionId) {
        require(electionId < electionCount, "Election does not exist");
        _;
    }
    
    modifier electionActive(uint256 electionId) {
        require(elections[electionId].isActive, "Election is not active");
        require(block.timestamp < elections[electionId].endTime, "Election has ended");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _endTime
    ) public returns (uint256) {
        require(_endTime > block.timestamp, "End time must be in the future");
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        uint256 electionId = electionCount;
        Election storage newElection = elections[electionId];
        newElection.title = _title;
        newElection.description = _description;
        newElection.endTime = _endTime;
        newElection.isActive = true;
        newElection.totalVotes = 0;
        
        electionCount++;
        
        emit ElectionCreated(electionId, _title, msg.sender);
        return electionId;
    }
    
    function vote(uint256 electionId) 
        public 
        electionExists(electionId) 
        electionActive(electionId) 
    {
        require(!elections[electionId].hasVoted[msg.sender], "You have already voted");
        
        elections[electionId].hasVoted[msg.sender] = true;
        elections[electionId].voters.push(msg.sender);
        elections[electionId].totalVotes++;
        
        emit Voted(electionId, msg.sender);
    }
    
    function hasVoted(uint256 electionId, address voter) 
        public 
        view 
        electionExists(electionId) 
        returns (bool) 
    {
        return elections[electionId].hasVoted[voter];
    }
    
    function getTotalVotes(uint256 electionId) 
        public 
        view 
        electionExists(electionId) 
        returns (uint256) 
    {
        return elections[electionId].totalVotes;
    }
    
    function getVoters(uint256 electionId) 
        public 
        view 
        electionExists(electionId) 
        returns (address[] memory) 
    {
        return elections[electionId].voters;
    }
    
    function getElection(uint256 electionId) 
        public 
        view 
        electionExists(electionId) 
        returns (
            string memory title,
            string memory description,
            uint256 endTime,
            bool isActive,
            uint256 totalVotes
        ) 
    {
        Election storage election = elections[electionId];
        return (
            election.title,
            election.description,
            election.endTime,
            election.isActive && block.timestamp < election.endTime,
            election.totalVotes
        );
    }
    
    function getAllElections() 
        public 
        view 
        returns (
            uint256[] memory ids,
            string[] memory titles,
            string[] memory descriptions,
            uint256[] memory endTimes,
            bool[] memory activeStates,
            uint256[] memory voteCounts
        ) 
    {
        ids = new uint256[](electionCount);
        titles = new string[](electionCount);
        descriptions = new string[](electionCount);
        endTimes = new uint256[](electionCount);
        activeStates = new bool[](electionCount);
        voteCounts = new uint256[](electionCount);
        
        for (uint256 i = 0; i < electionCount; i++) {
            Election storage election = elections[i];
            ids[i] = i;
            titles[i] = election.title;
            descriptions[i] = election.description;
            endTimes[i] = election.endTime;
            activeStates[i] = election.isActive && block.timestamp < election.endTime;
            voteCounts[i] = election.totalVotes;
        }
    }
    
    function endElection(uint256 electionId) 
        public 
        onlyOwner 
        electionExists(electionId) 
    {
        elections[electionId].isActive = false;
    }
    
    function getElectionCount() public view returns (uint256) {
        return electionCount;
    }
}