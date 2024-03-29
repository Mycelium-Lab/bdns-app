import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import mq from '../../mediaQuery'

import SetupName from '../SetupName/SetupName'
import RegistryMigration from './RegistryMigration'
import { DetailsItem, DetailsKey, DetailsValue } from './DetailsItem'
import { ReactComponent as ExternalLinkIcon } from '../Icons/externalLink.svg'
import DetailsItemEditable from './DetailsItemEditable'
import {
  RECLAIM,
  RENEW,
  SET_OWNER,
  SET_REGISTRANT,
  SET_SUBNODE_OWNER,
  SET_NEW_NFT_OWNER,
  UNWRAP,
  WRAP
} from '../../graphql/mutations'
import { SingleNameBlockies } from '../Blockies'
import You from '../Icons/You'
import SubmitProof from './SubmitProof'
import Tooltip from '../Tooltip/Tooltip'
import { HR } from '../Typography/Basic'
import { formatDate, formatDateUnix } from '../../utils/dates'
import ResolverAndRecords from './ResolverAndRecords'
import NameClaimTestDomain from './NameClaimTestDomain'
import DefaultLoader from '../Loader'
import DefaultButton from '../Forms/Button'
import DefaultAddressLink from '../Links/AddressLink'
import { ReactComponent as DefaultOrangeExclamation } from '../Icons/OrangeExclamation.svg'

const Details = styled('section')`
  color: white;
  padding: 20px;
  transition: 0.4s;
  ${mq.small`
    padding: 40px;
  `}
`

const Loader = styled(DefaultLoader)`
  width: 30%;
  margin: auto;
`

const Button = styled(DefaultButton)`
  position: absolute;
  width: 130px;
  background-colore: white;
`

const ButtonContainer = styled('div')`
  margin-top: 20px;
  height: 50px;
  ${mq.small`
    height: 50px;
    width: 50px;
    position: absolute;
    right: 128px;
    -webkit-transform: translate(0, -65%);
    -ms-transform: translate(0, -65%);
    transform: translate(0, -65%);
  `}
`

const ExpirationDetailsValue = styled(DetailsValue)`
  color: ${p => (p.isExpired ? 'red' : null)};
`

const AddressLink = styled(DefaultAddressLink)`
  display: flex;
  align-items: center;
`

const Explainer = styled('div')`
  background: #2d2d2f;
  color: #515151;
  display: flex;
  padding: 1em 0;
  margin-left: 0px;
  ${mq.small`
    margin-left: 180px;
  `}

  margin-bottom: 45px;
  padding-left: 24px;
`

const ErrorExplainer = styled(Explainer)`
  background: #fef7e9;
`

const OutOfSyncExplainer = styled('div')`
  margin-top: 20px;
  background: #fef7e9;
  display: flex;
`

const OutOfSyncExplainerContainer = styled('div')`
  margin-top: 15px;
`

const EtherScanLinkContainer = styled('span')`
  display: inline-block;
  transform: translate(25%, 20%);
`

const LinkToLearnMore = styled('a')`
  margin-right: ${props => (props.outOfSync ? '' : '')};
  font-size: 14px;
  letter-spacing: 0.58px;
  text-align: center;
  margin-left: auto;
  min-width: 130px;
`

const OrangeExclamation = styled(DefaultOrangeExclamation)`
  margin-right: 5px;
  margin-top: 6px;
  width: 20px;
  height: 20px;
`

const DNSOwnerError = styled('span')`
  color: #C6A15A;
`

const OwnerFields = styled('div')`
  background: ${props => (props.outOfSync ? '#fef7e9' : '')};
  padding: ${props => (props.outOfSync ? '1.5em' : '0')};
  margin-bottom: ${props => (props.outOfSync ? '1.5em' : '0')};
`

const DomainOwnerAddress = styled('span')`
  color: ${props => (props.outOfSync ? '#515151' : '')};
`

