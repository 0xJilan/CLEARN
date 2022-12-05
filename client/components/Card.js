import { useState } from "react";
import styled from "styled-components";
import { ButtonWrapper, Choice } from "components/Buttons";
import Balance from "components/Balance";

const CardWrapper = styled.div`
  display: flex;
  width: 380px;
  height: 440px;
  flex-direction: column;
  align-items: center;
  border-radius: 1rem;
  background: #8fbb89;
  padding: 1rem;
  box-shadow: 4px 0px 20px 0px #a4c467;
`;

const ViewBox = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  cursor: pointer;
  margin: 1rem;
`;

const SelectCurrency = styled.div`
  display: inline-flex;
  align-items: center;
  height: 2rem;
`;
const SelectWrapper = styled.div`
  top: 2px;
  position: relative;
  width: 64px;
  height: 2rem;
  &::after {
    color: black;
    content: "▾";
    pointer-events: none;
    position: absolute;
    right: 10px;
    top: 2px;
    font-size: 20px;
  }
`;
const Select = styled.select`
  -moz-appearance: none;
  -webkit-appearance: none;
  height: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  padding: 2px 8px;
  width: 100%;
  font-size: 0.75rem;
  &:focus {
    color: black;
  }
  // Hack for IE 11+
  &::-ms-expand {
    display: none;
  }
`;

const Text = styled.span`
  font-size: 0.75rem;
`;

const ViewName = styled.span`
  font-size: 2rem;
  margin: 1rem;
`;

const SubTitle = styled.span`
  font-size: 1rem;
  font-weight: 400;
`;

const InputNumber = styled.input`
  display: flex;
  width: 25%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  background-clip: padding-box;
  border: 1px solid #b1b7c1;
  appearance: none;
  border-radius: 0.375rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  margin: 2rem 0 0.5rem;
`;
const Card = () => {
  const [view, setView] = useState("deposit");
  const [token, setToken] = useState("USDC");

  const [amount, setAmount] = useState(0);

  return (
    <CardWrapper>
      <ViewBox>
        <Text onClick={() => setView("deposit")}>DEPOSIT</Text>
        <span>|</span>
        <Text onClick={() => setView("staking")}>STAKING</Text>
        <span>|</span>
        <Text onClick={() => setView("unstake")}>UNSTAKE</Text>
      </ViewBox>

      <ViewName>{view.toUpperCase()}</ViewName>
      <SelectCurrency>
        <SubTitle>Currency</SubTitle>
        <SelectWrapper>
          <Select value={token} onChange={(e) => setToken(e.target.value)}>
            <option value="USDC">USDC</option>
            <option value="ETH">ETH</option>
          </Select>
        </SelectWrapper>
      </SelectCurrency>
      <SubTitle>
        {view === "deposit" && `Deposit ${token} to CLEARN`}
        {view === "staking" && "Stake CLEARN for xCLEARN"}
        {view === "unstake" && "Unstake xCLEARN for CLEARN"}
      </SubTitle>
      <InputNumber
        type="number"
        placeholder={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        max="1000"
      ></InputNumber>
      {view === "deposit" && <Balance token={token} />}
      {view === "staking" && <Balance token="CLEARN" />}
      {view === "unstake" && <Balance token="xCLEARN" />}

      <ButtonWrapper>
        <Choice
          type="left"
          name="Approve"
          action={() => console.log(`approve ${amount} ${token}`)}
        />
        <Choice
          type="right"
          name="Mint"
          action={() =>
            console.log(`mint ${amount} ${token} equivalent in CLEARN`)
          }
        />
      </ButtonWrapper>
    </CardWrapper>
  );
};

export default Card;
