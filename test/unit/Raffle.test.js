const { expect, assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts, getChainId } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip //("features", function () {})
    : describe("Raffle", async function () {
          let raffleDeployer, vrgCoordinatorV2Mock, raffleEntranceFee, interval
          let rafflePlayer1, accounts
          let deployerAddress, player1Address
          const chainId = network.config.chainId

          beforeEach(async function () {
              /* deployer */
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployerAddress = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])

              erc20Deployer = await ethers.getContract("ERC20Mock", deployerAddress)
              raffleDeployer = await ethers.getContract("Raffle", deployerAddress)
              vrgCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployerAddress
              )

              /* player 1 */
              player1Address = (await getNamedAccounts()).player1
              await deployments.fixture(["all"])
              erc20Player1 = await ethers.getContract("ERC20Mock", player1Address)
              rafflePlayer1 = await ethers.getContract("Raffle", player1Address)

              /* Common */
              raffleEntranceFee = await raffleDeployer.getEntranceFee()
              interval = await raffleDeployer.getInterval()
          })

          describe("constructor", async function () {
              it("Initialize the raffle correctly", async function () {
                  const raffleState = await raffleDeployer.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })

          describe("enterRaffle", async function () {
              it("revert when you do not pay enough", async function () {
                  await expect(raffleDeployer.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotEnoughETHEntered"
                  )
              })
              it("emit event on enter", async function () {
                  await expect(raffleDeployer.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffleDeployer,
                      "RaffleEnter"
                  )
              })
              it("records players when they enter", async function () {
                  await raffleDeployer.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffleDeployer.getPlayer(0)
                  assert.equal(playerFromContract, deployerAddress)
              })
              it("doesnt allow entrance when raffle is calculatig", async function () {
                  await raffleDeployer.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffleDeployer.performUpkeep([])
                  await expect(
                      raffleDeployer.enterRaffle({ value: raffleEntranceFee })
                  ).to.be.revertedWith("Raffle__NotOpen")
              })
          })
          describe("checkUpkeep", async function () {
              it("returns false if people have not send any ETH", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffleDeployer.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle is not open", async function () {
                  await raffleDeployer.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffleDeployer.performUpkeep([])
                  const raffleState = await raffleDeployer.getRaffleState()
                  const { upkeepNeeded } = await raffleDeployer.callStatic.checkUpkeep("0x") //([])
                  assert(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
          })

          describe("performUpkeep", async function () {
              it("it can only run if checkupkeep is true", async function () {
                  await raffleDeployer.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffleDeployer.performUpkeep("0x") //([])
                  assert(tx)
              })
              it("it reverts when checkupkeep is false", async function () {
                  await expect(raffleDeployer.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  )
              })
              it("updates the raffle state, emits and event, and calls the vrf coordinator", async function () {
                  await raffleDeployer.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await raffleDeployer.performUpkeep("0x") //([])
                  const txReceipt = await txResponse.wait(1)
                  const raffleState = await raffleDeployer.getRaffleState()
                  const requestId = txReceipt.events[1].args.requestId
                  assert(requestId.toNumber() > 0)
                  assert(raffleState.toString() == "1")
              })
          })

          describe("fulfillRandomWords", async function () {
              beforeEach(async function () {
                  await raffleDeployer.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can only be called after performeUpkeep", async function () {
                  await expect(
                      vrgCoordinatorV2Mock.fulfillRandomWords(0, raffleDeployer.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrgCoordinatorV2Mock.fulfillRandomWords(1, raffleDeployer.address)
                  ).to.be.revertedWith("nonexistent request")
              })

              /* it("picks a winner, resets the lottery, and sends money", async function () {
                  const additionalEntrants = 3
                  const startAdditionalEntrants = 2
                  const accounts = await ethers.getSigners()
                  for (
                      let i = startAdditionalEntrants;
                      i < startAdditionalEntrants + additionalEntrants;
                      i++
                  ) {
                      const accountConnecedRaffle = raffleDeployer.connect(accounts[i])
                      await accountConnecedRaffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  const startingTimeStamp = await raffleDeployer.getLatestTimeStamp()

                  await new Promise(async (resolve, reject) => {
                      raffleDeployer.once("WinnerPiked", async () => {
                          console.log("found the event!")
                          try {
                              const recentWinner = await raffleDeployer.getRecentWinner()
                              const raffleState = await raffleDeployer.getRaffleState()
                              const endingTimeStamp = await raffleDeployer.getLatestTimeStamp()
                              const numPlayers = await raffleDeployer.getNumPlayers()

                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)

                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      const tx = await raffleDeployer.performUpkeep([])
                      const txReceipt = await tx.wait(1)
                      const startingBalance = await accounts[2].getBalance()
                      await vrgCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          raffleDeployer.address
                      )
                  })
              })*/

              it("picks a winner, resets, and sends money", async () => {
                  const additionalEntrances = 3
                  const startingIndex = 2
                  for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
                      raffle = raffleDeployer.connect(accounts[i])
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  const startingTimeStamp = await raffle.getLatestTimeStamp()

                  // This will be more important for our staging tests...
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          // assert throws an error if it fails, so we need to wrap
                          // it in a try/catch so that the promise returns event
                          // if it fails.
                          try {
                              // Now lets get the ending values...
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerBalance = await accounts[2].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[2].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerBalance.toString(),
                                  startingBalance
                                      .add(
                                          raffleEntranceFee
                                              .mul(additionalEntrances)
                                              .add(raffleEntranceFee)
                                      )
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                  })
                  const tx = await raffle.performUpkeep("0x")
                  const txReceipt = await tx.wait(1)
                  const startingBalance = await accounts[2].getBalance()
                  await vrfCoordinatorV2Mock.fulfillRandomWords(
                      txReceipt.events[1].args.requestId,
                      raffle.address
                  )
              })
          })

          describe("selfdistruct", async function () {
              it("owner can distruct contract with automatic call withdraw tokens function", async function () {
                  await erc20Deployer.transfer(raffleDeployer.address, 10)

                  await expect(raffleDeployer.suicide(0)).to.emit(raffleDeployer, "Selfdistruct")

                  const contractBalance = await erc20Deployer.balanceOf(raffleDeployer.address)
                  await assert.equal(contractBalance.toString(), "0")
              })
              it("owner can force selfdistruct contract without call withdraw tokens function", async function () {
                  await erc20Deployer.transfer(raffleDeployer.address, 10)

                  await expect(raffleDeployer.suicide(1)).to.emit(raffleDeployer, "Selfdistruct")

                  const contractBalance = await erc20Deployer.balanceOf(raffleDeployer.address)
                  await assert.equal(contractBalance.toString(), "10")
              })
              it("not owner can not distruct contract", async function () {
                  await expect(rafflePlayer1.suicide(0)).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })
              it("not owner can not force selfdistruct contract", async function () {
                  await expect(rafflePlayer1.suicide(1)).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })
          })
      })
