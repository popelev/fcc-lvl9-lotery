/* Imports */
const { ethers } = require("hardhat")

const VRF_COORDINATOR_RINKEBY = process.env.VRF_COORDINATOR_RINKEBY
const VRF_GAS_LANE_RINKEBY = process.env.VRF_GAS_LANE_RINKEBY

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: VRF_COORDINATOR_RINKEBY,
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: VRF_GAS_LANE_RINKEBY,
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: VRF_GAS_LANE_RINKEBY,
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
