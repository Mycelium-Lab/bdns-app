import {
  encodeContenthash,
  getBlock,
  getNamehash,
  getNetworkId,
  getOldResolverContract,
  getProvider,
  getResolverContract,
  getSigner,
  getWeb3,
  isDecrypted,
  labelhash,
  utils
} from '../../ui'
import { formatsByName } from '@ensdomains/address-encoder'
import isEqual from 'lodash/isEqual'
import modeNames from '../modes'
import { sendHelper, sendHelperArray } from '../resolverUtils'
import { emptyAddress } from '../../utils/utils'
import TEXT_RECORD_KEYS from 'constants/textRecords'
import COIN_LIST_KEYS from 'constants/coinList'
import { GET_REGISTRANT_FROM_SUBGRAPH } from '../../graphql/queries'
import getClient from '../../apollo/apolloClient'
import getENS, {
  getNameWrapper,
  getRegistrar,
  getReservedDomains
} from 'apollo/mutations/ens'
import { isENSReadyReactive, namesReactive } from '../../apollo/reactiveVars'
import getReverseRecord from './getReverseRecord'
import { isEmptyAddress } from '../../utils/records'
const defaults = {
  names: []
}

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

function setState(node) {
  let state = node.state
  if (node.isDNSRegistrar) {
    return node
  }
  if (node.available) {
    state = 'Open'
  } else {
    state = 'Owned'
  }
  return {
    ...node,
    state
  }
}

export const handleSingleTransaction = async (
  name,
  record,
  resolverInstance
) => {
  const namehash = getNamehash(name)

  if (record.contractFn === 'setContenthash') {
    let value
    if (isEmptyAddress(record.value)) {
      value = emptyAddress
    } else {
      value = encodeContenthash(record.value)?.encoded
    }

    const contentTx = await resolverInstance[record.contractFn](namehash, value)
    return sendHelper(contentTx)
  }

  if (record.contractFn === 'setText') {
    const textRecordTx = await resolverInstance[record.contractFn](
      namehash,
      record.key,
      record.value
    )
    return sendHelper(textRecordTx)
  }

  if (record.contractFn === 'setAddr(bytes32,uint256,bytes)') {
    const coinRecord = record
    const { decoder, coinType } = formatsByName[coinRecord.key]
    let addressAsBytes

    // use 0x00... for ETH because an empty string throws
    if (coinRecord.key === 'ETH' && coinRecord.value === '') {
      coinRecord.value = emptyAddress
    }

    if (!coinRecord.value || coinRecord.value === '') {
      addressAsBytes = Buffer.from('')
    } else {
      addressAsBytes = decoder(coinRecord.value)
    }

    const coinRecordTx = await resolverInstance[record.contractFn](
      namehash,
      coinType,
      addressAsBytes
    )

    return sendHelper(coinRecordTx)
  }

  console.error('Single transaction error')
}

export const handleMultipleTransactions = async (
  name,
  records,
  resolverInstance
) => {
  try {
    const resolver = resolverInstance.interface
    const namehash = getNamehash(name)

    const transactionArray = records.map(record => {
      if (record.contractFn === 'setContenthash') {
        let value
        if (isEmptyAddress(record.value)) {
          value = emptyAddress
        } else {
          value = encodeContenthash(record.value)?.encoded
        }
        return resolver.encodeFunctionData(record.contractFn, [namehash, value])
      }

      if (record.contractFn === 'setText') {
        return resolver.encodeFunctionData(record.contractFn, [
          namehash,
          record.key,
          record.value
        ])
      }

      if (record.contractFn === 'setAddr(bytes32,uint256,bytes)') {
        const { decoder, coinType } = formatsByName[record.key]
        let addressAsBytes
        // use 0x00... for ETH because an empty string throws
        if (record.key === 'ETH' && record.value === '') {
          record.value = emptyAddress
        }
        if (!record.value || record.value === '') {
          addressAsBytes = Buffer.from('')
        } else {
          addressAsBytes = decoder(record.value)
        }
        return resolver.encodeFunctionData(record.contractFn, [
          namehash,
          coinType,
          addressAsBytes
        ])
      }
    })

    // flatten textrecords and addresses and remove undefined
    //transactionArray.flat().filter(bytes => bytes)
    //add them all together into one transaction
    const tx1 = await resolverInstance.multicall(transactionArray)
    return sendHelper(tx1)
  } catch (e) {
    console.log('error creating transaction array', e)
  }
}

