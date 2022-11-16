import { normalize } from '@ensdomains/eth-ens-namehash'
import { validate } from '@ensdomains/ens-validation'
import { addressUtils } from '@0xproject/utils'

function isEncodedLabelhash(hash) {
  return hash.startsWith('[') && hash.endsWith(']') && hash.length === 66
}

export const parseSearchTerm = (term, validTld) => {
  console.log(term, validTld)
  try {
    if (validTld) {
      throw new Error("Domain can't have same name as popular tlds")
    }
    validateName(term)
  } catch (e) {
    if (e.message === 'Domain cannot have dots') {
      return 'haveDots'
    } else if (e.message === 'Domain cannot start with "0x", "1" or "3"') {
      return 'startsWithIllegal'
    } else {
      return 'invalid'
    }
  }
  if (addressUtils.isAddress(term)) {
    return 'address'
  } else {
    return 'supported'
  }
}
function checkIfStartsWithInvalidChars(name) {
  let startsWithInvalidCharsRegex = /^(0x.*)|^[13].*/
  return startsWithInvalidCharsRegex.test(name)
}
export function validateName(name) {
  try {
    if (name.includes('.')) {
      throw new Error('Domain cannot have dots')
    }
    if (checkIfStartsWithInvalidChars(name) && !addressUtils.isAddress(name)) {
      throw new Error('Domain cannot start with "0x", "1" or "3"')
    }
    if (!validate(name)) {
      throw new Error('Domain cannot have invalid characters')
    }
    return name
  } catch (e) {
    throw e
  }
}
