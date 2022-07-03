const { expect, assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts, getChainId } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip //("features", function () {})
    : describe("Raffle. Stage", async function () {
          let raffle, vrgCoordinatorV2Mock, raffleEntranceFee, interval
          let rafflePlayer1, accounts
          let deployerAddress, player1Address
          const chainId = network.config.chainId

          beforeEach(async function () {
              /* deployer */
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployerAddress = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])

              raffle = await ethers.getContract("Raffle", deployerAddress)
              vrgCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployerAddress
              )

              /* Common */
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          xdescribe("fulfillRandomWords", async function () {
              it("works wtih ChainKeeper and Chainlink VRF, we get a random winner", async function () {
                  const startingTimeStamp = await raffle.getLatestTimeStamp()

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPiked", async () => {
                          console.log("WinnePicked event fired!")
                          resolve()
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnderBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].deployerAddress)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnderEndBalance.toString(),
                                  winnderStartBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                          } catch (e) {
                              console.log(error)
                              reject(e)
                          }
                      })
                  })
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const winnderStartBalance = await accounts[0].getBalance()
              })
          })
      })
