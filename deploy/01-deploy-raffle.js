/* Imports */
const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    /* Deply Mocks if testnet 
        or 
    Read address from mainnet */
    let vrfCoordinatorAddress
    if (developmentChains.includes(network.name)) {
        const mockChainlinkVRF = await deployments.get("MockChainlinkVRF")
        vrfCoordinatorAddress = mockChainlinkVRF.address
        const txResponse = await mockChainlinkVRF.createSubscription()
        const txRecept = await
    } else {
        vrfCoordinatorAddress = await networkConfig[chainId]["VRFCoordinatorV2Mock"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]

    const deployArgs = [vrfCoordinatorAddress, entranceFee, gasLane]

    /* Deply contract */
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: deployArgs,
        log: true,
        waitConformations: network.config.blockConformations || 1,
    })

    /* Verify contract */
    log("Contract deployed!")
    if (!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(raffle.address, deployArgs)
    }
    log("----------------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
