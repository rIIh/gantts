import styled from 'styled-components';
import { Modal } from 'react-bootstrap';
import { Colors, Palette } from '../../../../colors';

export const StyledHeader = styled(Modal.Header)<{ progress?: number; color?: Colors<Palette> }>`
  padding: 30px 31px 20px;
  position: relative;
  transition: background-color 1s ease;
  border-bottom: none;
  background-color: ${props => props.color ? Palette[props.color].fill : '#dadada'};
  
  &::before {
    content: " ";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => `${props.progress ?? 0}%`};
    z-index: 0;
    background-color: ${props => props.color ? Palette[props.color].border : '#a1a1a1'};
    transition: width 0.5s ease, background-color 1s ease;
  }
  
  > * {
    z-index: 50;
  }
`;

export const Details = styled.div`
  width: 525px;
`;

export const Title = styled.input`
    font-size: 16px;
    line-height: 18px;
    margin-bottom: 20px;
    padding: 15px;
    width: 100%;
`;

export const FormInline = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  
  > :not(:last-child) {
    margin-right: 1rem;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  align-items: center;

  label {
    font-size: 13px;
    margin-right: 10px;
    margin-bottom: 0;
  }
  
  .value {
    color: rgba(0, 0, 0, 0.69);
    font-size: 14px;
    font-weight: 600;
  }
`;
