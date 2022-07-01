const { expect, assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts, getChainId } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip //("features", function () {})
    : describe("Raffle", async function () {
          let raffleDeployer, vrgCoordinatorV2Mock, raffleEntranceFee, interval
          let rafflePlayer1
          let deployerAddress, player1Address
          const chainId = network.config.chainId

          beforeEach(async function () {
              /* deployer */
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
              it("returns false if people have not send any ETH", async function () {})
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

//   Selfdistruct__TokenAmountNotZero
