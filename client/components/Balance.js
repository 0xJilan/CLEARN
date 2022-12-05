import { useBalance, useAccount } from "wagmi";
import useIsMounted from "lib/useIsMounted";
import styled from "styled-components";

const BalanceWrapper = styled.div`
  margin-bottom: 4rem;
`;
const Balance = ({ token }) => {
  const { address } = useAccount();
  const mounted = useIsMounted();
  const tokens = {
    ETH: "test",
    USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
    CLEARN: "0xFc77b86F3ADe71793E1EEc1E7944DB074922856e",
    xCLEARN: "0x25B9f82D1F1549F97b86bd0873738E30f23D15ea",
  };

  const getBalance = (token) => {
    const { data, isError, isLoading } =
      token === "ETH"
        ? useBalance({
            address: address,
          })
        : useBalance({
            address: address,
            token: tokens[token],
          });
    if (isLoading) return <div>Fetching balance…</div>;
    if (isError) return <div>Error fetching balance</div>;
    return data?.formatted.slice(0, 5);
  };
  const balance = getBalance(token);

  return (
    <BalanceWrapper>
      {mounted ? `${token} Balance: ${balance}` : null}
    </BalanceWrapper>
  );
};

export default Balance;
