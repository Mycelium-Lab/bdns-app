import styled from '@emotion/styled/macro'
import { ReactComponent as Pencil } from '../Icons/Pencil.svg'

const StyledPencil = styled(Pencil)`
  ${p =>
    p.disabled &&
    `
     g {
       fill: #515151;
     }
  `}
  &:hover {
    g {
      transition: 0.2s;
      fill: #c6a15a;
    }
    cursor: pointer;
  }

  ${p =>
    p.disabled &&
    `
    &:hover {
      cursor: default;
      g {
        fill: #515151;
      }
    }
  `}
`

export default StyledPencil