async function getRegistrarEntry(name) {
  const registrar = getRegistrar()
  const entry = await registrar.getEntry(name)
  const {
    registrant,
    deedOwner,
    state,
    registrationDate,
    migrationStartDate,
    currentBlockDate,
    transferEndDate,
    gracePeriodEndDate,
    revealDate,
    value,
    highestBid,
    expiryTime,
    isNewRegistrar,
    available
  } = entry

  return {
    name,
    state: modeNames[state],
    stateError: null, // This is only used for dnssec errors
    registrationDate,
    gracePeriodEndDate: gracePeriodEndDate || null,
    migrationStartDate: migrationStartDate || null,
    currentBlockDate: currentBlockDate || null,
    transferEndDate: transferEndDate || null,
    revealDate,
    value,
    highestBid,
    registrant,
    deedOwner,
    isNewRegistrar: !!isNewRegistrar,
    available,
    expiryTime: expiryTime || null
  }
}

async function getParent(name) {
  const ens = getENS()
  const nameArray = name.split('.')
  // if (nameArray.length < 1) {
  //   return [null, null]
  // }
  // nameArray.shift()
  const parent = ''
  const parentOwner = await ens.getOwner(name)
  return [parent, parentOwner]
}

async function getRegistrant(name) {
  const client = getClient()
  try {
    const { data, error } = await client.query({
      query: GET_REGISTRANT_FROM_SUBGRAPH,
      fetchPolicy: 'network-only',
      variables: { id: labelhash(name.split('.')[0]) },
      context: {
        queryDeduplication: false
      }
    })
    if (!data || !data.registration) {
      return null
    }
    if (error) {
      console.log('Error getting registrant from subgraph', error)
      return null
    }

    return utils.getAddress(data.registration.registrant.id)
  } catch (e) {
    console.log('GraphQL error from getRegistrant', e)
    return null
  }
}
async function getDomainType(label) {
  const reservedDomains = getReservedDomains()
  try {
    const domainType = await reservedDomains.getDomainType(label)
    return domainType
  } catch (e) {
    return null
  }
}
async function getBrandsUnlockTimestamp() {
  const reservedDomains = getReservedDomains()
  try {
    const unlockTimestamp = await reservedDomains.getBrandsUnlockTimestamp()
    return unlockTimestamp
  } catch (e) {
    return null
  }
}
async function getDomainTypeInfo(label) {
  let domainType = await getDomainType(label)
  let unlockTimestamp
  let isDomainUnlocked = true
  if (domainType === 'BRAND') {
    unlockTimestamp = await getBrandsUnlockTimestamp()
    isDomainUnlocked = parseInt(new Date().getTime() / 1000) >= unlockTimestamp
  }
  return {
    domainType,
    unlockTimestamp,
    isDomainUnlocked
  }
}
async function getOwnerOfNFT(name) {
  const nameWrapper = getNameWrapper()
  try {
    const ownerOfNFT = await nameWrapper.getOwnerOfNFT(name)
    return ownerOfNFT
  } catch (e) {
    return null
  }
}
async function getIsWrapped(name) {
  try {
    const nameWrapper = getNameWrapper()
    const isWrapped = await nameWrapper.getIsWrapped(name)
    return isWrapped
  } catch (e) {
    return null
  }
}
async function getIsApprovedForWrap(name) {
  try {
    const nameWrapper = getNameWrapper()
    const isApproved = await nameWrapper.isApprovedForWrapByName(name)
    return isApproved
  } catch (e) {
    return null
  }
}
async function getNFTInfo(name) {
  const isWrapped = await getIsWrapped(name)
  let ownerOfNFT = null
  let isApprovedForWrap = false
  if (isWrapped) {
    ownerOfNFT = await getOwnerOfNFT(name)
  } else {
    isApprovedForWrap = await getIsApprovedForWrap(name)
  }
  return {
    isWrapped,
    ownerOfNFT,
    isApprovedForWrap
  }
}
async function setDNSSECTldOwner(ens, tld, networkId) {
  let tldowner = (await ens.getOwner(tld)).toLocaleLowerCase()
  if (parseInt(tldowner) !== 0) return tldowner
  return emptyAddress
}

