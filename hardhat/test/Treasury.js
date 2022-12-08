const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

describe("Deploy Treasury constructor", async () => {
  const deployTreasuryFixture = async () => {
    const [owner, strategyHub, user, fakePriceFeed] = await ethers.getSigners();
    const DOLLAR_10_IN_USDC = 10000000;
    const DOLLAR_50_IN_USDC = 50000000;
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("USDC", "USDC");
    await mockUSDC.connect(owner).mint(user.address, DOLLAR_10_IN_USDC);
    const Clearn = await ethers.getContractFactory("Clearn");
    const clearn = await Clearn.deploy();
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(clearn.address, strategyHub.address);
    await clearn.setMinter(treasury.address);
    await treasury.addTokenInfo(mockUSDC.address, fakePriceFeed.address);
    await mockUSDC.connect(user).approve(treasury.address, DOLLAR_10_IN_USDC);

    return {
      clearn,
      treasury,
      owner,
      strategyHub,
      fakePriceFeed,
      user,
      mockUSDC,
      DOLLAR_10_IN_USDC,
      DOLLAR_50_IN_USDC,
    };
  };

  describe("Check Minter of Clearn", () => {
    it("Should treasury is Minter of CLEARN ", async () => {
      const { clearn, treasury } = await loadFixture(deployTreasuryFixture);
      expect(await clearn.minter()).to.equal(treasury.address);
    });
    it("Should revert if treasury is not Minter of CLEARN ", async () => {
      const { clearn, owner } = await loadFixture(deployTreasuryFixture);
      expect(await clearn.minter()).to.not.equal(owner.address);
    });
  });

  describe("Handle whitelisted assets", () => {
    const _token = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
    const _pricefeed = "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7";

    it("Should add a whitelisted assets & his Price Feed", async () => {
      const { treasury } = await loadFixture(deployTreasuryFixture);
      await treasury.addTokenInfo(_token, _pricefeed);
      expect(await treasury.priceFeeds(_token)).to.equal(_pricefeed);
    });
    it("Should return true if an asset is depositable ", async () => {
      const { treasury } = await loadFixture(deployTreasuryFixture);
      await treasury.addTokenInfo(_token, _pricefeed);
      expect(await treasury.depositableTokens(_token)).to.be.true;
    });

    it("Should remove whitelisted assets & his Price Feed", async () => {
      const { treasury } = await loadFixture(deployTreasuryFixture);
      await treasury.addTokenInfo(_token, _pricefeed);
      await treasury.removeTokenInfo(_token);
      expect(await treasury.priceFeeds(_token)).to.equal(
        ethers.constants.AddressZero
      );
    });
    it("Should return true if an asset is depositable ", async () => {
      const { treasury } = await loadFixture(deployTreasuryFixture);
      expect(await treasury.depositableTokens(_token)).to.be.false;
    });

    it("Should revert if not owner", async () => {
      const { treasury, user } = await loadFixture(deployTreasuryFixture);
      await expectRevert(
        treasury.connect(user).addTokenInfo(_token, _pricefeed),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Deposit", () => {
    it("Should mint USDC for user", async () => {
      const { user, mockUSDC, DOLLAR_10_IN_USDC } = await loadFixture(
        deployTreasuryFixture
      );
      expect(await mockUSDC.balanceOf(user.address)).to.equal(
        DOLLAR_10_IN_USDC
      );
    });

    it("Should whitelist USDC in treasury Contract", async () => {
      const { treasury, mockUSDC } = await loadFixture(deployTreasuryFixture);
      expect(await treasury.depositableTokens(mockUSDC.address)).to.be.true;
    });

    it("Should approve treasury USDC spending for user", async () => {
      const { treasury, user, mockUSDC, DOLLAR_10_IN_USDC } = await loadFixture(
        deployTreasuryFixture
      );
      expect(await mockUSDC.allowance(user.address, treasury.address)).to.equal(
        DOLLAR_10_IN_USDC
      );
    });

    it("Should revert if user amount deposit is 0", async () => {
      const { user, treasury, mockUSDC } = await loadFixture(
        deployTreasuryFixture
      );
      await expect(
        treasury.connect(user).deposit(mockUSDC.address, 0)
      ).to.be.revertedWith("Deposit must be more than 0");
    });

    it("Should fail if user don't have enough USDC when deposit", async () => {
      const { user, treasury, mockUSDC, DOLLAR_50_IN_USDC } = await loadFixture(
        deployTreasuryFixture
      );
      await expect(
        treasury.connect(user).deposit(mockUSDC.address, DOLLAR_50_IN_USDC)
      ).to.be.revertedWith("Not enough USDC");
    });

    it("Should fail if treasury don't have enough allowance on user USDC fund", async () => {
      const { owner, user, treasury, mockUSDC, DOLLAR_50_IN_USDC } =
        await loadFixture(deployTreasuryFixture);
      await mockUSDC.connect(owner).mint(user.address, DOLLAR_50_IN_USDC);
      await expect(
        treasury.connect(user).deposit(mockUSDC.address, DOLLAR_50_IN_USDC)
      ).to.be.revertedWith("Raise token allowance");
    });

    it("Should add CLEARN Balance to User when deposit success", async () => {
      const { clearn, user, treasury, mockUSDC, DOLLAR_10_IN_USDC } =
        await loadFixture(deployTreasuryFixture);
      await treasury.connect(user).deposit(mockUSDC.address, DOLLAR_10_IN_USDC);
      expect(await clearn.balanceOf(user.address)).to.be.above(1);
    });

    it("Should add USDC Balance to StrategyHub when deposit success", async () => {
      const { strategyHub, user, treasury, mockUSDC, DOLLAR_10_IN_USDC } =
        await loadFixture(deployTreasuryFixture);
      await treasury.connect(user).deposit(mockUSDC.address, DOLLAR_10_IN_USDC);
      expect(await mockUSDC.balanceOf(strategyHub.address)).to.equal(
        DOLLAR_10_IN_USDC
      );
    });
  });
});
