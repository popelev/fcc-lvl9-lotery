const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 LINK per request
const GAS_PRICE_LINK = process.env.GAS_PRICE_LINK

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const deployArgs = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("local network detected! deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            contract: "MockChainlinkVRF",
            from: deployer,
            log: true,
            args: deployArgs,
        })
        log("Mocks deployed!")
        log("----------------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