async function getDNSEntryDetails(name) {
  const ens = getENS()
  const registrar = getRegistrar()
  const nameArray = name.split('.')
  const networkId = await getNetworkId()
  if (nameArray.length !== 2 || nameArray[1] === 'eth') return {}
  if (nameArray.length === 1) {
    nameArray.push('')
  }
  let tld = nameArray[1]
  let owner
  let tldowner = await setDNSSECTldOwner(ens, tld, networkId)
  try {
    owner = (await ens.getOwner(name)).toLocaleLowerCase()
  } catch {
    return {}
  }

  let isDNSRegistrarSupported = await registrar.isDNSRegistrar(tldowner)
  if (isDNSRegistrarSupported && tldowner !== emptyAddress) {
    const dnsEntry = await registrar.getDNSEntry(name, tldowner, owner)
    return {
      isDNSRegistrar: true,
      dnsOwner: dnsEntry.claim?.result
        ? dnsEntry.claim.getOwner()
        : emptyAddress,
      state: dnsEntry.state,
      stateError: dnsEntry.stateError,
      parentOwner: tldowner
    }
  }
}

async function getTestEntry(name) {
  const registrar = getRegistrar()
  const nameArray = name.split('.')
  if (nameArray.length < 3 && nameArray[1] === 'test') {
    const expiryTime = await registrar.expiryTimes(nameArray[0])
    if (expiryTime) return { expiryTime }
  }
  return {}
}

function adjustForShortNames(node) {
  const nameArray = node.name.split('.')
  const { label, parent } = node

  // return original node if is subdomain or not eth
  if (nameArray.length > 2 || parent !== 'eth' || label.length > 6) return node

  //if the auctions are over
  if (new Date() > new Date(1570924800000)) {
    return node
  }

  let auctionEnds
  let onAuction = true

  if (label.length >= 5) {
    auctionEnds = new Date(1569715200000) // 29 September
  } else if (label.length >= 4) {
    auctionEnds = new Date(1570320000000) // 6 October
  } else if (label.length >= 3) {
    auctionEnds = new Date(1570924800000) // 13 October
  }

  if (new Date() > auctionEnds) {
    onAuction = false
  }

  return {
    ...node,
    auctionEnds,
    onAuction,
    state: onAuction ? 'Auction' : node.state
  }
}

