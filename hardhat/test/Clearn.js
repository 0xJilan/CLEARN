const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { expectRevert } = require("@openzeppelin/test-helpers");

describe("Deploy", () => {
  const deployClearnFixture = async () => {
    const [owner, treasury, user] = await ethers.getSigners();
    const Clearn = await ethers.getContractFactory("Clearn");
    const clearn = await Clearn.deploy();
    await clearn.setMinter(treasury.address);
    return { clearn, owner, treasury, user };
  };

  describe("Set Minter", () => {
    it("Should set minter if owner", async () => {
      const { clearn, treasury } = await loadFixture(deployClearnFixture);
      await clearn.setMinter(treasury.address);
      expect(await clearn.minter()).to.equal(treasury.address);
    });

    it("Should revert if not owner", async () => {
      const { clearn, treasury, user } = await loadFixture(deployClearnFixture);
      await expectRevert(
        clearn.connect(user).setMinter(treasury.address),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Credit To", () => {
    it("Should revert if not minter", async () => {
      const { clearn, user } = await loadFixture(deployClearnFixture);
      await expect(clearn.creditTo(user.address, 100000)).to.be.revertedWith(
        "Not minter"
      );
    });

    it("Should mint CLEARN", async () => {
      const { clearn, treasury, user } = await loadFixture(deployClearnFixture);
      await clearn.connect(treasury).creditTo(user.address, 100000);
      expect(await clearn.balanceOf(user.address)).to.equal(100000);
    });
  });

  describe("Debit From", () => {
    it("Should revert if not minter", async () => {
      const { clearn, user } = await loadFixture(deployClearnFixture);
      await expect(clearn.debitFrom(user.address, 100000)).to.be.revertedWith(
        "Not minter"
      );
    });

    it("Should revert if not minter", async () => {
      const { clearn, user } = await loadFixture(deployClearnFixture);
      await expect(clearn.debitFrom(user.address, 100000)).to.be.revertedWith(
        "Not minter"
      );
    });

    it("Should revert if burn amount exceeds balance", async () => {
      const { clearn, treasury, user } = await loadFixture(deployClearnFixture);
      await expect(
        clearn.connect(treasury).debitFrom(user.address, 100000)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should burn CLEARN", async () => {
      const { clearn, treasury, user } = await loadFixture(deployClearnFixture);
      await clearn.connect(treasury).creditTo(user.address, 100000);
      await clearn.connect(treasury).debitFrom(user.address, 100000);
      expect(await clearn.balanceOf(user.address)).to.equal(0);
    });
  });
});
