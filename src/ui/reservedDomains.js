import { utils, BigNumber } from 'ethers'
import {
  getReservedDomainsContract,
  getPermanentRegistrarControllerContract
} from './contracts'
import { labelhash } from './utils'
import { getProvider } from './web3'
const brandsLockedTime = BigNumber.from('7890000') // 3 months
export default class ReservedDomains {
  constructor() {
    if (!process.env.REACT_APP_RESERVED_DOMAINS)
      throw 'Set reserved domains env variable address'
  }
  // 0 - NORMAL
  // 1 - SPECIAL
  // 2 - BRAND
  async getDomainType(label) {
    let provider = await getProvider()
    const reserveDomainsContract = getReservedDomainsContract({
      address: process.env.REACT_APP_RESERVED_DOMAINS,
      provider
    })
    const domainType = await reserveDomainsContract.domainType(utils.id(label))
    switch (domainType) {
      case 0:
        return 'NORMAL'
      case 1:
        return 'SPECIAL'
      case 2:
        return 'BRAND'
    }
  }
  async getBrandsUnlockTimestamp() {
    let provider = await getProvider()
    const permanentRegistrarController = getPermanentRegistrarControllerContract(
      {
        address: process.env.REACT_APP_ROOT_REGISTRAR,
        provider
      }
    )
    const startTimestamp = await permanentRegistrarController.START()
    const unlockTimestamp = startTimestamp.add(brandsLockedTime)
    return parseInt(unlockTimestamp.toString())
  }
}
