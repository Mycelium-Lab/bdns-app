import styled from '@emotion/styled/macro'

const Icon = styled('svg')`
  path {
    transition: 0.2s;
    fill: ${p => (p.color ? p.color : p.active ? '#C6A15A' : '#c6a15a')};
    width: ${p => p.width}px;
  }

  g {
    fill: ${p => (p.color ? p.color : p.active ? '#C6A15A' : '#c6a15a')};
  }
`

export default Icon
