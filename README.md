# Decentralized Bank Account

This repository contains a straightforward Ethereum smart contract developed in Solidity, tested using TypeScript, and equipped with a minimalistic frontend to facilitate user interaction. The smart contract enables users to create an account with multiple owners. To make a withdrawal, an owner must initiate a request for approval, and all other owners must grant their consent before the withdrawal can proceed.

# Features
- Account creation with multiple owners.
- Withdrawal requests require approval from all owners.
- A simple web-based frontend for interacting with the contract.

# How to run
Follow these steps to set up and use the smart contract locally:

1. Clone this repository to your local machine <br>
   `git clone https://github.com/AnonC0DER/decentralized-bank-account.git`
2. Install the necessary dependencies <br>
   `npm install`
3. Launch a local Ethereum node using Hardhat <br>
   `npx hardhat node`
4. Install the live server extension in your IDE and run the HTML frontend
5. Install MetaMask extension in your browser
6. Install the MetaMask extension in your browser. Import several Hardhat test accounts into MetaMask using their private keys
7. Now, you should be able to create accounts using the frontend

# Testing
To run the TypeScript tests for the smart contract, use the following command: <br>
`npx hardhat test`