const GracePeriodWarningContainer = styled('div')`
  font-family: 'Overpass';
  background: ${p => (p.isExpired ? '#ff926f' : '#fef7e9')};
  padding: 10px 20px;
  margin: 5px 0px;
`

const GracePeriodText = styled('span')`
  color: ${p => (p.isExpired ? 'white' : '#515151')};
  margin-left: 0.5em;
`

const GracePeriodDate = styled('span')`
  font-weight: bold;
`

const Expiration = styled('span')`
  color: ${p => (p.isExpired ? 'white' : '#C6A15A')};
  font-weight: bold;
`

const GracePeriodWarning = ({ date, expiryTime }) => {
  let { t } = useTranslation()
  let isExpired = new Date() > new Date(expiryTime)
  return (
    <GracePeriodWarningContainer isExpired={isExpired}>
      <Expiration isExpired={isExpired}>
        {isExpired
          ? t('singleName.expiry.expired')
          : t('singleName.expiry.expiring')}
      </Expiration>
      <GracePeriodText isExpired={isExpired}>
        {t('singleName.expiry.gracePeriodEnds')}{' '}
        <GracePeriodDate>{formatDate(date)}</GracePeriodDate>
      </GracePeriodText>
    </GracePeriodWarningContainer>
  )
}

function canClaim(domain) {
  if (!domain.name?.match(/\.test$/)) return false
  return parseInt(domain.owner) === 0 || domain.expiryTime < new Date()
}

