import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled/macro'
import moment from 'moment'
import { css } from 'emotion'
import { useHistory } from 'react-router-dom'
import { Mutation } from '@apollo/client/react/components'
import { useTranslation } from 'react-i18next'
import EthVal from 'ethval'

import { trackReferral } from '../../../utils/analytics'
import { COMMIT, REGISTER, REGISTER_NFT } from '../../../graphql/mutations'

import { w3mProvider } from '@web3modal/ethereum'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { arbitrum, mainnet, polygon } from 'wagmi/chains'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletButton } from '../../HomePage/WalletButton'

import PendingTx from '../../PendingTx'
import Button from '../../Forms/Button'
import AddToCalendar from '../../Calendar/RenewalCalendar'
import { ReactComponent as DefaultPencil } from '../../Icons/SmallPencil.svg'
import { ReactComponent as DefaultOrangeExclamation } from '../../Icons/OrangeExclamation.svg'
import { useAccount } from '../../QueryAccount'
import { connectProvider } from '../../../utils/providerUtils'
import NoAccountsModal from '../../NoAccounts/NoAccountsModal'

const CTAContainer = styled('div')`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  color: white;
`
const Pencil = styled(DefaultPencil)`
  margin-right: 5px;
`

const Prompt = styled('span')`
  color: #c6a15a;
  margin-right: 10px;
`

const OrangeExclamation = styled(DefaultOrangeExclamation)`
  margin-right: 5px;
  height: 12px;
  width: 12px;
`

const LeftLink = styled(Link)`
  margin-right: 20px;
`

function getCTA({
  step,
  incrementStep,
  secret,
  duration,
  label,
  hasSufficientBalance,
  txHash,
  setTxHash,
  setCommitmentTimerRunning,
  commitmentTimerRunning,
  isAboveMinDuration,
  refetch,
  refetchIsMigrated,
  isNameWrapped,
  isReadOnly,
  price,
  years,
  premium,
  history,
  t,
  ethUsdPrice,
  account,
  tokenId
}) {
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

  const CTAs = {
    PRICE_DECISION: (
      <Mutation
        mutation={COMMIT}
        variables={{ label, secret, commitmentTimerRunning, duration }}
        onCompleted={data => {
          const txHash = Object.values(data)[0]
          setTxHash(txHash)
          setCommitmentTimerRunning(true)
          incrementStep()
        }}
      >
        {mutate =>
          isAboveMinDuration && !isNameWrapped && !isReadOnly ? (
            hasSufficientBalance ? (
              <Button
                data-testid="request-register-button"
                onClick={mutate}
                type="primary-gold"
              >
                {t('register.buttons.request')}
              </Button>
            ) : (
              <>
                <Prompt>
                  <OrangeExclamation />
                  {t('register.buttons.insufficient')}
                </Prompt>
                <Button data-testid="request-register-button" type="disabled">
                  {t('register.buttons.request')}
                </Button>
              </>
            )
          ) : !isNameWrapped ? (
            <>
              <Prompt>
                <OrangeExclamation />
                {t('register.buttons.connect')}
              </Prompt>
              <div
                style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
              >
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
              </div>
            </>
          ) : (
            <Button data-testid="request-register-button" type="disabled">
              {t('register.buttons.request')}
            </Button>
          )
        }
      </Mutation>
    ),
    COMMIT_SENT: <PendingTx txHash={txHash} />,
    COMMIT_CONFIRMED: (
      <Button data-testid="disabled-register-button" type="disabled">
        {t('register.buttons.register')}
      </Button>
    ),
    AWAITING_REGISTER: (
      <Mutation
        mutation={tokenId ? REGISTER_NFT : REGISTER}
        variables={
          tokenId
            ? { label, tokenId, duration, secret }
            : { label, duration, secret }
        }
        onCompleted={data => {
          const txHash = Object.values(data)[0]
          setTxHash(txHash)
          incrementStep()
        }}
      >
        {mutate => (
          <>
            {hasSufficientBalance ? (
              <>
                <Prompt>
                  <OrangeExclamation />
                  {t('register.buttons.warning')}
                </Prompt>
                <Button data-testid="register-button" onClick={mutate}>
                  {t('register.buttons.register')}
                </Button>
              </>
            ) : (
              <>
                <Prompt>
                  <OrangeExclamation />
                  {t('register.buttons.insufficient')}
                </Prompt>
                <Button data-testid="register-button" type="disabled">
                  {t('register.buttons.register')}
                </Button>
              </>
            )}
          </>
        )}
      </Mutation>
    ),
    REVEAL_SENT: (
      <PendingTx
        txHash={txHash}
        onConfirmed={async () => {
          if (ethUsdPrice) {
            // this is not set on local test env
            trackReferral({
              transactionId: txHash,
              labels: [label],
              type: 'register', // renew/register
              price: new EthVal(`${price._hex}`)
                .toEth()
                .mul(ethUsdPrice)
                .toFixed(2), // in wei, // in wei
              years,
              premium
            })
          }
          incrementStep()
        }}
      />
    ),
    REVEAL_CONFIRMED: (
      <>
        <AddToCalendar
          css={css`
            margin-right: 20px;
          `}
          name={label}
          startDatetime={moment()
            .utc()
            .local()
            .add(duration, 'seconds')
            .subtract(30, 'days')}
        />
        <LeftLink
          onClick={async () => {
            await Promise.all([refetch(), refetchIsMigrated()])
            history.push(`/name/${label}`)
          }}
          data-testid="manage-name-button"
        >
          {t('register.buttons.manage')}
        </LeftLink>
        <Button
          onClick={async () => {
            await Promise.all([refetchIsMigrated()])
            history.push(`/address/${account}`)
          }}
        >
          <Pencil />
          {t('register.buttons.setreverserecord')}
        </Button>
      </>
    )
  }
  return CTAs[step]
}

const CTA = ({
  step,
  incrementStep,
  secret,
  duration,
  label,
  hasSufficientBalance,
  setTimerRunning,
  setCommitmentTimerRunning,
  commitmentTimerRunning,
  setBlockCreatedAt,
  isAboveMinDuration,
  refetch,
  refetchIsMigrated,
  isReadOnly,
  isNameWrapped,
  price,
  years,
  premium,
  ethUsdPrice,
  tokenId
}) => {
  const { t } = useTranslation()
  const history = useHistory()
  const account = useAccount()
  const [txHash, setTxHash] = useState(undefined)
  useEffect(() => {
    return () => {
      if (step === 'REVEAL_CONFIRMED') {
        refetch()
      }
    }
  }, [step])

  return (
    <CTAContainer>
      {getCTA({
        step,
        incrementStep,
        secret,
        duration,
        label,
        hasSufficientBalance,
        txHash,
        setTxHash,
        setTimerRunning,
        setBlockCreatedAt,
        setCommitmentTimerRunning,
        commitmentTimerRunning,
        isAboveMinDuration,
        refetch,
        refetchIsMigrated,
        isNameWrapped,
        isReadOnly,
        price,
        years,
        premium,
        history,
        t,
        ethUsdPrice,
        account,
        tokenId
      })}
    </CTAContainer>
  )
}

export default CTA
