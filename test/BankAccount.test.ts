import { expect } from "chai"
import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"

describe("BankAccount", () => {
    async function deployBankAccount() {
        const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

        const BankAccount = await ethers.getContractFactory("BankAccount");
        const bankAccount = await BankAccount.deploy();

        return { bankAccount, owner, addr1, addr2, addr3, addr4}
    }

    async function deployBankAccountWithAccounts(
        owners: number = 1,
        deposit: number = 0,
        withdrawalAmounts: number[] = []
      ) {
        const { bankAccount, owner, addr1, addr2, addr3, addr4 } = await loadFixture(deployBankAccount)
        let addresses: string[] = []
      
        if (owners >= 2) addresses.push(addr1.address)
        if (owners >= 3) addresses.push(addr2.address)
        if (owners >= 4) addresses.push(addr3.address)
        
        await bankAccount.connect(owner).createAccount(addresses)

        if (deposit > 0) {
            await bankAccount.connect(owner).deposit(0, { value: deposit.toString() })
        }
        
        for (const withdrawalAmount of withdrawalAmounts) {
            await bankAccount.connect(owner).requestWithdrawl(0, withdrawalAmount)
        }

        return { bankAccount, owner, addr1, addr2, addr3, addr4 }
    }

    describe("Deployment", () => {
        it("Should deploy without error", async () => {
            await loadFixture(deployBankAccount)            
        })
    })

    describe("Create an account", () => {
        it("Should allow creating a single account", async () => {
            const { bankAccount, owner } = await loadFixture(deployBankAccount)
            await bankAccount.connect(owner).createAccount([])
            const accounts = await bankAccount.connect(owner).getAccounts()
            expect(accounts.length).to.equal(1)
        })

        it("Should allow creating a double user account", async () => {
            const { bankAccount, owner, addr1 } = await loadFixture(deployBankAccount)
            await bankAccount.connect(owner).createAccount([addr1.address])
            
            const accounts = await bankAccount.connect(owner).getAccounts()
            expect(accounts.length).to.equal(1)

            const accounts2 = await bankAccount.connect(addr1).getAccounts()
            expect(accounts2.length).to.equal(1)
        })

        it("Should allow creating a triple user account", async () => {
            const { bankAccount, owner, addr1, addr2 } = await loadFixture(deployBankAccount)
            await bankAccount.connect(owner).createAccount([addr1.address, addr2.address])
            
            const accounts = await bankAccount.connect(owner).getAccounts()
            expect(accounts.length).to.equal(1)

            const accounts2 = await bankAccount.connect(addr1).getAccounts()
            expect(accounts2.length).to.equal(1)

            const accounts3 = await bankAccount.connect(addr2).getAccounts()
            expect(accounts3.length).to.equal(1)
        })

        it("Shouldn't allow creating a quad user account", async () => {
            const { bankAccount, owner, addr1, addr2, addr3 } = await loadFixture(deployBankAccount)
            await expect(
                bankAccount.connect(owner).createAccount([addr1.address, addr2.address, addr3.address])
            ).to.be.rejected
        })

        it("Shouldn't allow creating an account with duplicate owners", async () => {
            const { bankAccount, owner, addr1 } = await loadFixture(deployBankAccount)
            await expect(
                bankAccount.connect(owner).createAccount([owner.address])
            ).to.be.reverted
        })
    })

    describe("Deposit", () => {
        it("Should allow deposit from account owner", async () => {
            const { bankAccount, owner } = await deployBankAccountWithAccounts(1)
            await expect(
                bankAccount.connect(owner).deposit(0, { value: "100" })
            ).to.changeEtherBalances([bankAccount, owner], ["100", "-100"])
        })

        it("Shouldn't allow deposit from non-account owner", async () => {
            const { bankAccount, addr1 } = await deployBankAccountWithAccounts(1)
            await expect(
                bankAccount.connect(addr1).deposit(0, { value: "100" })
            ).to.be.rejected
        })
    })

    describe("Withdraw", () => {
        describe("Request withdraw", () => {
            it("Should allow account owner request withdraw", async () => {
                const { bankAccount, owner } = await deployBankAccountWithAccounts(1, 100)
                await bankAccount.connect(owner).requestWithdrawl(0, 100)
            })

            it("Should allow the account owner to request multiple withdrawals", async () => {
                const { bankAccount, owner } = await deployBankAccountWithAccounts(1, 100)
                await bankAccount.connect(owner).requestWithdrawl(0, 90)
                await bankAccount.connect(owner).requestWithdrawl(0, 10)
                 
            })

            it("Shouldn't allow account owner request withdraw with invalid amount", async () => {
                const { bankAccount, owner } = await deployBankAccountWithAccounts(1, 100)
                await expect(
                    bankAccount.connect(owner).requestWithdrawl(0, 101)
                ).to.be.rejected
            })

            it("Shouldn't allow non-account owner request withdraw", async () => {
                const { bankAccount, addr1 } = await deployBankAccountWithAccounts(1, 100)
                await expect(
                    bankAccount.connect(addr1).requestWithdrawl(0, 100)
                ).to.be.rejected
            })
        })

        describe("Approve a withdraw", () => {
            it("Should allow account owner to approve withdraw", async () => {
                const { bankAccount, addr1 } = await deployBankAccountWithAccounts(2, 100, [100])
                await bankAccount.connect(addr1).approvedWithdrawl(0, 0)
                expect(
                    await  bankAccount.getApprovals(0, 0)
                ).to.be.equal(1)
            })

            it("Shouldn't allow non-account owner to approve withdraw", async () => {
                const { bankAccount, addr2 } = await deployBankAccountWithAccounts(2, 100, [100])
                await expect(
                    bankAccount.connect(addr2).approvedWithdrawl(0, 0)
                ).to.be.rejected
            })

            it("Shouldn't allow account owner to approve withdraw multiple times", async () => {
                const { bankAccount, addr1 } = await deployBankAccountWithAccounts(2, 100, [100])
                await bankAccount.connect(addr1).approvedWithdrawl(0, 0)
                await expect(
                    bankAccount.connect(addr1).approvedWithdrawl(0, 0)
                ).to.be.rejected
            })

            it("Shouldn't allow request maker to approve withdraw", async () => {
                const { bankAccount, owner } = await deployBankAccountWithAccounts(2, 100, [100])
                await expect(
                    bankAccount.connect(owner).approvedWithdrawl(0, 0)
                ).to.be.rejected
            })
        })

        describe("Make a withdraw", () => {
            it("Should allow creator of request to withdraw approved request", async () => {
                const { bankAccount, owner, addr1 } = await deployBankAccountWithAccounts(2, 100, [100])
                await bankAccount.connect(addr1).approvedWithdrawl(0, 0)
                await expect(
                    bankAccount.connect(owner).withdraw(0, 0)
                ).to.changeEtherBalances([bankAccount, owner], ["-100", "100"])
            })

            it("Shouldn't allow creator of request to withdraw approved request twice", async () => {
                const { bankAccount, owner, addr1 } = await deployBankAccountWithAccounts(2, 200, [100])
                await bankAccount.connect(addr1).approvedWithdrawl(0, 0)
                await expect(
                    bankAccount.connect(owner).withdraw(0, 0)
                ).to.changeEtherBalances([bankAccount, owner], ["-100", "100"])
                await expect(
                    bankAccount.connect(owner).withdraw(0, 0)
                ).to.be.rejected
            })

            it("Shouldn't allow non-creator of request to withdraw approved request", async () => {
                const { bankAccount, addr1 } = await deployBankAccountWithAccounts(2, 200, [100])
                await bankAccount.connect(addr1).approvedWithdrawl(0, 0)
                await expect(bankAccount.connect(addr1).withdraw(0, 0)).to.be.rejected
            })
        })
    })
})