function DetailsContainer({
  isMigratedToNewRegistry,
  isOwnerOfNFT,
  isDeedOwner,
  isRegistrant,
  showExplainer,
  canSubmit,
  outOfSync,
  loading,
  setLoading,
  isOwnerOfParent,
  isOwner,
  refetch,
  domain,
  dnssecmode,
  account,
  loadingIsMigrated,
  refetchIsMigrated,
  isParentMigratedToNewRegistry,
  loadingIsParentMigrated,
  readOnly = false
}) {
  const { t } = useTranslation()
  const isExpired = domain.expiryTime < new Date()
  const domainOwner =
    domain.available || domain.owner === '0x0' ? null : domain.owner
  const registrant =
    domain.available || domain.registrant === '0x0' ? null : domain.registrant

  const domainParent =
    domain.name === '[root]' ? null : domain.parent ? domain.parent : '[root]'

  const is2ld = domain.name?.split('.').length === 2
  const showUnclaimableWarning =
    is2ld &&
    parseInt(domain.owner) === 0 &&
    domain.parent !== '' &&
    !domain.isDNSRegistrar
  const showBrandsUnclaimableWarning =
    domain.domainType === 'BRAND' && !domain.isDomainUlocked
  return (
    <Details data-testid="name-details">
      {isOwner && <SetupName initialState={showExplainer} />}
      {showBrandsUnclaimableWarning && (
        <GracePeriodWarningContainer>
          <DetailsItem>
            {t('c.brandsCannotClaim', {
              brandsUnlockTime: formatDateUnix(domain.unlockTimestamp),
              brandName: domain.label
            })}
          </DetailsItem>
        </GracePeriodWarningContainer>
      )}
      {domainParent ? (
        <DetailsItem uneditable>
          <DetailsKey>{t('c.parent')}</DetailsKey>
          <DetailsValue>
            <Link to={`/name/${domainParent}`} aria-label={t('c.parent')}>
              {domainParent}
            </Link>
          </DetailsValue>
        </DetailsItem>
      ) : (
        ''
      )}
      {showUnclaimableWarning && (
        <GracePeriodWarningContainer>
          <DetailsItem>
            {t('c.cannotclaimDns', { name: domainParent })}
            <LinkToLearnMore
              href="https://docs.ens.domains/dns-registrar-guide"
              target="_blank"
            >
              {t('c.learnmore')}{' '}
              <EtherScanLinkContainer>
                <ExternalLinkIcon />
              </EtherScanLinkContainer>
            </LinkToLearnMore>
          </DetailsItem>
        </GracePeriodWarningContainer>
      )}
      <OwnerFields outOfSync={outOfSync}>
        {domain.parent === '' && domain.isNewRegistrar ? (
          <>
            <DetailsItemEditable
              domain={domain}
              keyName="registrant"
              value={registrant}
              canEdit={isRegistrant && !isExpired && !readOnly}
              isExpiredRegistrant={isRegistrant && isExpired}
              type="address"
              editButton={t('c.transfer')}
              mutationButton={t('c.transfer')}
              mutation={SET_REGISTRANT}
              refetch={refetch}
              confirm={true}
              copyToClipboard={true}
            />
            <DetailsItemEditable
              domain={domain}
              keyName="Controller"
              value={domainOwner}
              canEdit={
                !readOnly &&
                (isRegistrant || (isOwner && isMigratedToNewRegistry))
              }
              deedOwner={domain.deedOwner}
              isDeedOwner={isDeedOwner}
              type="address"
              editButton={isRegistrant ? t('c.set') : t('c.transfer')}
              mutationButton={isRegistrant ? t('c.set') : t('c.transfer')}
              mutation={isRegistrant ? RECLAIM : SET_OWNER}
              refetch={refetch}
              confirm={true}
              copyToClipboard={true}
            />
            {domain.isWrapped ? (
              <>
                <DetailsItemEditable
                  domain={domain}
                  keyName="nftowner"
                  value={domain.ownerOfNFT}
                  canEdit={isOwnerOfNFT && !isExpired && !readOnly}
                  isExpiredRegistrant={isRegistrant && isExpired}
                  type="address"
                  editButton={t('c.transfer')}
                  mutationButton={t('c.transfer')}
                  mutation={SET_NEW_NFT_OWNER}
                  refetch={refetch}
                  confirm={true}
                  copyToClipboard={true}
                />
                <DetailsItemEditable
                  domain={domain}
                  keyName="unwrap"
                  value={'YES'}
                  canEdit={
                    isOwnerOfNFT && !isExpired && !readOnly && domain.isWrapped
                  }
                  isExpiredRegistrant={isRegistrant && isExpired}
                  type="bool"
                  editButton={t('c.unwrapAction')}
                  mutationButton={t('c.unwrapAction')}
                  mutation={UNWRAP}
                  refetch={refetch}
                  confirm={true}
                  copyToClipboard={false}
                />
              </>
            ) : (
              <DetailsItemEditable
                domain={domain}
                keyName="wrap"
                value={'NO'}
                canEdit={
                  isOwner && !isExpired && !readOnly && !domain.isWrapped
                }
                isExpiredRegistrant={isRegistrant && isExpired}
                type="bool"
                editButton={t('c.wrapAction')}
                mutationButton={t('c.wrapAction')}
                mutation={WRAP}
                refetch={refetch}
                confirm={true}
                copyToClipboard={false}
              />
            )}
          </>
        ) : domain.parent === '' && !domain.isNewRegistrar ? (
          <>
            <DetailsItem uneditable>
              <DetailsKey>{t('c.registrant')}</DetailsKey>
              <DetailsValue>
                <AddressLink
                  address={domain.deedOwner}
                  arialLabel={t('c.registrant')}
                >
                  <SingleNameBlockies
                    address={domain.deedOwner}
                    imageSize={24}
                  />
                  {domain.deedOwner}
                </AddressLink>
              </DetailsValue>
            </DetailsItem>
            <DetailsItemEditable
              domain={domain}
              keyName="Controller"
              value={domain.owner}
              canEdit={
                !readOnly &&
                (isRegistrant || (isOwner && isMigratedToNewRegistry))
              }
              deedOwner={domain.deedOwner}
              isDeedOwner={isDeedOwner}
              type="address"
              editButton={isRegistrant ? t('c.set') : t('c.transfer')}
              mutationButton={isRegistrant ? t('c.set') : t('c.transfer')}
              mutation={isRegistrant ? RECLAIM : SET_OWNER}
              refetch={refetch}
              confirm={true}
              copyToClipboard={true}
            />
          </>
        ) : domain.isDNSRegistrar ? (
          <DetailsItem uneditable>
            <DetailsKey>
              {t('c.Controller')} {isOwner ? <You /> : ''}
            </DetailsKey>
            <DetailsValue>
              <AddressLink address={domain.owner} ariaLabel={t('c.Controller')}>
                {outOfSync ? (
                  <SingleNameBlockies
                    address={domain.owner}
                    imageSize={24}
                    color={'#E1E1E1'}
                    bgcolor={'#FFFFFF'}
                    spotcolor={'#CFCFCF'}
                  />
                ) : (
                  <SingleNameBlockies address={domain.owner} imageSize={24} />
                )}
                <DomainOwnerAddress outOfSync={outOfSync}>
                  {domain.owner}
                </DomainOwnerAddress>
              </AddressLink>
            </DetailsValue>
            <ButtonContainer outOfSync={outOfSync}>
              {canSubmit && !readOnly ? (
                <SubmitProof
                  name={domain.name}
                  parentOwner={domain.parentOwner}
                  refetch={refetch}
                  actionText={t('c.sync')}
                />
              ) : (
                <Tooltip
                  text={t(
                    'singleName.tooltips.detailsItem.ControllerAndDnsAlreadySync'
                  )}
                  position="left"
                  border={true}
                  warning={true}
                  offset={{ left: -30, top: 10 }}
                >
                  {({ tooltipElement, showTooltip, hideTooltip }) => {
                    return (
                      <Button
                        onMouseOver={() => {
                          showTooltip()
                        }}
                        onMouseLeave={() => {
                          hideTooltip()
                        }}
                        type="disabled"
                      >
                        {t('c.sync')}
                        {tooltipElement}
                      </Button>
                    )
                  }}
                </Tooltip>
              )}
            </ButtonContainer>
          </DetailsItem>
        ) : (
          // Either subdomain, or .test
          <DetailsItemEditable
            domain={domain}
            keyName="Controller"
            value={domain.owner}
            canEdit={
              !readOnly &&
              ((isOwner || isOwnerOfParent) && isMigratedToNewRegistry)
            }
            deedOwner={domain.deedOwner}
            isDeedOwner={isDeedOwner}
            outOfSync={outOfSync}
            type="address"
            editButton={isOwnerOfParent ? t('c.set') : t('c.transfer')}
            mutationButton={isOwnerOfParent ? t('c.set') : t('c.transfer')}
            mutation={isOwnerOfParent ? SET_SUBNODE_OWNER : SET_OWNER}
            refetch={refetch}
            confirm={true}
            copyToClipboard={true}
          />
        )}
        {/* To be replaced with a logic a function to detect dnsregistrar */}
        {domain.isDNSRegistrar ? (
          <>
            <DetailsItem uneditable>
              <DetailsKey>{t('dns.dnsowner')}</DetailsKey>
              <DetailsValue>
                {dnssecmode.displayError ? (
                  <DNSOwnerError>{dnssecmode.title}</DNSOwnerError>
                ) : (
                  <AddressLink
                    address={domain.dnsOwner}
                    ariaLabel={t('dns.dnsowner')}
                  >
                    <SingleNameBlockies
                      address={domain.dnsOwner}
                      imageSize={24}
                    />
                    {domain.dnsOwner}
                  </AddressLink>
                )}
              </DetailsValue>
              <ButtonContainer outOfSync={outOfSync}>
                {loading ? (
                  <Button>
                    <Loader />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setLoading(true)
                      refetch()
                        .then(dd => {
                          setLoading(false)
                        })
                        .catch(err => {
                          console.log('failed to refetch', err)
                        })
                    }}
                  >
                    {t('c.refresh')}{' '}
                  </Button>
                )}
              </ButtonContainer>
            </DetailsItem>
            {dnssecmode.displayError ? (
              <ErrorExplainer>
                <OrangeExclamation />
                {domain.stateError
                  ? domain.stateError
                  : t('singleName.dns.messages.error')}
                <LinkToLearnMore
                  href="https://docs.ens.domains/dns-registrar-guide"
                  target="_blank"
                >
                  {t('c.learnmore')}{' '}
                  <EtherScanLinkContainer>
                    <ExternalLinkIcon />
                  </EtherScanLinkContainer>
                </LinkToLearnMore>
              </ErrorExplainer>
            ) : outOfSync ? (
              <OutOfSyncExplainerContainer>
                <HR />
                <OutOfSyncExplainer>
                  <OrangeExclamation />
                  <Trans i18nKey={'singleName.dns.messages.outOfSync'}>
                    {dnssecmode.explainer}
                  </Trans>
                  <LinkToLearnMore
                    href="https://docs.ens.domains/dns-registrar-guide"
                    target="_blank"
                    outOfSync={outOfSync}
                  >
                    {t('c.learnmore')}{' '}
                    <EtherScanLinkContainer>
                      <ExternalLinkIcon />
                    </EtherScanLinkContainer>
                  </LinkToLearnMore>
                </OutOfSyncExplainer>
              </OutOfSyncExplainerContainer>
            ) : (
              <Explainer>
                <Trans i18nKey={'singleName.dns.messages.readyToRegister'}>
                  {dnssecmode.explainer}
                </Trans>
                <LinkToLearnMore
                  href="https://docs.ens.domains/dns-registrar-guide"
                  target="_blank"
                >
                  {t('c.learnmore')}{' '}
                  <EtherScanLinkContainer>
                    <ExternalLinkIcon />
                  </EtherScanLinkContainer>
                </LinkToLearnMore>
              </Explainer>
            )}
          </>
        ) : (
          ''
        )}

        {domain.registrationDate ? (
          <DetailsItem uneditable>
            <DetailsKey>{t('c.registrationDate')}</DetailsKey>
            <DetailsValue>{formatDate(domain.registrationDate)}</DetailsValue>
          </DetailsItem>
        ) : (
          ''
        )}
        {!domain.available ? (
          domain.isNewRegistrar || domain.gracePeriodEndDate ? (
            <>
              <DetailsItemEditable
                domain={domain}
                keyName="Expiration Date"
                value={domain.expiryTime}
                canEdit={!readOnly && parseInt(account, 16) !== 0}
                type="date"
                editButton={t('c.renew')}
                mutationButton={t('c.renew')}
                mutation={RENEW}
                refetch={refetch}
                confirm={true}
              />
              {domain.gracePeriodEndDate ? (
                <GracePeriodWarning
                  expiryTime={domain.expiryTime}
                  date={domain.gracePeriodEndDate}
                />
              ) : (
                ''
              )}
            </>
          ) : domain.expiryTime ? (
            <DetailsItem uneditable>
              <DetailsKey>{t("c['Expiration Date']")}</DetailsKey>
              <ExpirationDetailsValue isExpired={isExpired}>
                {formatDate(domain.expiryTime)}
              </ExpirationDetailsValue>
            </DetailsItem>
          ) : (
            ''
          )
        ) : (
          ''
        )}
      </OwnerFields>
      <HR />
      <ResolverAndRecords
        domain={domain}
        isOwner={isOwner}
        isOwnerOfNFT={isOwnerOfNFT}
        refetch={refetch}
        account={account}
        isMigratedToNewRegistry={isMigratedToNewRegistry}
        readOnly={readOnly}
      />
      {canClaim(domain) ? (
        <NameClaimTestDomain domain={domain} refetch={refetch} />
      ) : null}
    </Details>
  )
}

export default DetailsContainer
