import React from 'react'
import styled from '@emotion/styled/macro'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client'

import NetworkInformation from '../NetworkInformation/NetworkInformation'
import Heart from '../Icons/Heart'
import File from '../Icons/File'
import { aboutPageURL, hasNonAscii } from '../../utils/utils'
import SpeechBubble from '../Icons/SpeechBubble'
import { ReactComponent as FaqIcon } from '../../assets/faqIcon.svg'

import mq from 'mediaQuery'
import { Link, withRouter } from 'react-router-dom'
import gql from 'graphql-tag'
import Info from 'components/Icons/Info'

const SideNavContainer = styled('nav')`
  display: ${p => (p.isMenuOpen ? 'block' : 'none')};
  position: fixed;
  z-index: 1;
  ${mq.medium`
    z-index: 1;
  `}

  left: 0;
  height: auto;
  background: white;
  width: 100%;
  margin-top: -10px;
  ${mq.medium`
    padding: 0;
    left: 35px;
    margin-top: 50px;
    height: auto;
    background: transparent;
    width: 165px;
    display: block;
  `}

  ul {
    padding: 0;
    margin: 0;
  }
  li {
    list-style: none;
  }
  path {
    fill: #c6a15a;
  }
  g {
    fill: #c6a15a;
  }
  ${p =>
    p.hasNonAscii
      ? `
      top: 200px;
      ${mq.medium`top: 200px`}
    `
      : `
      top: 100px;
      ${mq.medium`top: 100px`}
    `}
`

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 200;
  font-size: 22px;
  color: ${p => (p.active ? 'white' : '#C6A15A')};
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  ${mq.medium`
    justify-content: start;
    border-bottom: 0;
  `}

  &:visited {
    color: #c6a15a;
  }

  span {
    transition: 0.2s;
    margin-left: 15px;
    color: ${p => (p.active ? 'white' : '#C6A15A')};
  }
  path {
    fill: #c6a15a;
  }
  g {
    fill: #c6a15a;
  }
  &:hover {
    span {
      color: #515151;
    }
    path {
      fill: #515151;
    }
    g {
      fill: #515151;
    }
  }
`

const ThirdPartyLink = styled('a')`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 200;
  font-size: 22px;
  color: ${p => (p.active ? 'white' : '#C6A15A')};
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);

  ${mq.medium`
    justify-content: start;
    border-bottom: 0;
  `}

  &:visited {
    color: #c6a15a;
  }

  span {
    transition: 0.2s;
    margin-left: 15px;
    color: ${p => (p.active ? 'white' : '#C6A15A')};
  }
  path {
    fill: #c6a15a;
  }
  g {
    fill: #c6a15a;
  }
  &:hover {
    span {
      color: #515151;
    }
    path {
      fill: #515151;
    }
    g {
      fill: #515151;
    }
  }
`

const SIDENAV_QUERY = gql`
  query getSideNavData {
    accounts
    isReadOnly
  }
`

function SideNav({ match, isMenuOpen, toggleMenu }) {
  const { url } = match
  const { t } = useTranslation()
  const {
    data: { accounts, isReadOnly }
  } = useQuery(SIDENAV_QUERY)
  return (
    <SideNavContainer isMenuOpen={isMenuOpen} hasNonAscii={hasNonAscii()}>
      <NetworkInformation />
      <ul data-testid="sitenav">
        {accounts?.length > 0 && !isReadOnly ? (
          <li>
            <NavLink
              onClick={toggleMenu}
              active={url === '/address/' + accounts[0] ? 1 : 0}
              to={'/address/' + accounts[0]}
            >
              <File active={url === '/address/' + accounts[0]} />
              <span>{t('c.mynames')}</span>
            </NavLink>
          </li>
        ) : null}
        <li>
          <NavLink
            onClick={toggleMenu}
            active={url === '/favourites' ? 1 : 0}
            to="/favourites"
          >
            <Heart active={url === '/favourites'} />
            <span>{t('c.favourites')}</span>
          </NavLink>
        </li>
        <li>
          <ThirdPartyLink href={aboutPageURL()}>
            <Info />
            <span>{t('c.about')}</span>
          </ThirdPartyLink>
        </li>
      </ul>
    </SideNavContainer>
  )
}
export default withRouter(SideNav)
