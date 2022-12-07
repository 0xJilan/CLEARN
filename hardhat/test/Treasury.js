const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

describe("Deploy Treasury constructor", async () => {
  const deployTreasuryFixture = async () => {
    const [owner, strategyHub, user] = await ethers.getSigners();
    const Clearn = await ethers.getContractFactory("Clearn");
    const clearn = await Clearn.deploy();
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(clearn.address, strategyHub.address);
    await clearn.setMinter(treasury.address);

    return { clearn, treasury, owner, strategyHub, user };
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
});
