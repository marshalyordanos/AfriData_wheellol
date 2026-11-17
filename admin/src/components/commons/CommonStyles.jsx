import { Form } from "antd";
import styled from "styled-components";

/* Footer bar for add/edit forms: Cancel (secondary) + Submit (primary), right aligned. */
const ButtonStyle = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid var(--c-border);

  button {
    height: 44px;
    min-width: 104px;
    padding: 0 20px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid var(--c-border-strong);
    background: var(--c-surface);
    color: var(--c-text);
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  button:hover {
    border-color: var(--c-border-hover);
    background: var(--c-subtle);
  }
  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px var(--c-primary-ring);
  }

  button[type="submit"] {
    background: var(--c-primary-strong);
    border-color: var(--c-primary-strong);
    color: #ffffff;
    box-shadow: 0 6px 16px -8px rgba(194, 65, 12, 0.7);
  }
  button[type="submit"]:hover {
    background: var(--c-primary-hover);
    border-color: var(--c-primary-hover);
    transform: translateY(-1px);
  }

  .disable,
  .disable:hover,
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

/* Form body: fields flow into two columns when the modal is wide enough. */
const FormStyle = styled(Form)`
  &.ant-form-vertical {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    column-gap: 18px;
    margin-top: 8px;
  }
  &.ant-form-vertical > .ant-form-item:has(textarea),
  &.ant-form-vertical > .ant-form-item:has(.ant-upload-drag),
  &.ant-form-vertical > .ant-form-item:has(.ant-upload-list-picture-card),
  &.ant-form-vertical > .ant-form-item:has(.ant-checkbox-group),
  &.ant-form-vertical > *:not(.ant-form-item) {
    grid-column: 1 / -1;
  }
`;

const FlexStyle = styled.div`
  display: flex;
  gap: 18px;
  width: 100%;
  flex-wrap: wrap;
  & > * {
    flex: 1 1 240px;
  }
`;

const SearchInputStyle = styled.div`
  .ant-input-affix-wrapper {
    width: 280px;
    max-width: 100%;
  }
`;

export { ButtonStyle, FlexStyle, FormStyle, SearchInputStyle };
