import { ethers } from "hardhat";

async function main() {
  const cactusStaking = await ethers.deployContract("CactusStaking", ['0xDC20F6830620F00D3d8FF6fC64D8BbfA83F0d652']);
  await cactusStaking.waitForDeployment();

  console.log(`CactusStaking deployed to ${cactusStaking.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
