import { getProvider, setupWeb3, getNetworkId, getNetwork } from './web3'
import { ENS } from './ens.js'
import { setupRegistrar } from './registrar'
import NameWrapper from './nameWrapper'
export { utils, ethers } from 'ethers'
import ReservedDomains from './reservedDomains'
export async function setupENS({
  customProvider,
  ensAddress,
  reloadOnAccountsChange,
  enforceReadOnly,
  enforceReload
} = {}) {
  const { provider } = await setupWeb3({
    customProvider,
    reloadOnAccountsChange,
    enforceReadOnly,
    enforceReload,
    ensAddress
  })
  console.log('creating ens', ensAddress)
  const networkId = await getNetworkId()
  console.log('ens provider', provider, networkId)
  const ens = new ENS({ provider, networkId, registryAddress: ensAddress })
  console.log('ENS contract to use in ui - ', ens)
  const registrar = await setupRegistrar(ens.registryAddress)
  console.log('ENS registrar - ', registrar)
  const nameWrapper = new NameWrapper()

  const reservedDomains = new ReservedDomains()
  console.log('ENS Name Wrapper - ', nameWrapper)
  const network = await getNetwork()
  return {
    ens,
    registrar,
    provider: customProvider,
    network,
    providerObject: provider,
    nameWrapper,
    reservedDomains
  }
}

export * from './ens'
export * from './registrar'
export * from './web3'
export * from './constants/interfaces'
export * from './utils'
export * from './contracts'
