import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import { Interface } from '@ethersproject/abi'
import { getWeb3NoAccount } from 'utils/web3'
import MultiCallAbi from 'config/abi/Multicall.json'
import { getMulticallAddress } from 'utils/addressHelpers'

interface Call {
  address: string // Address of the contract
  name: string // Function name on the contract (example: balanceOf)
  params?: any[] // Function params
}

interface MulticallOptions {
  web3?: Web3
  blockNumber?: number
  requireSuccess?: boolean
}

const multicall = async (abi: any[], calls: Call[], options: MulticallOptions = {}) => {
  try {
    const web3 = options.web3 || getWeb3NoAccount()
    // console.log('multicall window.initWeb3', window.initWeb3)
    // const web3 = options.web3 || (window.initWeb3)
    // console.log('multicall web3', web3)
    // if(web3 === undefined){
    //   return [];
    // }
    // console.log('multical web3', web3)
    // console.log('multical getMulticallAddress', getMulticallAddress())
    const multi = new web3.eth.Contract(MultiCallAbi as unknown as AbiItem, getMulticallAddress())
    const itf = new Interface(abi)

    const calldata = calls.map((call) => [call.address.toLowerCase(), itf.encodeFunctionData(call.name, call.params)])
    // console.log('calls: ', calls)
    // console.log('calldata: ', calldata)
    const { returnData } = await multi.methods.aggregate(calldata).call(undefined, options.blockNumber)
    const res = returnData.map((call, i) => itf.decodeFunctionResult(calls[i].name, call))
    return res
  } catch (error) {
    console.error(error);
    throw new Error(error)
    // throw new Error("Error")
    
  }
}

/**
 * Multicall V2 uses the new "tryAggregate" function. It is different in 2 ways
 *
 * 1. If "requireSuccess" is false multicall will not bail out if one of the calls fails
 * 2. The return inclues a boolean whether the call was successful e.g. [wasSuccessfull, callResult]
 */
export const multicallv2 = async (abi: any[], calls: Call[], options: MulticallOptions = {}) => {
  console.log('MulticallV2 called: ')
  // const web3 = options.web3 || getWeb3NoAccount()
  const web3 = options.web3 || (window.initWeb3)

  const multi = new web3.eth.Contract(MultiCallAbi as unknown as AbiItem, getMulticallAddress())
  const itf = new Interface(abi)

  const calldata = calls.map((call) => [call.address.toLowerCase(), itf.encodeFunctionData(call.name, call.params)])
  console.log('calldata ', calldata)
  
  const returnData = await multi.methods
  .tryAggregate(options.requireSuccess === undefined ? true : options.requireSuccess, calldata)
  .call(undefined, options.blockNumber)
  console.log('returnData ', returnData)
  
  const res = returnData.map((call, i) => {
    const [result, data] = call
    return {
      result,
      data: itf.decodeFunctionResult(calls[i].name, data),
    }
  })
  console.log('res ', res)

  return res
}
export default multicall
