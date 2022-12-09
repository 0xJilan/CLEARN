const {
  time,
  loadFixture,
  mineUpTo,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

describe("Deploy with 3 users with CLEARN", () => {
  const deployStakingFixture = async () => {
    const [
      owner,
      userOne,
      userTwo,
      userThree,
      strategyHub,
      fakePriceFeed,
      otherStrategyHub,
    ] = await ethers.getSigners();
    const DOLLAR_10 = String(10 * 10 ** 6);
    const DOLLAR_30 = String(30 * 10 ** 6);
    const DOLLAR_50 = String(50 * 10 ** 6);
    const CLEARN_10 = String(10 * 10 ** 18);
    const CLEARN_30 = String(30 * 10 ** 18);
    const CLEARN_50 = String(50 * 10 ** 18);
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("USDC", "USDC");
    await mockUSDC.connect(owner).mint(userOne.address, DOLLAR_10);
    await mockUSDC.connect(owner).mint(userTwo.address, DOLLAR_30);
    await mockUSDC.connect(owner).mint(userThree.address, DOLLAR_50);
    const Clearn = await ethers.getContractFactory("Clearn");
    const clearn = await Clearn.deploy();
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(clearn.address, strategyHub.address);
    await clearn.setMinter(treasury.address);
    await treasury.addTokenInfo(mockUSDC.address, fakePriceFeed.address);
    await mockUSDC.connect(userOne).approve(treasury.address, DOLLAR_10);
    await mockUSDC.connect(userTwo).approve(treasury.address, DOLLAR_30);
    await mockUSDC.connect(userThree).approve(treasury.address, DOLLAR_50);
    await treasury.connect(userOne).deposit(mockUSDC.address, DOLLAR_10);
    await treasury.connect(userTwo).deposit(mockUSDC.address, DOLLAR_30);
    await treasury.connect(userThree).deposit(mockUSDC.address, DOLLAR_50);
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
      DOLLAR_10,
      DOLLAR_30,
      DOLLAR_50,
      CLEARN_10,
      CLEARN_30,
      CLEARN_50,
      clearn,
      treasury,
      staking,
      mockUSDC,
      clearnBalanceUserOne,
      clearnBalanceUserTwo,
      clearnBalanceUserThree,
      otherStrategyHub,
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
      const { userOne, staking, CLEARN_30 } = await loadFixture(
        deployStakingFixture
      );
      await expect(
        staking.connect(userOne).stake(CLEARN_30)
      ).to.be.revertedWith("Not enough CLEARN");
    });

    it("Should revert if not enough allowance", async () => {
      const { userTwo, staking, CLEARN_30 } = await loadFixture(
        deployStakingFixture
      );
      await expect(
        staking.connect(userTwo).stake(CLEARN_30)
      ).to.be.revertedWith("Raise token allowance");
    });
    it("Should succes if enough allowance", async () => {
      const { clearn, userTwo, staking, clearnBalanceUserTwo, CLEARN_30 } =
        await loadFixture(deployStakingFixture);
      await clearn
        .connect(userTwo)
        .approve(staking.address, clearnBalanceUserTwo);

      await staking.connect(userTwo).stake(CLEARN_30);
      const xCLearnBalanceUserTwo = await staking.balanceOf(userTwo.address);
      expect(await xCLearnBalanceUserTwo).to.be.equals(clearnBalanceUserTwo);
    });

    it("Should add xClearn to user balance", async () => {
      const { userOne, staking, clearnBalanceUserOne, CLEARN_10 } =
        await loadFixture(deployStakingFixture);
      await staking.connect(userOne).stake(CLEARN_10);
      const xCLearnBalanceUserOne = await staking.balanceOf(userOne.address);
      expect(await xCLearnBalanceUserOne).to.be.equals(clearnBalanceUserOne);
    });
    it("Should minus CLEARN to user balance", async () => {
      const { clearn, userOne, staking, CLEARN_10 } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10);
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
      const { userOne, staking, CLEARN_10 } = await loadFixture(
        deployStakingFixture
      );
      await expect(
        staking.connect(userOne).withdraw(CLEARN_10)
      ).to.be.revertedWith("Not enough xCLEARN");
    });

    it("Should decrease totalSupply xCLEARN if success", async () => {
      const { userOne, staking, CLEARN_10 } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10);
      const totalSupplyBeforeWithdraw = await staking.totalSupply();
      await staking.connect(userOne).withdraw(CLEARN_10);
      const totalSupplyAfterWithdraw = await staking.totalSupply();
      expect(totalSupplyBeforeWithdraw).to.be.above(totalSupplyAfterWithdraw);
    });

    it("Should debit xClean balance of user if success", async () => {
      const { userOne, staking, CLEARN_10 } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10);
      const xClearnBalanceBeforeWithdraw = await staking.balanceOf(
        userOne.address
      );
      await staking.connect(userOne).withdraw(CLEARN_10);
      const xClearnBalanceAfterWithdraw = await staking.balanceOf(
        userOne.address
      );
      expect(xClearnBalanceBeforeWithdraw).to.be.above(
        xClearnBalanceAfterWithdraw
      );
    });

    it("Should add CLEARN to user balance if success", async () => {
      const { clearn, userOne, staking, CLEARN_10 } = await loadFixture(
        deployStakingFixture
      );
      await staking.connect(userOne).stake(CLEARN_10);
      const clearnBalanceBeforeWithdraw = await clearn.balanceOf(
        userOne.address
      );
      await staking.connect(userOne).withdraw(CLEARN_10);
      const clearnBalanceAfterWithdraw = await clearn.balanceOf(
        userOne.address
      );
      expect(clearnBalanceAfterWithdraw).to.be.above(
        clearnBalanceBeforeWithdraw
      );
    });
  });

  describe("Deposit USDC Rewards from StrategyHub in Staking", () => {
    it("Should revert if not yield distributor", async () => {
      const { staking, strategyHub } = await loadFixture(deployStakingFixture);
      await expect(
        staking.connect(strategyHub).issuanceRate(0)
      ).to.be.revertedWith("Owner need to Set YieldDistributor");
    });
    it("Should add yield distributor", async () => {
      const { staking, strategyHub } = await loadFixture(deployStakingFixture);
      await staking.setYieldDistributor(strategyHub.address);
      expect(await staking.yieldDistributor()).to.equals(strategyHub.address);
    });

    it("Should revert if not yield distributor", async () => {
      const { staking, strategyHub, userOne } = await loadFixture(
        deployStakingFixture
      );
      await staking.setYieldDistributor(strategyHub.address);
      await expect(staking.connect(userOne).issuanceRate(0)).to.be.revertedWith(
        "Only Yield Distributor"
      );
    });
    it("Should revert if 0 rewards", async () => {
      const { staking, strategyHub } = await loadFixture(deployStakingFixture);
      await staking.setYieldDistributor(strategyHub.address);
      await expect(
        staking.connect(strategyHub).issuanceRate(0)
      ).to.be.revertedWith("Zero rewards");
    });

    it("Should revert if nobody stake actually", async () => {
      const { staking, strategyHub, DOLLAR_10 } = await loadFixture(
        deployStakingFixture
      );
      await staking.setYieldDistributor(strategyHub.address);
      await expect(
        staking.connect(strategyHub).issuanceRate(DOLLAR_10)
      ).to.be.revertedWith("Nobody Stake Actually");
    });

    it("Should revert if Yield Distributor dont give enough USDC Allowance to Staking", async () => {
      const { strategyHub, staking, DOLLAR_10, userOne, CLEARN_10 } =
        await loadFixture(deployStakingFixture);
      await staking.setYieldDistributor(strategyHub.address);
      await staking.connect(userOne).stake(CLEARN_10);
      await expect(
        staking.connect(strategyHub).issuanceRate(DOLLAR_10)
      ).to.be.revertedWith("Raise token allowance");
    });

    it("Should add USDC rewards to Staking Contract balance if success", async () => {
      const {
        owner,
        mockUSDC,
        staking,
        DOLLAR_10,
        userOne,
        CLEARN_10,
        otherStrategyHub,
      } = await loadFixture(deployStakingFixture);
      await staking.setYieldDistributor(otherStrategyHub.address);
      await staking.connect(userOne).stake(CLEARN_10);
      await mockUSDC.connect(owner).mint(otherStrategyHub.address, DOLLAR_10);
      await mockUSDC
        .connect(otherStrategyHub)
        .approve(staking.address, DOLLAR_10);

      const usdcBalanceBefore = await mockUSDC.balanceOf(
        otherStrategyHub.address
      );
      await staking.connect(otherStrategyHub).issuanceRate(DOLLAR_10);
      const usdcBalanceAfter = await mockUSDC.balanceOf(
        otherStrategyHub.address
      );
      expect(usdcBalanceBefore).to.be.above(usdcBalanceAfter);
    });

    it("Should update lastUpdateTime if deposit rewards is success", async () => {
      const {
        owner,
        mockUSDC,
        staking,
        DOLLAR_10,
        userOne,
        CLEARN_10,
        otherStrategyHub,
      } = await loadFixture(deployStakingFixture);
      const lastUpdateTimeBefore = await staking.lastUpdateTime();
      await staking.setYieldDistributor(otherStrategyHub.address);
      await staking.connect(userOne).stake(CLEARN_10);
      await mockUSDC.connect(owner).mint(otherStrategyHub.address, DOLLAR_10);
      await mockUSDC
        .connect(otherStrategyHub)
        .approve(staking.address, DOLLAR_10);
      await staking.connect(otherStrategyHub).issuanceRate(DOLLAR_10);
      const lastUpdateAfter = await staking.lastUpdateTime();
      expect(lastUpdateAfter).to.be.above(lastUpdateTimeBefore);
    });

    it("Should add 30 Days to periodFinishif deposit rewards is success", async () => {
      const {
        owner,
        mockUSDC,
        staking,
        DOLLAR_10,
        userOne,
        CLEARN_10,
        otherStrategyHub,
      } = await loadFixture(deployStakingFixture);
      await staking.setYieldDistributor(otherStrategyHub.address);
      await staking.connect(userOne).stake(CLEARN_10);
      await mockUSDC.connect(owner).mint(otherStrategyHub.address, DOLLAR_10);
      await mockUSDC
        .connect(otherStrategyHub)
        .approve(staking.address, DOLLAR_10);
      await staking.connect(otherStrategyHub).issuanceRate(DOLLAR_10);
      const timeStamp = (await ethers.provider.getBlock("latest")).timestamp;
      const periodFinish = await staking.periodFinish();
      const _30_DAYS_IN_SECONDS = 2592000;
      expect(periodFinish).to.be.equals(
        Number(timeStamp) + _30_DAYS_IN_SECONDS
      );
    });

    it("Should return good rewardRate rounded floor", async () => {
      const {
        owner,
        mockUSDC,
        staking,
        DOLLAR_10,
        userOne,
        CLEARN_10,
        otherStrategyHub,
      } = await loadFixture(deployStakingFixture);
      await staking.setYieldDistributor(otherStrategyHub.address);
      await staking.connect(userOne).stake(CLEARN_10);
      await mockUSDC.connect(owner).mint(otherStrategyHub.address, DOLLAR_10);
      await mockUSDC
        .connect(otherStrategyHub)
        .approve(staking.address, DOLLAR_10);
      await staking.connect(otherStrategyHub).issuanceRate(DOLLAR_10);
      const _30_DAYS_IN_SECONDS = 2592000;
      const rewardRate = await staking.rewardRate();

      expect(Number(rewardRate)).to.be.equals(
        Math.floor(DOLLAR_10 / _30_DAYS_IN_SECONDS)
      );
    });

    describe("Calculate Amount Earn", () => {
      it("Should return amount earn Bigger after 1 day", async () => {
        const {
          owner,
          mockUSDC,
          staking,
          DOLLAR_10,
          userOne,
          CLEARN_10,
          otherStrategyHub,
        } = await loadFixture(deployStakingFixture);
        await staking.setYieldDistributor(otherStrategyHub.address);
        await staking.connect(userOne).stake(CLEARN_10);
        await mockUSDC.connect(owner).mint(otherStrategyHub.address, DOLLAR_10);
        await mockUSDC
          .connect(otherStrategyHub)
          .approve(staking.address, DOLLAR_10);
        await staking.connect(otherStrategyHub).issuanceRate(DOLLAR_10);
        const earnedBefore = await staking.earned(userOne.address);
        const _1_DAYS_IN_SECONDS = 60 * 60 * 24 * 1;
        await mineUpTo(_1_DAYS_IN_SECONDS);
        const earnedAfter1Day = await staking.earned(userOne.address);
        expect(earnedAfter1Day).to.be.above(earnedBefore);
      });

      it("Should return amount 3 time Bigger than User One if stake in the same time", async () => {
        const {
          owner,
          mockUSDC,
          staking,
          DOLLAR_10,
          DOLLAR_30,
          CLEARN_30,
          DOLLAR_50,
          userOne,
          userThree,
          CLEARN_10,
          otherStrategyHub,
        } = await loadFixture(deployStakingFixture);
        await staking.setYieldDistributor(otherStrategyHub.address);
        await staking.connect(userOne).stake(CLEARN_10);
        await staking.connect(userThree).stake(CLEARN_30);
        await mockUSDC.connect(owner).mint(otherStrategyHub.address, DOLLAR_50);
        await mockUSDC
          .connect(otherStrategyHub)
          .approve(staking.address, DOLLAR_50);
        await staking.connect(otherStrategyHub).issuanceRate(DOLLAR_10);

        const _1_DAYS_IN_SECONDS = 60 * 60 * 24 * 1;
        await mineUpTo(_1_DAYS_IN_SECONDS);

        const earnedAfter1DayByUserOne = await staking.earned(userOne.address);
        const earnedAfter1DayByUserThree = await staking.earned(
          userThree.address
        );

        expect(earnedAfter1DayByUserThree).to.be.equals(
          earnedAfter1DayByUserOne * 3
        );
      });
      //TODO: CONTINUER TESTER EARNED SUR DIFFERENT SCEANRIO
    });
  });
});
