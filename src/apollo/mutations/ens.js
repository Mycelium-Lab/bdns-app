import { setupENS } from '../../ui'
import { isENSReadyReactive } from '../reactiveVars'

let ens = {},
  registrar = {},
  ensRegistryAddress = undefined,
  nameWrapper = {},
  reservedDomains = {}

export async function setup({
  reloadOnAccountsChange,
  enforceReadOnly,
  enforceReload,
  customProvider,
  ensAddress // = process.env.REACT_APP_ENS_ADDRESS
}) {
  let option = {
    reloadOnAccountsChange: false,
    enforceReadOnly,
    enforceReload,
    customProvider,
    ensAddress
  }
  const {
    ens: ensInstance,
    registrar: registrarInstance,
    providerObject,
    nameWrapper: nameWrapperInstance,
    reservedDomains: reservedDomainsInstance
  } = await setupENS(option)
  ens = ensInstance
  nameWrapper = nameWrapperInstance
  registrar = registrarInstance
  reservedDomains = reservedDomainsInstance
  console.log('Registrar: ', registrar)
  ensRegistryAddress = ensAddress
  isENSReadyReactive(true)
  return { ens, registrar, providerObject, nameWrapper }
}

export function getRegistrar() {
  return registrar
}
export function getReservedDomains() {
  return reservedDomains
}
export function getNameWrapper() {
  return nameWrapper
}

export function getEnsAddress() {
  return ensRegistryAddress
}

export default function getENS() {
  return ens
}
