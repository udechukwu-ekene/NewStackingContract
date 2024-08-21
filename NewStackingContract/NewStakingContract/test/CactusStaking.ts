import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

function calcEarnings(amountStaked, duration) {
  const roi = 300;
  return ((((amountStaked * roi) / 100) * duration) / ONE_YEAR_IN_SECS).toFixed(12);
}

describe("CactusStaking", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCactusStakingFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, staker1, staker2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const mockERC20 = await MockERC20.deploy(ethers.parseUnits("10000000000", "ether"));

    const CactusStaking = await ethers.getContractFactory("CactusStaking");
    const cactusStaking = await CactusStaking.deploy(
      mockERC20.target
    );

    await mockERC20.connect(staker1).approve(cactusStaking.target, ethers.parseUnits("3000000", "ether"));
    await mockERC20.connect(staker2).approve(cactusStaking.target, ethers.parseUnits("30000", "ether"));

    await mockERC20.connect(owner).transfer(staker1.address, ethers.parseUnits("3000000", "ether"));
    await mockERC20.connect(owner).transfer(staker2.address, ethers.parseUnits("30000", "ether"));

    await mockERC20.connect(owner).transfer(cactusStaking.target, ethers.parseUnits("3000000", "ether"));

    return { mockERC20, cactusStaking, owner, staker1, staker2 };
  }

  describe("staking", function () {
    it("should not allow staking less than the minimum amount or greater than max", async function () {
      const { cactusStaking, staker1 } = await loadFixture(deployCactusStakingFixture);
      let stakeAmount = ethers.parseUnits("5", "ether");
      await expect(cactusStaking.connect(staker1).stake(stakeAmount)).to.be.rejectedWith("Amount is less than the minimum staking amount");

      stakeAmount = ethers.parseUnits("55000000", "ether");
      await expect(cactusStaking.connect(staker1).stake(stakeAmount)).to.be.rejectedWith("Amount is greater than the maximum staking amount");
    });

    it("should allow staking the minimum amount", async function () {
      const { cactusStaking, staker1 } = await loadFixture(deployCactusStakingFixture);

      const stakeAmount = ethers.parseUnits('200', "ether");
      await expect(cactusStaking.connect(staker1).stake(stakeAmount)).to.emit(cactusStaking, "Staked").withArgs(staker1.address, stakeAmount);
    });

    it("should allow staking, harvesting, and unstaking", async function () {
      const { cactusStaking, staker1 } = await loadFixture(deployCactusStakingFixture);
    
      const stakeAmount = ethers.parseUnits('10000', "ether");

      await cactusStaking.connect(staker1).stake(stakeAmount);

      let timePassed = 86400;
      await time.increase(timePassed);

      let userReward = await cactusStaking.connect(staker1).getRewards(staker1.address);
      const expectedEarning = calcEarnings(10000, timePassed);
      const returns = Number(ethers.formatUnits(userReward));

      expect(returns.toFixed(12)).to.be.equal(expectedEarning);

      await cactusStaking.connect(staker1).harvest();

      userReward = await cactusStaking.connect(staker1).getRewards(staker1.address);
      expect('0').to.be.equal(userReward);

      timePassed = 86400;
      await time.increase(timePassed);

      await cactusStaking.connect(staker1).unstake();

      userReward = await cactusStaking.connect(staker1).getRewards(staker1.address);
      expect('0').to.be.equal(userReward);

      const userDetails = await cactusStaking.connect(staker1).getUserDetails(staker1.address);
      console.log(userDetails);
    });
  });

});
