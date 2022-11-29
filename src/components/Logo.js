import React from 'react'
import styled from '@emotion/styled/macro'
import { Link } from 'react-router-dom'
import mq from 'mediaQuery'

import ENSLogo from '../assets/ensIconLogo.svg'
import LogoTyped from '../assets/TypeLogo'

const IconLogo = styled('img')`
  width: 30px;
  margin-right: 20px;
  fill: #fff;
  ${mq.medium`
    width: 34px
  `}
`

const LogoContainer = styled('a')`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  color: #000 !important;
  fill: #000;
  padding-left: 20px;
  align-items: center;
  width: auto;

  ${mq.medium`
    width: 200px;
  `}
`

const Logo = ({ color, className, to = 'https://bdns.app/' }) => (
  <LogoContainer className={className} href={to}>
    <IconLogo src={ENSLogo} />
    <h2 color={'#000'}>BDNS</h2>
  </LogoContainer>
)

export default Logo
