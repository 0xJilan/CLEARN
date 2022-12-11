const hre = require("hardhat");

async function main() {
  const strategyHub = "0x719059ccd499908c0411768E4C78Bcc5e95a4Aac";
  const USDCGoerli = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
  const USDCChainlinkFeed = "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7";
  const Clearn = await hre.ethers.getContractFactory("Clearn");
  const clearn = await Clearn.deploy();
  await clearn.deployed();
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(clearn.address, strategyHub);
  await treasury.deployed();
  await clearn.setMinter(treasury.address);
  await treasury.addTokenInfo(USDCGoerli, USDCChainlinkFeed);
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(clearn.address, USDCGoerli);
  await staking.deployed();

  console.log("Deployment done !");
  console.log(`Clearn address: ${clearn.address}`);
  console.log(`Treasury address: ${treasury.address}`);
  console.log(`Staking address: ${staking.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
