import { ethers } from "hardhat";

async function main() {
  const cactusStaking = await ethers.deployContract("CactusStaking", ['0x649a339B8FC3A8bA0A03255c00fDC5D969684074']);
  await cactusStaking.waitForDeployment();

  console.log(`CactusStaking deployed to ${cactusStaking.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
