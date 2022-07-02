/* Imports */
const { ethers } = require("hardhat")

const VRF_COORDINATOR_RINKEBY = process.env.VRF_COORDINATOR_RINKEBY
const VRF_COORDINATOR_TOKEN_RINKEBY = process.env.VRF_COORDINATOR_TOKEN_RINKEBY
const VRF_GAS_LANE_RINKEBY = process.env.VRF_GAS_LANE_RINKEBY

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorToken: VRF_COORDINATOR_TOKEN_RINKEBY,
        vrfCoordinatorV2: VRF_COORDINATOR_RINKEBY,
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: VRF_GAS_LANE_RINKEBY,
        subscriptionId: "1",
        callbackGasLimit: "500000",
        interval: "10",
    },
    31337: {
        name: "hardhat",
        subscriptionId: "588",
        vrfCoordinatorToken: VRF_COORDINATOR_TOKEN_RINKEBY,
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: VRF_GAS_LANE_RINKEBY,
        callbackGasLimit: "500000",
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
