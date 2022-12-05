import styled from "styled-components";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import useIsMounted from "lib/useIsMounted";

const Header = styled.header`
  display: flex;
  width: 100%;
  height: 10%;
  padding: 2% 4%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  box-shadow: 4px 0px 20px 0px #a4c467;
  border-bottom-left-radius: 20%;
  border-bottom-right-radius: 20%;
`;

const Logo = styled.div`
  width: 10%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Navigation = styled.div`
  height: 100%;
  width: 75%;
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const Wallet = styled.div`
  width: 15%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;
const FakeRound = styled.div`
  height: 16px;
  width: 16px;
  border-radius: 2rem;
  background-color: #097d39;
`;

const HeaderComponent = () => {
  const mounted = useIsMounted();
  return (
    <Header>
      <Logo>
        <Image src="/logo.png" alt="Clearn logo" width={64} height={64} />
      </Logo>
      <Navigation>
        <p>Investir</p>
        <p>Comprendre</p>
        <p>Associations</p>
      </Navigation>
      <ConnectButton />
    </Header>
  );
};

export default HeaderComponent;
