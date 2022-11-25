import styled from '@emotion/styled/macro'
import mq from 'mediaQuery'

const MainContainer = styled('div')`
  background: #222224;
  border-radius: 0;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;

  ${mq.small`
    border-radius: 6px;
  `}

  &:before {
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    display: block;
    content: '';
    background: ${({ state }) => {
      switch (state) {
        case 'Owned':
          return '#515151'
        case 'Auction':
        case 'Reveal':
          return 'linear-gradient(-180deg, #42E068 0%, #52E5FF 100%)'
        case 'Yours':
          return '#52e5ff'
        case 'Open':
          return '#C6A15A'
        default:
          return '#515151'
      }
    }};
    position: absolute;
  }
`

export default MainContainer
