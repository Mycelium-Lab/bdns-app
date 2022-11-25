import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from '@emotion/styled/macro'
import { formatDateUnix } from 'utils/dates'
const NotAvailableContainer = styled('div')`
  padding: 30px 40px;
`

const Message = styled('div')`
  background: #2d2d2f;
  color: white;
  font-size: 20px;
  padding: 20px;
  font-weight: 300;
`

export default function NotAvailable({ domain }) {
  const { t } = useTranslation()
  let notAvailableMessage = t('singleName.messages.alreadyregistered')
  if (domain.domainType === 'BRAND' && !domain.isDomainUnlocked) {
    notAvailableMessage = t('c.brandsCannotClaim', {
      brandsUnlockTime: formatDateUnix(domain.unlockTimestamp),
      brandName: domain.label
    })
  }
  return (
    <NotAvailableContainer>
      <Message>{notAvailableMessage}</Message>
    </NotAvailableContainer>
  )
}
