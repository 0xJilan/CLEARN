import styled from "styled-components";

export const ButtonWrapper = styled.div`
  background-color: #097d39;
  height: min-content;
  border-radius: 0.875rem;
`;

const ChoiceButton = styled.button`
  background-color: #097d39;
  height: min-content;
  padding: 1rem;
  border: 1px solid #8da461;
  border-top-right-radius: ${(props) =>
    props.type === "left" ? "0" : "0.875"}rem;
  border-bottom-right-radius: ${(props) =>
    props.type === "left" ? "0" : "0.875"}rem;
  border-top-left-radius: ${(props) =>
    props.type === "left" ? "0.875" : "0"}rem;
  border-bottom-left-radius: ${(props) =>
    props.type === "left" ? "0.875" : "0"}rem;
`;

export const Choice = ({ type, name, action }) => {
  return (
    <ChoiceButton type={type} onClick={action}>
      {name}
    </ChoiceButton>
  );
};
