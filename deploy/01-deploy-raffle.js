/* Imports */
const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorAddress, subscriptionId

    if (developmentChains.includes(network.name)) {
        log("Read VRFCoordinatorV2Mock from local testnet ")
        const vrgCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = vrgCoordinatorV2Mock.address
        log("Create Subscription for Mock in local testnet")
        const txResponse = await vrgCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrgCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        log("Read VRFCoordinatorV2Mock from mainnet or real testnet")
        vrfCoordinatorAddress = await networkConfig[chainId]["VRFCoordinatorV2Mock"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    const vrfCoordinatorToken = networkConfig[chainId]["vrfCoordinatorToken"]

    const deployArgs = [
        vrfCoordinatorToken,
        vrfCoordinatorAddress,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    /* Deply contract */
    log("Deploy Raffle contract")
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: deployArgs,
        log: true,
        waitConformations: network.config.blockConformations || 1,
    })

    /* Verify contract */
    log("Contract deployed!")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(raffle.address, deployArgs)
    }
    log("----------------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
