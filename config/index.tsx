import { cookieStorage, createStorage, http } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { foundry, riseTestnet } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [riseTestnet]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  //@ts-ignore
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig