const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 LINK per request
const GAS_PRICE_LINK = 1e9

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log("local network detected! deploying mocks...")

        const ERC20_deployArgs = ["ERC20Mock", "MCK", deployer, 100]
        await deploy("ERC20Mock", {
            contract: "ERC20Mock",
            from: deployer,
            log: true,
            args: ERC20_deployArgs,
        })
        log("ERC20Mock deployed!")
        const VRF_deployArgs = [BASE_FEE, GAS_PRICE_LINK]
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: VRF_deployArgs,
        })
        log("VRFCoordinatorV2Mock deployed!")
        log("----------------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
