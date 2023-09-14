import * as fs from "fs/promises"
import { ethers } from "hardhat"

async function writeDeploymentInfo(contract: any) {
    const data = {
        contract: {
            address: contract.address,
            signerAddress: contract.signer.address,
            abi: contract.interface.format()
        }
    }

    const content = JSON.stringify(data, null, 4)
    await fs.writeFile("deployment.json", content, { encoding: "utf-8" })
}


async function main() {
	const BankAccount = await ethers.getContractFactory("BankAccount")
    const bankAccount = await BankAccount.deploy()
	
    await bankAccount.deployed()
    await writeDeploymentInfo(bankAccount)
}


main()
    .then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})