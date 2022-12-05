import styled from "styled-components";
import Image from "next/image";
import Card from "components/Card";

const HomeWrapper = styled.div`
  height: 100%;
  width: 100%;
  padding: 2% 4%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
const Illustration = styled.div`
  display: flex;
  height: 100%;
  width: 40%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const InvestBox = styled.div`
  display: flex;
  height: 100%;
  width: 40%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Home = () => {
  return (
    <HomeWrapper>
      <Illustration>
        <Image src="/Invest.svg" alt="Clearn logo" width={240} height={380} />
        <h1>CLEARN</h1>
        <h4>Epargne solidaire</h4>
      </Illustration>
      <InvestBox>
        <Card />
      </InvestBox>
    </HomeWrapper>
  );
};
export default Home;
