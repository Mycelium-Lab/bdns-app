import styled from '@emotion/styled/macro'
import { ReactComponent as Upload } from '../Icons/Upload.svg'

const StyledUpload = styled(Upload)`
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

export default StyledUpload