const resolvers = {
  Query: {
    publicResolver: async () => {
      try {
        const ens = getENS()
        const resolver = await ens.getAddress('resolver')
        return {
          address: resolver,
          __typename: 'Resolver'
        }
      } catch (e) {
        console.log('error getting public resolver', e)
      }
    },
    getOwner: (_, { name }) => {
      const ens = getENS()
      return ens.getOwner(name)
    },

    singleName: async (_, { name }) => {
      try {
        if (!isENSReadyReactive() || !name)
          return {
            name: null,
            revealDate: null,
            registrationDate: null,
            migrationStartDate: null,
            currentBlockDate: null,
            transferEndDate: null,
            gracePeriodEndDate: null,
            value: null,
            highestBid: null,
            state: null,
            stateError: null,
            label: null,
            decrypted: false,
            price: null,
            rent: null,
            referralFeePPM: null,
            available: null,
            contentType: null,
            expiryTime: null,
            isNewRegistrar: null,
            isDNSRegistrar: null,
            dnsOwner: null,
            deedOwner: null,
            registrant: null,
            auctionEnds: null
          }

        const ens = getENS()
        const decrypted = isDecrypted(name)

        let node = {
          name: null,
          revealDate: null,
          registrationDate: null,
          migrationStartDate: null,
          currentBlockDate: null,
          transferEndDate: null,
          gracePeriodEndDate: null,
          value: null,
          highestBid: null,
          state: null,
          stateError: null,
          label: null,
          decrypted,
          price: null,
          rent: null,
          referralFeePPM: null,
          available: null,
          contentType: null,
          expiryTime: null,
          isNewRegistrar: null,
          isDNSRegistrar: null,
          dnsOwner: null,
          deedOwner: null,
          registrant: null,
          auctionEnds: null // remove when auction is over
        }

        const dataSources = [
          getRegistrarEntry(name),
          ens.getDomainDetails(name),
          getParent(name),
          getDNSEntryDetails(name),
          getTestEntry(name),
          getRegistrant(name),
          getNFTInfo(name),
          getDomainTypeInfo(name)
        ]

        const [
          registrarEntry,
          domainDetails,
          [parent, parentOwner],
          dnsEntry,
          testEntry,
          registrant,
          nftInfo,
          domainTypeInfo
        ] = await Promise.all(dataSources)

        const names = namesReactive()

        let detailedNode = adjustForShortNames({
          ...node,
          ...registrarEntry,
          ...domainDetails,
          ...dnsEntry,
          ...testEntry,
          ...nftInfo,
          ...domainTypeInfo,
          registrant: registrant
            ? registrant
            : registrarEntry.registrant
            ? registrarEntry.registrant
            : null,
          parent,
          parentOwner,
          __typename: 'Node'
        })
        detailedNode = setState(detailedNode)
        // Override parentOwner for dns if exists
        if (
          dnsEntry &&
          dnsEntry.parentOwner &&
          parseInt(dnsEntry.parentOwner) !== 0 &&
          parseInt(detailedNode.parentOwner) === 0
        ) {
          detailedNode.parentOwner = dnsEntry.parentOwner
        }

        namesReactive([...names, detailedNode])

        return detailedNode
      } catch (e) {
        console.log('Error in Single Name', e)
        throw e
      }
    },
    getResolverMigrationInfo: async (_, { name, resolver }) => {
      /* TODO add hardcoded resolver addresses */
      const ens = getENS()
      const networkId = await getNetworkId()

      const RESOLVERS = {
        1: {
          DEPRECATED: [],
          OLD: []
        },
        3: {
          OLD: [],
          DEPRECATED: []
        },
        4: {
          OLD: [],
          DEPRECATED: []
        },
        5: {
          OLD: [],
          DEPRECATED: []
        }
      }

      let DEPRECATED_RESOLVERS = []
      let OLD_RESOLVERS = []

      if (RESOLVERS[networkId]) {
        DEPRECATED_RESOLVERS = [...RESOLVERS[networkId].DEPRECATED]
        OLD_RESOLVERS = [...OLD_RESOLVERS, ...RESOLVERS[networkId].OLD]
      }

      if (
        process.env.REACT_APP_STAGE === 'local' &&
        process.env.REACT_APP_DEPRECATED_RESOLVERS
      ) {
        const localResolvers = process.env.REACT_APP_DEPRECATED_RESOLVERS.split(
          ','
        )
        DEPRECATED_RESOLVERS = [...DEPRECATED_RESOLVERS, ...localResolvers]
      }

      /* Deprecated resolvers are using the new registry and can be continued to be used*/

      function calculateIsDeprecatedResolver(address) {
        return DEPRECATED_RESOLVERS.map(a => a.toLowerCase()).includes(
          address.toLowerCase()
        )
      }

      /* Old Public resolvers are using the old registry and must be migrated  */

      function calculateIsOldPublicResolver(address) {
        return OLD_RESOLVERS.map(a => a.toLowerCase()).includes(
          address.toLowerCase()
        )
      }

      async function calculateIsPublicResolverReady() {
        const publicResolver = await ens.getAddress('resolver')
        return !OLD_RESOLVERS.map(a => a.toLowerCase()).includes(publicResolver)
      }

      let isDeprecatedResolver = calculateIsDeprecatedResolver(resolver)
      let isOldPublicResolver = calculateIsOldPublicResolver(resolver)
      let isPublicResolverReady = await calculateIsPublicResolverReady()
      return {
        name,
        isDeprecatedResolver,
        isOldPublicResolver,
        isPublicResolverReady,
        __typename: 'ResolverMigration'
      }
    },
    isMigrated: (_, { name }) => {
      const ens = getENS()
      return ens.isMigrated(name)
    },
    wildcardResolverDomain: async (_, { name }) => {
      const ens = getENS()
      return ens.supportsWildcard(name)
    },
    isContractController: async (_, { address }) => {
      let provider = await getWeb3()
      const bytecode = await provider.getCode(address)
      return bytecode !== '0x'
    },
    getSubDomains: async (_, { name }) => {
      try {
        const ens = getENS()
        const rawSubDomains = await ens.getSubdomains(name)

        return {
          subDomains: rawSubDomains,
          __typename: 'SubDomains'
        }
      } catch (e) {
        console.log('getSubDomains error: ', e)
      }
    },
    getReverseRecord,
    getText: async (_, { name, key }) => {
      const ens = getENS()
      const text = await ens.getText(name, key)
      if (text === '') {
        return null
      }

      return text
    },
    getAddr: async (_, { name, key }) => {
      const ens = getENS()
      const address = await ens.getAddr(name, key)
      if (address === '') {
        return null
      }

      return address
    },
    getAddresses: (_, { name, keys }) => {
      const ens = getENS()
      const addresses = keys.map(key =>
        ens.getAddr(name, key).then(addr => ({ key, value: addr }))
      )
      return Promise.all(addresses)
    },
    getTextRecords: async (_, { name, keys }) => {
      if (!name || !keys) return []
      const ens = getENS()
      const textRecords = keys.map(key =>
        ens.getText(name, key).then(addr => ({ key, value: addr }))
      )
      return await Promise.all(textRecords)
    },
    waitBlockTimestamp: async (_, { waitUntil }) => {
      if (waitUntil) {
        let block = await getBlock()
        let timestamp = block.timestamp * 1000
        while (timestamp < waitUntil) {
          block = await getBlock()
          timestamp = block.timestamp * 1000
          await delay(1000)
        }
        return true
      } else {
        return false
      }
    },
    getBalance: async (_, { address }) => {
      const provider = await getProvider()
      let balance
      try {
        balance = await provider.getBalance(address)
      } catch (e) {
        console.log(e)
      }
      return balance
    }
  },
  Mutation: {
    registerTestdomain: async (_, { label }) => {
      const registrar = getRegistrar()
      const tx = await registrar.registerTestdomain(label)
      return sendHelper(tx)
    },
    setName: async (_, { name }) => {
      try {
        const ens = getENS()
        const tx = await ens.claimAndSetReverseRecordName(name)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setOwner: async (_, { name, address }) => {
      try {
        const ens = getENS()
        const tx = await ens.setOwner(name, address)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setSubnodeOwner: async (_, { name, address }) => {
      try {
        const ens = getENS()
        const tx = await ens.setSubnodeOwner(name, address)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setResolver: async (_, { name, address }) => {
      try {
        const ens = getENS()
        const tx = await ens.setResolver(name, address)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setAddress: async (_, { name, recordValue }) => {
      try {
        const ens = getENS()
        const tx = await ens.setAddress(name, recordValue)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setAddr: async (_, { name, key, recordValue }) => {
      try {
        const ens = getENS()
        const tx = await ens.setAddr(name, key, recordValue)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setContent: async (_, { name, recordValue }) => {
      try {
        const ens = getENS()
        const tx = await ens.setContent(name, recordValue)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setContenthash: async (_, { name, recordValue }) => {
      try {
        const ens = getENS()
        const tx = await ens.setContenthash(name, recordValue)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    setText: async (_, { name, key, recordValue }) => {
      try {
        const ens = getENS()
        const tx = await ens.setText(name, key, recordValue)
        return sendHelper(tx)
      } catch (e) {
        console.error(e)
      }
    },
    setNewNFTOwner: async (_, { from, to, id }) => {
      try {
        const nameWrapper = getNameWrapper()
        const tx = await nameWrapper.safeTransferFrom(from, to, id)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    unwrap: async (_, { labelhash, registrant, controller }) => {
      try {
        const nameWrapper = getNameWrapper()
        const tx = await nameWrapper.unwrap(labelhash, registrant, controller)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    approveWrap: async (_, { labelhash }) => {
      try {
        const nameWrapper = getNameWrapper()
        const tx = await nameWrapper.approveWrap(labelhash)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    wrap: async (_, { label, wrappedOwner, resolver }) => {
      try {
        const nameWrapper = getNameWrapper()
        const tx = await nameWrapper.wrap(label, wrappedOwner, resolver)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    addMultiRecords: async (_, { name, records }) => {
      const ens = getENS()

      const provider = await getProvider()
      const resolver = await ens.getResolver(name)
      const resolverInstanceWithoutSigner = await getResolverContract({
        address: resolver,
        provider
      })
      const signer = await getSigner()
      const resolverInstance = resolverInstanceWithoutSigner.connect(signer)

      if (records.length === 1) {
        return await handleSingleTransaction(name, records[0], resolverInstance)
      }
      return await handleMultipleTransactions(name, records, resolverInstance)
    },
    migrateResolver: async (_, { name }) => {
      const ens = getENS()
      const provider = await getProvider()

      function setupTransactions({ name, records, resolverInstance }) {
        try {
          const resolver = resolverInstance.interface
          const namehash = getNamehash(name)
          const transactionArray = records.map((record, i) => {
            switch (i) {
              case 0:
                if (parseInt(record, 16) === 0) return undefined
                return resolver.encodeFunctionData('setAddr(bytes32,address)', [
                  namehash,
                  record
                ])
              case 1:
                if (!record || parseInt(record, 16) === 0) return undefined
                return resolver.encodeFunctionData('setContenthash', [
                  namehash,
                  record
                ])
              case 2:
                return record.map(textRecord => {
                  if (textRecord.value.length === 0) return undefined
                  return resolver.encodeFunctionData('setText', [
                    namehash,
                    textRecord.key,
                    textRecord.value
                  ])
                })
              case 3:
                return record.map(coinRecord => {
                  if (parseInt(coinRecord.value, 16) === 0) return undefined
                  const { decoder, coinType } = formatsByName[coinRecord.key]
                  let addressAsBytes
                  if (!coinRecord.value || coinRecord.value === '') {
                    addressAsBytes = Buffer.from('')
                  } else {
                    addressAsBytes = decoder(coinRecord.value)
                  }
                  return resolver.encodeFunctionData(
                    'setAddr(bytes32,uint256,bytes)',
                    [namehash, coinType, addressAsBytes]
                  )
                })
              default:
                throw Error('More records than expected')
            }
          })

          // flatten textrecords and addresses and remove undefined
          return transactionArray.flat().filter(bytes => bytes)
        } catch (e) {
          console.log('error creating transaction array', e)
        }
      }

      function calculateIsOldContentResolver(resolver) {
        const oldContentResolvers = []
        const localResolvers = process.env.REACT_APP_OLD_CONTENT_RESOLVERS
          ? process.env.REACT_APP_OLD_CONTENT_RESOLVERS.split(',')
          : []

        const oldResolvers = [...oldContentResolvers, ...localResolvers].map(
          a => {
            return a.toLowerCase()
          }
        )

        return oldResolvers.includes(resolver.toLowerCase())
      }

      function buildKeyValueObjects(keys, values) {
        return values.map((record, i) => ({
          key: keys[i],
          value: record
        }))
      }

      async function getAllTextRecords(name) {
        const promises = TEXT_RECORD_KEYS.map(key => ens.getText(name, key))
        const records = await Promise.all(promises)
        return buildKeyValueObjects(TEXT_RECORD_KEYS, records)
      }

      async function getAllTextRecordsWithResolver(name, resolver) {
        const promises = TEXT_RECORD_KEYS.map(key =>
          ens.getTextWithResolver(name, key, resolver)
        )
        const records = await Promise.all(promises)
        return buildKeyValueObjects(TEXT_RECORD_KEYS, records)
      }

      async function getAllAddresses(name) {
        const promises = COIN_LIST_KEYS.map(key => ens.getAddr(name, key))
        const records = await Promise.all(promises)
        return buildKeyValueObjects(COIN_LIST_KEYS, records)
      }

      async function getAllAddressesWithResolver(name, resolver) {
        const promises = COIN_LIST_KEYS.map(key =>
          ens.getAddrWithResolver(name, key, resolver)
        )
        const records = await Promise.all(promises)
        return buildKeyValueObjects(COIN_LIST_KEYS, records)
      }

      async function getOldContent(name) {
        const namehash = getNamehash(name)
        const resolverInstanceWithoutSigner = await getOldResolverContract({
          address: process.env.REACT_APP_PUBLIC_RESOLVER,
          provider
        })
        const content = await resolverInstanceWithoutSigner.content(namehash)
        const { encoded } = encodeContenthash('bzz://' + content)
        return encoded
      }

      async function getContenthash(name) {
        const resolver = await ens.getResolver(name)
        return getContenthashWithResolver(name, resolver)
      }

      async function getContenthashWithResolver(name, resolver) {
        const namehash = getNamehash(name)
        const resolverInstanceWithoutSigner = await getResolverContract({
          address: resolver,
          provider
        })
        return await resolverInstanceWithoutSigner.contenthash(namehash)
      }

      async function getAllRecords(name, isOldContentResolver) {
        const promises = [
          ens.getAddress(name),
          isOldContentResolver ? getOldContent(name) : getContenthash(name),
          getAllTextRecords(name),
          getAllAddresses(name)
        ]
        return Promise.all(promises)
      }

      async function getAllRecordsNew(name, publicResolver) {
        const promises = [
          ens.getAddrWithResolver(name, publicResolver),
          getContenthashWithResolver(name, publicResolver),
          getAllTextRecordsWithResolver(name, publicResolver),
          getAllAddressesWithResolver(name, publicResolver)
        ]
        return Promise.all(promises)
      }

      function areRecordsEqual(oldRecords, newRecords) {
        return isEqual(oldRecords, newRecords)
      }

      // get public resolver
      try {
        const publicResolver = await ens.getAddress('resolver')
        const resolver = await ens.getResolver(name)
        const isOldContentResolver = calculateIsOldContentResolver(resolver)

        // get old and new records in parallel
        const [records, newResolverRecords] = await Promise.all([
          getAllRecords(name, isOldContentResolver),
          getAllRecordsNew(name, publicResolver)
        ])

        // compare new and old records
        if (!areRecordsEqual(records, newResolverRecords)) {
          //get the transaction by using contract.method.encode from ethers
          const resolverInstanceWithoutSigner = await getResolverContract({
            address: publicResolver,
            provider
          })
          const signer = await getSigner()
          const resolverInstance = resolverInstanceWithoutSigner.connect(signer)
          const transactionArray = setupTransactions({
            name,
            records,
            resolverInstance
          })
          //add them all together into one transaction
          const tx1 = await resolverInstance.multicall(transactionArray)
          //once the record has been migrated, migrate the resolver using setResolver to the new public resolver
          const tx2 = await ens.setResolver(name, publicResolver)
          //await migrate records into new resolver
          return sendHelperArray([tx1, tx2])
        } else {
          const tx = await ens.setResolver(name, publicResolver)
          const value = await sendHelper(tx)
          return [value]
        }
      } catch (e) {
        console.log('Error migrating resolver', e)
        throw e
      }
    },
    migrateRegistry: async (_, { name, address }) => {
      try {
        const ens = getENS()
        const resolver = await ens.getResolver(name)
        const tx = await ens.setSubnodeRecord(name, address, resolver)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    createSubdomain: async (_, { name }) => {
      try {
        const ens = getENS()
        const tx = await ens.createSubdomain(name)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    },
    deleteSubdomain: async (_, { name }) => {
      try {
        const ens = getENS()
        const tx = await ens.deleteSubdomain(name)
        return sendHelper(tx)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

export default resolvers

export { defaults }
