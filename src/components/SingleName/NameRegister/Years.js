import React from 'react'
import styled from '@emotion/styled/macro'
import { useTranslation } from 'react-i18next'
import mq from 'mediaQuery'

const YearsContainer = styled('div')`
  ${mq.medium`
    max-width: 220px;
  `}
`

const Stepper = styled('div')`
  display: grid;
  grid-template-columns:
    30px auto
    30px;
  border-bottom: 1px solid #515151;
`

const Icon = styled('div')`
  font-family: Overpass;
  font-size: 28px;
  font-weight: 100;
  color: #515151;
  ${p => p.emphasize && 'background-color: #C6A15A;'}
  ${p => (p.emphasize ? 'color: #515151;' : 'color: #515151;')}
  ${p => (p.emphasize ? 'border-color: #515151;' : 'color: #515151;')}
  
  border-radius: 50%;
  border: solid 1px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  transition: 0.2s;

  &:hover {
    border: solid white 1px;
    color: white;
    cursor: pointer;
  }
`

const Amount = styled('div')`
  width: 150px;
  padding: 0 5px;
  display: flex;
  font-family: Overpass;
  font-size: 28px;
  font-weight: 100;
  color: white;
  justify-self: left;
  align-self: center;

  input {
    background: transparent;
    font-family: Overpass;
    font-size: 28px;
    font-weight: 100;
    color: white;
    border: none;
    max-width: 65px;
    outline: 0;
    text-align: center;
  }
`

const Description = styled('div')`
  font-family: Overpass;
  font-weight: 300;
  font-size: 14px;
  color: #515151;
  margin-top: 10px;
`

const Years = ({ years, setYears, tokenId }) => {
  const { t } = useTranslation()
  const incrementYears = () => setYears(years + 1)
  const decrementYears = () => (years >= 1 ? setYears(years - 1) : null)
  const currentLanguage = window.localStorage.getItem('language')
  return (
    <YearsContainer>
      <Stepper>
        {!tokenId && <Icon onClick={decrementYears}>-</Icon>}
        <Amount>
          {tokenId ? (
            '1 '
          ) : (
            <input
              type="text"
              value={years}
              aria-label={t('pricer.yearUnit')}
              onChange={e => {
                const sign = Math.sign(e.target.value)
                if (sign === -1 || isNaN(sign)) {
                  setYears(0)
                } else {
                  setYears(e.target.value)
                }
              }}
            />
          )}
          {t('pricer.yearUnit')}
          {currentLanguage === 'en' && years > 1 && 's'}
        </Amount>
        {!tokenId && (
          <Icon onClick={incrementYears} emphasize={years < 2}>
            +
          </Icon>
        )}
      </Stepper>
      <Description>{t('pricer.registrationPeriodLabel')}</Description>
    </YearsContainer>
  )
}

export default Years
