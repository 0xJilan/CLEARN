import { useState } from "react";
import styled from "styled-components";
import Image from "next/image";

const CardWrapper = styled.div`
  display: flex;
  width: 380px;
  height: 440px;
  flex-direction: column;
  justify-content: center;
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
`;

const Text = styled.span`
  font-size: 0.75rem;
`;

const ViewName = styled.h2`
  font-size: 2rem;
`;

const Card = () => {
  const [view, setView] = useState("DEPOSIT");
  return (
    <CardWrapper>
      <ViewBox>
        <Text onClick={() => setView("DEPOSIT")}>DEPOSIT</Text>
        <span>|</span>
        <Text onClick={() => setView("STAKING")}>STAKING</Text>
        <span>|</span>
        <Text onClick={() => setView("UNSTAKE")}>UNSTAKE</Text>
      </ViewBox>
      <ViewName>{view}</ViewName>
    </CardWrapper>
  );
};

export default Card;
