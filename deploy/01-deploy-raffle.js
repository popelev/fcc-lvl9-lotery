/* Imports */
const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("100")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorAddress, vrfCoordinatorToken
    let subscriptionId = 0
    if (developmentChains.includes(network.name)) {
        log("Read VRFCoordinatorV2Mock from local testnet ")
        const vrgCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = vrgCoordinatorV2Mock.address
        log("Create Subscription for Mock in local testnet")
        const txResponse = await vrgCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait()
        subscriptionId = txReceipt.events[0].args.subId
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrgCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)

        log("Read ERC20Mock from local testnet")
        const erc20Mock = await ethers.getContract("ERC20Mock")
        vrfCoordinatorToken = erc20Mock.address
    } else {
        log("Read VRFCoordinatorV2Mock from mainnet or real testnet")
        vrfCoordinatorAddress = await networkConfig[chainId]["VRFCoordinatorV2Mock"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
        vrfCoordinatorToken = networkConfig[chainId]["vrfCoordinatorToken"]
    }
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    log("----------------------------------------------------")

    const deployArgs = [
        vrfCoordinatorToken,
        vrfCoordinatorAddress,
        networkConfig[chainId]["entranceFee"],
        networkConfig[chainId]["gasLane"],
        subscriptionId,
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["interval"],
    ]
    log("VRFCoordinatorV2Args " + deployArgs)
    /* Deply contract */
    log("Deploy Raffle contract")
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: deployArgs,
        log: true,
        waitConformations: waitBlockConfirmations,
    })

    /* Verify contract */
    log("Contract deployed!")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(raffle.address, deployArgs)
    }
    log("----------------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
