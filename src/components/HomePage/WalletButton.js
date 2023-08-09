import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName
} from 'wagmi'
import { connectProvider, disconnectProvider } from '../../utils/providerUtils'
import BDNSLogo from './images/BDNSLogo32.svg'

export function WalletButton({ isReadOnly }) {
  const { address, connector, isConnected } = useAccount()
  const { data: ensAvatar } = useEnsAvatar({ address })
  const { data: ensName } = useEnsName({ address })
  const {
    connect,
    connectors,
    error,
    isLoading,
    pendingConnector
  } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <img src={ensAvatar} alt="ENS Avatar" />
        <div>{ensName ? `${ensName} (${address})` : address}</div>
        <div>Connected to {connector?.name}</div>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map(connector => (
        <button
          style={{
            border: '1px solid #c5a15a',
            borderRadius: '6px',
            padding: '5px 20px',
            background: 'transparent',
            marginTop: '10px',
            cursor: 'pointer'
          }}
          key={connector.id}
          onClick={async () => {
            if (!connector.ready) {
              window.open(
                'https://chrome.google.com/webstore/detail/bdns-wallet/ggffildgmkkgopippcibmffamiinajji?utm_source=ext_sidebar&hl=en',
                '_blank'
              )
            } else {
              const provider = await connector.getProvider()
              if (!provider.isEnkrypt) {
                disconnectProvider()
                window.open(
                  'https://chrome.google.com/webstore/detail/bdns-wallet/ggffildgmkkgopippcibmffamiinajji?utm_source=ext_sidebar&hl=en',
                  '_blank'
                )
                window.location = window.location
              }
              connectProvider(provider)
              /*isReadOnly ? () => {
                  window.onConnect = true
                  console.log('EN')
                  connectProvider(provider)
                } : () => {
                  window.onConnect = false
                  disconnectProvider()
                }*/
              //connect({ connector })
            }
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <img src={BDNSLogo} />
            <span style={{ color: '#C6A15A' }}>
              {connector.name}
              {!connector.ready && ' Instal'}
              {connector.ready && ' Connect'}
              {isLoading &&
                connector.id === pendingConnector?.id &&
                ' (connecting)'}
            </span>
          </div>
        </button>
      ))}

      {error && <div>{error.message}</div>}
    </div>
  )
}
