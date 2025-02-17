'use client'

import { useAccount } from "wagmi"

export default function Home(){

    const {isConnected} = useAccount()

    return(
        <main>hello there


            <div>
                wallet connect button
                <w3m-button />

            </div>

            <div>
                network change button
                <w3m-network-button />
            </div>
        </main>
    )
}