import React from 'react'
import styled from '@emotion/styled/macro'
import { ReactComponent as DefaultSmallCaret } from './SmallCaret.svg'

const RotatingSmallCaretSide = styled(DefaultSmallCaret)`
  flex-shrink: 0;
  transform: ${p => (p.rotated ? 'rotate(0)' : 'rotate(-90deg)')};
  transition: 0.2s;
  filter: brightness(0) saturate(100%) invert(34%) sepia(0%) saturate(0%)
    hue-rotate(246deg) brightness(88%) contrast(90%);
`

const RotatingSmallCaretTop = styled(DefaultSmallCaret)`
  flex-shrink: 0;
  transform: ${p => (p.rotated ? 'rotate(-180deg)' : 'rotate(0)')};
  transition: 0.2s;
  ${p =>
    p.highlight &&
    p.rotated &&
    `
      path {
        fill: #C6A15A;
      }
  `}
`

export default function RotatingSmallCaret({
  start = 'right',
  rotated,
  highlight = 'false',
  testid
}) {
  if (start === 'right') {
    return (
      <RotatingSmallCaretSide
        rotated={rotated ? 1 : 0}
        highlight={highlight}
        data-testid={testid}
      />
    )
  } else if (start === 'top') {
    return (
      <RotatingSmallCaretTop
        rotated={rotated ? 1 : 0}
        highlight={highlight}
        data-testid={testid}
      />
    )
  }
}
