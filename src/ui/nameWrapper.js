import { utils, BigNumber } from 'ethers'
import ResultsContainer from 'routes/SearchResults'
import { interfaces } from './constants/interfaces'
import {
  getBulkRenewalContract,
  getDeedContract,
  getDnsRegistrarContract,
  getENSContract,
  getLegacyAuctionContract,
  getOldDnsRegistrarContract,
  getPermanentRegistrarContract,
  getNameWrapperContract,
  getPermanentRegistrarControllerContract,
  getResolverContract,
  getTestRegistrarContract,
  getOracleContract
} from './contracts'
import DNSRegistrarJS from './dnsregistrar'
import { isEncodedLabelhash, labelhash } from './utils/labelhash'
import { namehash } from './utils/namehash'
import {
  getAccount,
  getBlock,
  getNetworkId,
  getProvider,
  getSigner
} from './web3'

const {
  legacyRegistrar: legacyRegistrarInterfaceId,
  permanentRegistrar: permanentRegistrarInterfaceId,
  bulkRenewal: bulkRenewalInterfaceId,
  dnsRegistrar: dnsRegistrarInterfaceId,
  dnssecClaimOld: dnssecClaimOldId,
  dnssecClaimNew: dnssecClaimNewId
} = interfaces

// Renewal seem failing as it's not correctly estimating gas to return when buffer exceeds the renewal cost
const transferGasCost = 21000

// Add 10% buffer to handle price fructuation.
// Any unused value will be sent back by the smart contract.
function getBufferedPrice(price) {
  return price.mul(110).div(100)
}

export default class NameWrapper {
  constructor() {
    if (!process.env.REACT_APP_NAME_WRAPPER)
      throw 'Set name wrapper env variable address'
  }
  async getOwnerOfNFT(name) {
    let provider = await getProvider()
    const NameWrapperContract = getNameWrapperContract({
      address: process.env.REACT_APP_NAME_WRAPPER,
      provider
    })
    return NameWrapperContract.ownerOf(utils.namehash(name))
  }
  async isOwnerOfNFT(name) {
    const ownerOfNFT = await this.getOwnerOfNFT(name)
    const account = await getAccount()
    return ownerOfNFT.toLowerCase() === account.toLowerCase()
  }
  async getIsWrapped(name) {
    let provider = await getProvider()
    const NameWrapperContract = getNameWrapperContract({
      address: process.env.REACT_APP_NAME_WRAPPER,
      provider
    })
    const namehash = utils.namehash(name)
    return NameWrapperContract.isWrapped(namehash)
  }
  async unwrap(labelhash, registrant, controller) {
    let provider = await getProvider()
    const NameWrapperContractWithoutSigner = getNameWrapperContract({
      address: process.env.REACT_APP_NAME_WRAPPER,
      provider
    })
    const signer = await getSigner()
    const NameWrapperContract = NameWrapperContractWithoutSigner.connect(signer)
    return NameWrapperContract.unwrap(labelhash, registrant, controller)
  }
  async getApproved(labelhash) {
    let provider = await getProvider()
    const BaseRegistrarImplementation = getPermanentRegistrarContract({
      address: process.env.REACT_APP_BASE_REGISTRAR,
      provider
    })
    return BaseRegistrarImplementation.getApproved(labelhash)
  }
  async isApprovedForWrap(labelhash) {
    const approvedAddress = await this.getApproved(labelhash)
    return approvedAddress === process.env.REACT_APP_NAME_WRAPPER
  }
  async isApprovedForWrapByName(name) {
    const approvedAddress = await this.getApproved(utils.id(name))
    return approvedAddress === process.env.REACT_APP_NAME_WRAPPER
  }
  async approveWrap(labelhash) {
    let provider = await getProvider()
    const BaseRegistrarImplementationWithoutSigner = getPermanentRegistrarContract(
      {
        address: process.env.REACT_APP_BASE_REGISTRAR,
        provider
      }
    )
    const signer = await getSigner()
    const BaseRegistrarImplementation = BaseRegistrarImplementationWithoutSigner.connect(
      signer
    )
    return BaseRegistrarImplementation.approve(
      process.env.REACT_APP_NAME_WRAPPER,
      labelhash
    )
  }
  async wrap(label, wrappedOwner, resolver) {
    let provider = await getProvider()
    const NameWrapperContractWithoutSigner = getNameWrapperContract({
      address: process.env.REACT_APP_NAME_WRAPPER,
      provider
    })
    const signer = await getSigner()
    const NameWrapperContract = NameWrapperContractWithoutSigner.connect(signer)
    return NameWrapperContract.wrap(
      label,
      wrappedOwner,
      0,
      BigNumber.from('0xFFFFFFFFFFFFFFF0'),
      resolver
    )
  }
  async safeTransferFrom(from, to, id) {
    let provider = await getProvider()
    const NameWrapperContractWithoutSigner = getNameWrapperContract({
      address: process.env.REACT_APP_NAME_WRAPPER,
      provider
    })
    const signer = await getSigner()
    const NameWrapperContract = NameWrapperContractWithoutSigner.connect(signer)
    return NameWrapperContract.safeTransferFrom(
      from,
      to,
      utils.namehash(id),
      1,
      []
    )
  }
}
