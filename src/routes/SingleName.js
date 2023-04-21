import React, { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'

import { validateName, parseSearchTerm } from '../utils/utils'
import { useScrollTo } from '../components/hooks'
import { GET_SINGLE_NAME } from '../graphql/queries'
import Loader from '../components/Loader'
import SearchErrors from '../components/SearchErrors/SearchErrors'
import Name from '../components/SingleName/Name'
import { useHistory } from 'react-router'

const SINGLE_NAME = gql`
  query singleNameQuery @client {
    isENSReady
    networkId
  }
`

function SingleName({
  match: {
    params: { name: searchTerm }
  },
  location: { pathname, state },
  offer,
  isNft = false
}) {
  const history = useHistory()
  useScrollTo(0)

  const [valid, setValid] = useState(undefined)
  const [type, setType] = useState(undefined)
  const [name, setNormalisedName] = useState('')
  let errorMessage

  const notNormalized = offer || searchTerm

  const {
    data: { isENSReady }
  } = useQuery(SINGLE_NAME)
  const { data, loading, error, refetch } = useQuery(GET_SINGLE_NAME, {
    variables: { name },
    fetchPolicy: 'no-cache',
    context: {
      queryDeduplication: false
    }
  })

  useEffect(() => {
    let normalisedName
    if (isENSReady) {
      try {
        // This is under the assumption that validateName never returns false
        normalisedName = validateName(notNormalized)
        if (normalisedName !== notNormalized)
          history.replace(`/name/${normalisedName}`)
        setNormalisedName(normalisedName)
        if (!offer) document.title = notNormalized
      } catch {
        document.title = 'Error finding name'
      } finally {
        parseSearchTerm(normalisedName || notNormalized).then(_type => {
          if (_type === 'supported' || _type === 'tld' || _type === 'search') {
            setValid(true)

            setType(_type)
          } else {
            if (_type === 'invalid') {
              setType('domainMalformed')
            } else {
              setType(_type)
            }
            setValid(false)
          }
        })
      }
    }
  }, [notNormalized, isENSReady])

  if (valid) {
    if (loading) return <Loader large center />
    if (error) return <div>{(console.log(error), JSON.stringify(error))}</div>
    if (data?.singleName)
      return (
        <>
          {/*!offer && 
          <a onClick={history.push({
            pathname: `/names/register`,
            state: {
              offers: state.offers,
              searchTerm: state.searchTerm
            }
          })}>
            Вернуться к списку
          </a>
          */}
          <Name
            details={data.singleName}
            name={name}
            pathname={pathname}
            type={type}
            refetch={refetch}
            tokenId={isNft ? offer : null}
            locationState={state}
          />
        </>
      )
  }

  if (valid === false) {
    if (type === 'invalid') {
      errorMessage = 'domainMalformed'
    } else if (type === 'short') {
      errorMessage = 'tooShort'
    } else {
      errorMessage = type
    }
    return (
      <SearchErrors
        errors={[errorMessage]}
        searchTerm={name || notNormalized}
      />
    )
  } else {
    return <Loader large center />
  }
}

export default SingleName
