import styled from "styled-components";
import Footer from "components/Footer";
import Header from "components/Header";
import Home from "components/Home";
import styles from "../styles/Home.module.css";

const Layout = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  height: 82%;
  padding: 2rem 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export default function Index() {
  return (
    <Layout>
      <Header />
      <Main>
        <Home />
      </Main>
      <Footer />
    </Layout>
  );
}
