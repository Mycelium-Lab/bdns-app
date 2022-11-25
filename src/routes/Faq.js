import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styled from '@emotion/styled/macro'
import mq from 'mediaQuery'

import { H2 as DefaultH2, Title } from '../components/Typography/Basic'
import Anchor from '../components/Icons/Anchor'
import slugify from 'slugify'
import ReverseRecordImageSrc from '../assets/reverseRecordImage.png'
import {
  NonMainPageBannerContainer,
  DAOBannerContent
} from '../components/Banner/DAOBanner'

const H2 = styled(DefaultH2)`
  margin-top: 50px;
  margin-left: 20px;
  ${mq.medium`
    margin-left: 0;
  `}
`

const Question = styled('h3')`
  font-size: 15px;
  margin-right: 0.5em;
  display: inline;
`

const Answer = styled('p')``

const AnchorContainer = styled('a')``

const ImageContainer = styled('div')`
  margin: 2em;
`

const ReverseRecordImage = styled('img')`
  width: 100%;
  ${mq.medium`
    width: 600px;
  `}
`

const Section = ({ question, children }) => {
  let slug
  if (question) {
    slug = slugify(question, {
      lower: true
    })
  }
  return (
    <>
      <Question id={slug}>{question}</Question>
      <AnchorContainer href={`#${slug}`}>
        <Anchor />
      </AnchorContainer>

      <Answer>{children}</Answer>
    </>
  )
}

function Faq() {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = 'BDNS Faq'
  }, [])

  return (
    <>
      <FaqContainer>
        <Title>FAQ</Title>

        <Section question={t('faq.difference.title')}>
          {t('faq.difference.description')}
        </Section>

        <Section question={t('faq.nods.title')}>
          {t('faq.nods.description')}
        </Section>

        <Section question={t('faq.team.title')}>
          {t('faq.team.description')}
        </Section>

        <Section question={t('faq.notascam.title')}>
          {t('faq.notascam.description')}
        </Section>

        <Section question={t('faq.updates.title')}>
          {t('faq.updates.description')}
        </Section>

        <Section question={t('faq.partners.title')}>
          {t('faq.partners.description')}
        </Section>
      </FaqContainer>
    </>
  )
}

const FaqContainer = styled('div')`
  color: white;
  margin: 1em;
  padding: 20px 40px;
  background-color: #222224;
`

export default Faq
