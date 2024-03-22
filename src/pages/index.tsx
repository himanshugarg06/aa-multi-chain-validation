import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useState } from 'react'
import { BiconomySmartAccountV2, PaymasterMode, createSmartAccountClient } from "@biconomy/account";
import "viem/window";
import { Hex, createWalletClient, custom, encodeFunctionData, parseAbi } from "viem";
import { sepolia } from "viem/chains";

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null)
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const createSmartAccountAddresses = async () => {
    try {
      if (!window.ethereum) return;
      const [account] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: custom(window.ethereum),
      });

      const smartAccount = await createSmartAccountClient({
        signer: walletClient,
        bundlerUrl: "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_SEPOLIA_PAYMASTER_API_KEY
      });

      const address = await smartAccount.getAccountAddress();
      console.log("nonce", (await smartAccount.getNonce()))
      setSmartAccount(smartAccount);
      setSmartAccountAddress(address);

    } catch (error) {
      console.error(error)
    }
  }

  const mintNFT = async () => {
    try {
      const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
      const parsedAbi = parseAbi(["function safeMint(address _to)"]);
      const nftData = encodeFunctionData({
        abi: parsedAbi,
        functionName: "safeMint",
        args: [smartAccountAddress as Hex],
      });
      const mintNFTTransaction = {
        to: nftAddress,
        data: nftData,
      };
      const response = await smartAccount?.sendTransaction(mintNFTTransaction, {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED
        }
      });
      const receipt = await response?.wait();
      console.log(receipt)
      setTransactionHash(receipt?.receipt.transactionHash)

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <Head>
        <title>Account Abstraction</title>
        <meta name="description" content="Connect and Mint Gasslessly" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <h1>Account Abstraction</h1>
        {!smartAccount && (
          <button onClick={createSmartAccountAddresses} className={styles.demoButton}>Connect</button>
        )}
        {smartAccount && (
          <>
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>Smart account Address:</span>  {smartAccountAddress}
            </div>
            <button className={styles.demoButton}
              onClick={mintNFT}>
              mint NFT
            </button>
          </>
        )}
        {transactionHash && (
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Transaction Hash:</span> {transactionHash}
          </div>
        )}
      </main>
    </>
  )
}
