import { setupENS } from '../../ui'
import { isENSReadyReactive } from '../reactiveVars'

let ens = {},
  registrar = {},
  ensRegistryAddress = undefined,
  nameWrapper = {}

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
    nameWrapper: nameWrapperInstance
  } = await setupENS(option)
  ens = ensInstance
  nameWrapper = nameWrapperInstance
  registrar = registrarInstance
  console.log('Registrar: ', registrar)
  ensRegistryAddress = ensAddress
  isENSReadyReactive(true)
  return { ens, registrar, providerObject, nameWrapper }
}

export function getRegistrar() {
  return registrar
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
