import styled from '@emotion/styled/macro'
import { ReactComponent as Bin } from '../Icons/Bin.svg'

const StyledBin = styled(Bin)`
  flex-shrink: 0;
  &:hover {
    g {
      transition: 0.2s;
      fill: #c6a15a;
    }

    cursor: pointer;
  }
`

export default StyledBin
