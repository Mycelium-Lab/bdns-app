import axios from 'axios'
import { getAccount } from '../web3'

let network, contractAddress
/*if (process.env.NODE_ENV === 'development') {
  network = 'https://api-goerli.etherscan.io/api'
  contractAddress = '0x855399f1c8ebd388ec3eea290f87c39cda914095'
} else {
  network = 'https://api.etherscan.io/api'
  contractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'
}*/

network = 'https://api-goerli.etherscan.io/api'
contractAddress = '0x855399f1c8ebd388ec3eea290f87c39cda914095'

const API_KEY = process.env.REACT_APP_API_KEY

const api = {
  accounts: {
    getListOfERC721: function(address) {
      return `?module=account&action=tokennfttx&contractaddress=${contractAddress}&address=${address}&apikey=${API_KEY}`
    }
  }
}

export default async function getTokensId() {
  const address = await getAccount()
  try {
    const url = `${network}${api.accounts.getListOfERC721(address)}`
    const response = await axios.get(url)
    //console.log('RESPONSE', response)
    return response.data.result.map(r => r.tokenID)
  } catch (error) {
    console.error(error)
  }
}
