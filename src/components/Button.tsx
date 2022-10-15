import React from "react";
import { Button as AntdButton } from "antd";
import styled from "styled-components";

const StyledButton = styled(AntdButton)`
  width: 250px;
  height: 50px;
  background-color: #f5e9e2;
  border-radius: 8px;
  border: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0b0014;

  :hover {
    color: #0b0014;
    background-color: #e3b5a4;
  }
`;

type Props = {
  title: string;
  onClick: any;
};

const Button: React.FC<Props> = ({ title, onClick }) => {
  return (
    <StyledButton type="primary" onClick={onClick}>
      {title}
    </StyledButton>
  );
};

export default Button;
