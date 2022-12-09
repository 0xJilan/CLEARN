const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

describe("Deploy with 3 users with CLEARN", () => {
  const deployStakingFixture = async () => {
    const [owner, userOne, userTwo, userThree, strategyHub, fakePriceFeed] =
      await ethers.getSigners();
    const DOLLAR_10K_IN_USDC = 10000000000;
    const DOLLAR_30K_IN_USDC = 30000000000;
    const DOLLAR_50K_IN_USDC = 50000000000;
    const CLEARN_10K = 10000000000000000000000n;
    const CLEARN_30K = 30000000000000000000000n;
    const CLEARN_50K = 50000000000000000000000n;
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("USDC", "USDC");
    await mockUSDC.connect(owner).mint(userOne.address, DOLLAR_10K_IN_USDC);
    await mockUSDC.connect(owner).mint(userTwo.address, DOLLAR_30K_IN_USDC);
    await mockUSDC.connect(owner).mint(userThree.address, DOLLAR_50K_IN_USDC);
    await mockUSDC.connect(owner).mint(strategyHub.address, DOLLAR_10K_IN_USDC);
    const Clearn = await ethers.getContractFactory("Clearn");
    const clearn = await Clearn.deploy();
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(clearn.address, strategyHub.address);
    await clearn.setMinter(treasury.address);
    await treasury.addTokenInfo(mockUSDC.address, fakePriceFeed.address);
    await mockUSDC
      .connect(userOne)
      .approve(treasury.address, DOLLAR_10K_IN_USDC);
    await mockUSDC
      .connect(userTwo)
      .approve(treasury.address, DOLLAR_30K_IN_USDC);
    await mockUSDC
      .connect(userThree)
      .approve(treasury.address, DOLLAR_50K_IN_USDC);
    await treasury
      .connect(userOne)
      .deposit(mockUSDC.address, DOLLAR_10K_IN_USDC);
    await treasury
      .connect(userTwo)
      .deposit(mockUSDC.address, DOLLAR_30K_IN_USDC);
    await treasury
      .connect(userThree)
      .deposit(mockUSDC.address, DOLLAR_50K_IN_USDC);
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(clearn.address, mockUSDC.address);
    const clearnBalanceUserOne = await clearn.balanceOf(userOne.address);
    const clearnBalanceUserTwo = await clearn.balanceOf(userTwo.address);
    const clearnBalanceUserThree = await clearn.balanceOf(userThree.address);
    await clearn
      .connect(userOne)
      .approve(staking.address, clearnBalanceUserOne);

    await clearn
      .connect(userThree)
      .approve(staking.address, clearnBalanceUserThree);

    return {
      owner,
      userOne,
      userTwo,
      userThree,
      strategyHub,
      DOLLAR_10K_IN_USDC,
      DOLLAR_30K_IN_USDC,
      DOLLAR_50K_IN_USDC,
      CLEARN_10K,
      CLEARN_30K,
      CLEARN_50K,
      clearn,
      treasury,
      staking,
      mockUSDC,
      clearnBalanceUserOne,
      clearnBalanceUserTwo,
      clearnBalanceUserThree,
    };
  };

  describe("Stake Clearn", () => {
    it("Should revert if user amount staking is 0", async () => {
      const { userOne, staking } = await loadFixture(deployStakingFixture);
      await expect(staking.connect(userOne).stake(0)).to.be.revertedWith(
        "Stake must be more than 0"
      );
    });
    it("Should revert if user dont have enough CLEARN", async () => {
      const { userOne, staking, CLEARN_30K } = await loadFixture(
        deployStakingFixture
      );
      await expect(
        staking.connect(userOne).stake(CLEARN_30K)
      ).to.be.revertedWith("Not enough CLEARN");
    });
    it("Should revert if not enough allowance", async () => {
      const { userTwo, staking, CLEARN_30K } = await loadFixture(
        deployStakingFixture
      );
      await expect(
        staking.connect(userTwo).stake(CLEARN_30K)
      ).to.be.revertedWith("Raise token allowance");
    });
    it("Should succes if enough allowance", async () => {
      const { clearn, userTwo, staking, clearnBalanceUserTwo, CLEARN_30K } =
        await loadFixture(deployStakingFixture);
      await clearn
        .connect(userTwo)
        .approve(staking.address, clearnBalanceUserTwo);

      await staking.connect(userTwo).stake(CLEARN_30K);
      const xCLearnBalanceUserTwo = await staking.balanceOf(userTwo.address);
      expect(await xCLearnBalanceUserTwo).to.be.equals(clearnBalanceUserTwo);
    });

    it("Should add xClearn to user balance", async () => {
      const { userOne, staking, clearnBalanceUserOne, CLEARN_10K } =
        await loadFixture(deployStakingFixture);
      await staking.connect(userOne).stake(CLEARN_10K);
      const xCLearnBalanceUserOne = await staking.balanceOf(userOne.address);
      expect(await xCLearnBalanceUserOne).to.be.equals(clearnBalanceUserOne);
    });
    it("Should minus CLEARN to user balance", async () => {
      const { clearn, userOne, staking, CLEARN_10K } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10K);
      const clearnBalanceUserOneAfterDeposit = await clearn.balanceOf(
        userOne.address
      );
      expect(await clearnBalanceUserOneAfterDeposit).to.be.equals(0);
    });
  });

  describe("Withdraw Clearn", () => {
    it("Should revert if user amount unstake is 0", async () => {
      const { userOne, staking } = await loadFixture(deployStakingFixture);
      await expect(staking.connect(userOne).withdraw(0)).to.be.revertedWith(
        "Withdraw must be more than 0"
      );
    });
    it("Should revert if user dont have enough CLEARN", async () => {
      const { userOne, staking, CLEARN_10K } = await loadFixture(
        deployStakingFixture
      );
      await expect(
        staking.connect(userOne).withdraw(CLEARN_10K)
      ).to.be.revertedWith("Not enough xCLEARN");
    });

    it("Should decrease totalSupply xCLEARN if success", async () => {
      const { userOne, staking, CLEARN_10K } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10K);
      const totalSupplyBeforeWithdraw = await staking.totalSupply();
      await staking.connect(userOne).withdraw(CLEARN_10K);
      const totalSupplyAfterWithdraw = await staking.totalSupply();
      expect(totalSupplyBeforeWithdraw).to.be.above(totalSupplyAfterWithdraw);
    });

    it("Should debit xClean balance of user if success", async () => {
      const { userOne, staking, CLEARN_10K } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10K);
      const xClearnBalanceBeforeWithdraw = await staking.balanceOf(
        userOne.address
      );
      await staking.connect(userOne).withdraw(CLEARN_10K);
      const xClearnBalanceAfterWithdraw = await staking.balanceOf(
        userOne.address
      );
      expect(xClearnBalanceBeforeWithdraw).to.be.above(
        xClearnBalanceAfterWithdraw
      );
    });

    it("Should add CLEARN to user balance if success", async () => {
      const { clearn, userOne, staking, CLEARN_10K } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10K);
      const clearnBalanceBeforeWithdraw = await clearn.balanceOf(
        userOne.address
      );
      await staking.connect(userOne).withdraw(CLEARN_10K);
      const clearnBalanceAfterWithdraw = await clearn.balanceOf(
        userOne.address
      );
      expect(clearnBalanceAfterWithdraw).to.be.above(
        clearnBalanceBeforeWithdraw
      );
    });
  });
});
