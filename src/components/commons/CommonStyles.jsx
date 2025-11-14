import { Form } from "antd";
import styled from "styled-components";
const ButtonStyle = styled.div`
  button {
    font-size: 17px;
    margin-right: 20px;
    border: 1px solid gray;
    padding: 7px 17px;
    border-radius: 5px;
    background: transparent;
    color: inherit;
  }
  /* Primary action (submit) uses CSS variable for app-wide primary color */
  button[type="submit"] {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  button[type="submit"]:hover {
    filter: brightness(0.95);
  }

  button:hover {
    border: 1px solid #11699c;
    color: #11699c;
  }
  .disable,
  .disable:hover {
    color: gray;
    border: 1px solid gray;
  }
`;

const FormStyle = styled(Form)`
  /* width: 100%;
  border:  1px solid red; */
`;

const FlexStyle = styled.div`
  display: flex;
  gap: 10px;

  /* border:  1px solid gray; */
  width: 100%;
`;

const SearchInputStyle = styled.div`
  .ant-input-affix-wrapper {
    margin-left: 25px;
    width: 220px;
    border: 1px solid gray;
    padding: 6px 10px;
    font-size: 17px;
  }

  input::placeholder {
    opacity: 0.6;
    color: black;
  }
  .ant-input-clear-icon {
    font-size: 19px; /* Adjust the font size for the clear button */
    line-height: 1; /* Set line-height to adjust the vertical alignment */
  }
`;

export { ButtonStyle, FlexStyle, FormStyle, SearchInputStyle };
