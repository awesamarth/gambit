'use client'

import { useState } from 'react'
import { verifyMessage } from 'viem'
import { useAccount, useSignMessage } from 'wagmi'

export default function App() {
  const { signMessageAsync } = useSignMessage()
  const [signature, setSignature] = useState("")

  const {address} = useAccount()
const verifySignature = async()=> {
    const valid = await verifyMessage({ 
        address: address as `0x${string}`, 
        message: 'hello world', 
        signature: signature as `0x${string}`
      })
    console.log(valid)
}


  const handleClick = async () => {
    try {
      const signature = await signMessageAsync({ message: 'hello world' })
      console.log('Signature:', signature)
      setSignature(signature)
    } catch (error) {
      console.error('Error signing message:', error)
    }
  }

  return (
    <div>
    <button className='my-40' onClick={handleClick}>
      Sign message
    </button>
    <button className='my-40' onClick={verifySignature}>
      Verify Signature
    </button>
    </div>

  )
}