import axios from 'axios'
import { getAccount } from '../web3'

let network, contractAddress

/*if (process.env.NODE_ENV === 'development') {
  network = 'https://api-goerli.etherscan.io/api'
  contractAddress = '0x855399f1c8ebd388ec3eea290f87c39cda914095'
} else {
  network = 'https://api.etherscan.io/api'
  contractAddress = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
}*/

network = 'https://api.etherscan.io/api'
contractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'
const API_KEY = process.env.REACT_APP_API_KEY

const api = {
  accounts: {
    getListOfERC721: function(address) {
      return `?module=account&action=tokennfttx&contractaddress=${contractAddress}&address=${address}&apikey=${API_KEY}`
    }
  }
}

export default async function getTokensId() {
  console.log('NFT')
  let tokensId = []
  const address = await getAccount()
  const parsedAddress = parseInt(address, 16)
  try {
    if (parsedAddress) {
      const url = `${network}${api.accounts.getListOfERC721(address)}`
      const response = await axios.get(url)
      tokensId = response.data.result.map(r => r.tokenID)
    }
    //console.log('RESPONSE', response)
    return tokensId
  } catch (error) {
    console.error(error)
  }
}
