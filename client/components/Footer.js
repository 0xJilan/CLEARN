import styled from "styled-components";
import Link from "next/link";
import Image from "next/image";
const Footer = styled.footer`
  display: flex;
  width: 100%;
  height: 8%;
  padding: 1% 14%;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  box-shadow: 4px 0px 20px 0px #a4c467;
  border-top-left-radius: 20%;
  border-top-right-radius: 20%;
`;
const SocialWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: center;
`;
const SocialBox = styled(Link)`
  display: flex;
  width: 20%;
  height: 100%;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  cursor: pointer;
`;

const Text = styled.span`
  font-size: 0.75rem;
`;
const Social = ({ name, link }) => {
  return (
    <SocialBox href={link} target="_blank">
      <Image
        src={`/${name}.svg`}
        alt={`${name} social link logo`}
        width={24}
        height={24}
      />
    </SocialBox>
  );
};

const FooterComponent = () => {
  return (
    <Footer>
      <SocialWrapper>
        <Social name="twitter" link="https://twitter.com/clearn" />
        <Social name="github" link="https://github.com/0xJilan/CLEARN" />
        <Social name="discord" link="https://discord.com/invite/clearn" />
      </SocialWrapper>
      <Text>Copyright 2022</Text>
    </Footer>
  );
};

export default FooterComponent;
