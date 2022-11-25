import React from 'react'
import styled from '@emotion/styled/macro'
import { Link } from 'react-router-dom'

function getButtonStyles({ type }) {
  switch (type) {
    case 'primary':
      return `
        &:visited {
          color: white;
        }
        &:hover {
          cursor: pointer;
          border: 2px solid #C6A15A;
          background: #C6A15A;
          
          border-radius: 23px;
        }
      `
    case 'hollow':
      return `
        background: transparent;
        color: #DFDFDF;
        border: 2px solid #DFDFDF;
        &:hover {
          cursor: pointer;
          border: 2px solid transparent;
          background: #C6A15A;
          
        }
      `
    case 'hollow-white':
      return `
        background: transparent;
        color: white;
        border: 2px solid #fff;
        &:visited {
          color: white;
        }
        &:hover {
          color: white;
          cursor: pointer;
          border: 2px solid transparent;
          background: #C6A15A;
          
        }
      `
    case 'hollow-primary':
      return `
        color: #C6A15A;
        background: transparent;
        border: 2px solid #C6A15A;
        &:visited {
          color: #C6A15A;
        }
        &:hover {
          cursor: pointer;
          border: 2px solid #C6A15A;
          color: #C6A15A;
        }
      `
    case 'hollow-primary-disabled':
      return `
        color: #dfdfdf;
        background: transparent;
        border: 2px solid #dfdfdf;
        &:visited {
          color: #dfdfdf;
        }
        &:hover {
          color: #dfdfdf;
          cursor: default
        }
      `
    case 'primary-gold':
      return `
        color: #C6A15A;
        background: transparent;
        border: 2px solid #C6A15A;
        border-radius: 0px;
        &:visited {
          color: white;
        }
        &:hover {
          cursor: pointer;
          background: #C6A15A;
          color: #222224;
        }
      `
    case 'disabled':
      return `
        border: 2px solid #525252;
        background: #525252;
        &:hover {
          cursor: default
        }
        &:hover {
          color: white;
          cursor: default
        }
      `
    default:
      return ''
  }
}

function getButtonDefaultStyles(p) {
  return `
    color: white;
    background: #C6A15A;
    padding: 10px 25px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: 700;
    font-family: Overpass;
    text-transform: capitalize;
    letter-spacing: 1.5px;
    transition: 0.2s all;
    border: 2px solid #C6A15A;
    text-align: center;

    &:focus {
      outline: 0;
    }
  `
}

const ButtonContainer = styled('button')`
  ${p => getButtonDefaultStyles(p)};
  ${p => getButtonStyles(p)};
`

const ExternalButtonLinkContainer = styled('a')`
  text-decoration: none;
  ${p => getButtonDefaultStyles(p)};
  ${p => getButtonStyles(p)};
`

const ButtonLinkContainer = styled(Link)`
  color: white;
  &:hover {
    color: white;
  }
  &:visited {
    color: white;
  }
  ${p => getButtonDefaultStyles(p)};
  ${p => getButtonStyles(p)};
`

const Button = props => {
  const { className, children, type = 'primary', onClick } = props
  return (
    <ButtonContainer
      className={className}
      type={type}
      onClick={onClick}
      {...props}
    >
      {children}
    </ButtonContainer>
  )
}

export const ButtonLink = props => {
  const { className, children, type = 'primary', to = '' } = props
  return (
    <ButtonLinkContainer className={className} to={to} type={type} {...props}>
      {children}
    </ButtonLinkContainer>
  )
}

export const ExternalButtonLink = props => {
  const { className, children, type = 'primary', href } = props
  return (
    <ExternalButtonLinkContainer
      className={className}
      href={href}
      type={type}
      {...props}
    >
      {children}
    </ExternalButtonLinkContainer>
  )
}

export default Button

export { getButtonDefaultStyles, getButtonStyles }
