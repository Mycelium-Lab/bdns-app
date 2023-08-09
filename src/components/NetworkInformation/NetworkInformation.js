import React from 'react'
import styled from '@emotion/styled/macro'
import { useTranslation } from 'react-i18next'
import { gql } from '@apollo/client'
import mq from 'mediaQuery'
import { useQuery, useMutation } from '@apollo/client'

import UnstyledBlockies from '../Blockies'
import NoAccountsModal from '../NoAccounts/NoAccountsModal'
import { GET_REVERSE_RECORD } from '../../graphql/queries'
import { connectProvider, disconnectProvider } from '../../utils/providerUtils'
import { imageUrl } from '../../utils/utils'

import { w3mProvider } from '@web3modal/ethereum'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { arbitrum, mainnet, polygon } from 'wagmi/chains'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletButton } from '../HomePage/WalletButton'

const NetworkInformationContainer = styled('div')`
  position: relative;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  padding-bottom: 20px;
  ${mq.medium`
    margin-top: 80px;
    margin-bottom: 50px;
    display: block;
    border: none;
  `}
`

const Blockies = styled(UnstyledBlockies)`
  border-radius: 50%;
  position: absolute;
  left: 10px;
  top: 10px;
  ${mq.medium`
    
  `}
`

const Avatar = styled('img')`
  width: 48px;
  position: absolute;
  left: 10px;
  top: 10px;
  border-radius: 50%;
  ${mq.medium`
    
  `}
`

const NetworkStatus = styled('div')`
  color: #515151;
  font-size: 14px;
  text-transform: capitalize;
  font-weight: 100;
  margin-top: -2px;
  margin-left: 1px;
  display: flex;
  align-items: center;

  &:before {
    content: '';
    display: flex;
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: #c6a15a;
    margin-right: 5px;
  }
`

const Account = styled('div')`
  color: #515151;
  font-size: 16px;
  font-weight: 200;
  font-family: Overpass Mono;
  width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const AccountContainer = styled('div')`
  padding: 10px 10px 10px 65px;
  position: relative;
  ${mq.medium`
    transform: translate(-25px, 5px);
    width: 225px;
    &:hover {
      background: #222224;
      
      border-radius: 6px;
      .account {
        overflow: visible;
        white-space: normal;
      }
    }
  `}
`

const NETWORK_INFORMATION_QUERY = gql`
  query getNetworkInfo @client {
    accounts
    isReadOnly
    isSafeApp
    avatar
    network
    displayName
  }
`

function NetworkInformation() {
  const { t } = useTranslation()
  const {
    data: { accounts, isSafeApp, network, displayName, isReadOnly }
  } = useQuery(NETWORK_INFORMATION_QUERY)

  const {
    data: { getReverseRecord } = {},
    loading: reverseRecordLoading
  } = useQuery(GET_REVERSE_RECORD, {
    variables: {
      address: accounts?.[0]
    },
    skip: !accounts?.length
  })

  const chains = [arbitrum, mainnet, polygon]
  const projectId = 'ed8030f6cd6f47993d17adb4b3c59c86'
  const { publicClient, webSocketPublicClient } = configureChains(chains, [
    w3mProvider({ projectId })
  ])
  const config = createConfig({
    autoConnect: true,
    connectors: [
      new InjectedConnector({
        chains,
        options: {
          name: 'BDNS Wallet',
          shimDisconnect: true
        }
      })
    ],
    publicClient,
    webSocketPublicClient
  })

  return (
    <NetworkInformationContainer hasAccount={accounts && accounts.length > 0}>
      {!isReadOnly ? (
        <AccountContainer>
          {!reverseRecordLoading &&
          getReverseRecord &&
          getReverseRecord.avatar ? (
            <Avatar
              src={imageUrl(getReverseRecord.avatar, displayName, network)}
            />
          ) : (
            <Blockies address={accounts[0]} imageSize={45} />
          )}
          <Account data-testid="account" className="account">
            <span>{displayName}</span>
          </Account>
          <NetworkStatus>
            {network} {t('c.network')}
          </NetworkStatus>
          {!isSafeApp && (
            <NoAccountsModal
              onClick={() => {
                window.onConnect = false
                disconnectProvider()
              }}
              buttonText={t('c.disconnect')}
              colour={'#C6A15A'}
            />
          )}
        </AccountContainer>
      ) : (
        <AccountContainer>
          <Account data-testid="account" className="account">
            {t('c.readonly')}
          </Account>
          <NetworkStatus>
            {network} {t('c.network')}
          </NetworkStatus>
          <NoAccountsModal
            onClick={() => {
              window.onConnect = true
              connectProvider()
            }}
            colour={'#C6A15A'}
            buttonText={t('c.connect')}
          />
          <WagmiConfig config={config}>
            <WalletButton isReadOnly={isReadOnly} />
          </WagmiConfig>
        </AccountContainer>
      )}
    </NetworkInformationContainer>
  )
}
export default NetworkInformation
