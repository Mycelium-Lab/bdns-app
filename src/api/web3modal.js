import { getNetwork, getNetworkId, isReadOnly } from '../ui'
import { setup as setupENS } from '../apollo/mutations/ens'
import {
  isReadOnlyReactive,
  networkIdReactive,
  networkReactive,
  web3ProviderReactive
} from '../apollo/reactiveVars'
import { disconnectProvider } from 'utils/providerUtils'
import { rpcUrl } from '../rpcUrl'

let provider

const PORTIS_ID = '57e5d6ca-e408-4925-99c4-e7da3bdb8bf5'

const option = {
  network: 'mainnet', // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: () => import('@walletconnect/ethereum-provider'),
      packageFactory: true,
      options: {
        rpc: {
          1: rpcUrl
        }
      }
    },
    walletlink: {
      package: () => import('walletlink'),
      packageFactory: true,
      options: {
        appName: 'Blockchain Domain Name Service',
        jsonRpcUrl: rpcUrl
      }
    },
    portis: {
      package: () => import('@portis/web3'),
      packageFactory: true,
      options: {
        id: PORTIS_ID
      }
    },
    torus: {
      package: () => import('@toruslabs/torus-embed'),
      packageFactory: true
    }
  }
}

let web3Modal
export const connect = async bdnsProvider => {
  try {
    if (bdnsProvider) {
      provider = bdnsProvider
    } else {
      const Web3Modal = (await import('@ensdomains/web3modal')).default
      web3Modal = new Web3Modal(option)
      window.isBdns = false

      web3Modal.on('connect', info => {
        window.isBdns = Boolean(info.isEnkrypt)
        if (window.isBdns && window.onConnect && info.isMetaMask) {
          alert(
            'You now have multiple wallets active. Please, if you want to continue with MetaMask, disable other wallets in your browser.'
          )
        }
      })
      provider = await web3Modal.connect()
    }

    if (window.isBdns && window.onConnect) {
      disconnectProvider()
      window.isBdns = false
      window.location = window.location
    } else {
      await setupENS({
        customProvider: provider,
        reloadOnAccountsChange: false,
        enforceReload: true
      })
      return provider
    }
  } catch (e) {
    if (e !== 'Modal closed by user') {
      throw { error: e, provider: provider }
    }
  }
}

export const disconnect = async function() {
  if (web3Modal) {
    await web3Modal.clearCachedProvider()
  }

  // Disconnect wallet connect provider
  if (provider && provider.disconnect) {
    provider.disconnect()
  }
  await setupENS({
    customProvider: rpcUrl,
    reloadOnAccountsChange: false,
    enforceReadOnly: true,
    enforceReload: false
  })

  isReadOnlyReactive(isReadOnly())
  web3ProviderReactive(null)
  networkIdReactive(await getNetworkId())
  networkReactive(await getNetwork())
}

export const setWeb3Modal = x => {
  web3Modal = x
}
