import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled/macro'
import { useTranslation } from 'react-i18next'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client'

import { parseSearchTerm } from '../../utils/utils'
import '../../api/subDomainRegistrar'
import { withRouter } from 'react-router'
import searchIcon from '../../assets/search.svg'
import mq from 'mediaQuery'
import LanguageSwitcher from '../LanguageSwitcherHeader'
import getTokensId from 'ui/utils/walletResources'

const SearchForm = styled('form')`
  display: flex;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translate(0, -50%);
    display: block;
    width: 27px;
    height: 27px;
    background: url(${searchIcon}) no-repeat;
    filter: brightness(0) saturate(100%) invert(32%) sepia(0%) saturate(655%)
      hue-rotate(150deg) brightness(102%) contrast(91%);
  }

  input {
    padding: 20px 0 20px 55px;
    width: 100%;
    border: none;
    border-radius: 0;
    color: #222224;

    font-size: 18px;
    font-family: Overpass;
    font-weight: 100;
    ${mq.medium`
    border-top: 1px solid #C6A15A;
    border-bottom: 1px solid #C6A15A;
      width: calc(100% - 162px);
      font-size: 28px;
    `}

    &:focus {
      outline: 0;
    }

    &::-webkit-input-placeholder {
      /* Chrome/Opera/Safari */
      color: #585858;
    }
  }

  button {
    ${p => (p && p.hasSearch ? 'background: #C6A15A;' : 'background: #585858;')}
    color: #222224;
    font-size: 22px;
    font-family: Overpass;
    padding: 20px 0;
    height: 90px;
    width: 162px;
    border: none;
    display: none;
    ${mq.medium`
      display: block;
    `}

    &:hover {
      ${p => (p && p.hasSearch ? 'cursor: pointer;' : 'cursor: default;')}
    }
  }
`

const SEARCH_QUERY = gql`
  query searchQuery {
    isENSReady @client
  }
`

function Search({ history, className, style }) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(null)
  const {
    data: { isENSReady }
  } = useQuery(SEARCH_QUERY)
  let input

  const handleParse = e => {
    setInputValue(
      e.target.value
        .split('.')
        .map(term => term.trim())
        .join('.')
    )
  }
  const hasSearch = inputValue && inputValue.length > 0 && isENSReady

  const usePromo = inputValue => {
    const [isPromo, setIsPromo] = useState(false)
    const [offers, setOffers] = useState([])

    useEffect(() => {
      ;(async () => {
        if (!inputValue) {
          setIsPromo(false)
          return
        }
        const resources = await getTokensId()
        setIsPromo(Boolean(resources.length))
        setOffers(resources)
      })()
    }, [inputValue])

    return { isPromo, offers }
  }

  const { isPromo, offers } = usePromo(inputValue)

  return (
    <SearchForm
      className={className}
      style={style}
      action="#"
      hasSearch={hasSearch}
      onSubmit={async e => {
        e.preventDefault()
        if (!hasSearch) return
        const type = await parseSearchTerm(inputValue)
        let searchTerm
        if (input && input.value) {
          // inputValue doesn't have potential whitespace
          searchTerm = inputValue.toLowerCase()
        }
        if (!searchTerm || searchTerm.length < 1) {
          return
        }

        if (type === 'address') {
          history.push(`/address/${searchTerm}`)
          return
        }

        input.value = ''
        if (type === 'supported' || type === 'short') {
          history.push(
            isPromo
              ? {
                  pathname: `/names/register`,
                  state: {
                    offers,
                    searchTerm
                  }
                }
              : `/name/${searchTerm}/register`
          )
          return
        } else {
          history.push(`/search/${encodeURI(searchTerm)}`)
        }
      }}
    >
      <input
        placeholder={t('search.placeholder')}
        ref={el => (input = el)}
        onChange={handleParse}
        autoCapitalize="off"
      />
      <LanguageSwitcher />
      <button
        disabled={!hasSearch}
        type="submit"
        data-testid={'home-search-button'}
      >
        {t('search.button')}
      </button>
    </SearchForm>
  )
}

const SearchWithRouter = withRouter(Search)

const SearchContainer = ({ searchDomain, className, style }) => {
  return (
    <SearchWithRouter
      searchDomain={searchDomain}
      className={className}
      style={style}
    />
  )
}

export { SearchWithRouter as Search }

export default SearchContainer
