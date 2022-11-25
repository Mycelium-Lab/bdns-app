import styled from '@emotion/styled/macro'
import mq from 'mediaQuery'

const TopBar = styled('div')`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #2d2d2f;

  background: ${({ percentDone }) =>
    percentDone
      ? `
  linear-gradient(to right, rgba(128, 255, 128, 0.1) 0%, rgba(82,229,255, 0.1) ${percentDone}%,#ffffff ${percentDone}%)`
      : '#222224'};

  ${mq.small`
    padding: 20px 40px;
  `}
`

export default TopBar
