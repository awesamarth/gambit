'use client'

import { useAccount } from "wagmi"

export default function Home(){

    const {isConnected} = useAccount()

    return(
        <></>
    )
}