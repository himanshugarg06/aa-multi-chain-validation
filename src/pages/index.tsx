import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useState } from 'react'
import { BiconomySmartAccountV2, PaymasterMode, createSmartAccountClient } from "@biconomy/account";
import "viem/window";
import { Hex, createWalletClient, custom, encodeFunctionData, parseAbi } from "viem";
import { sepolia, polygon, polygonMumbai } from "viem/chains";
import {
  createMultiChainValidationModule,
  DEFAULT_MULTICHAIN_MODULE, MultiChainValidationModule
} from "@biconomy/modules";

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null)
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | any>(null)

  const [polygonSmartAccountAddress, setPolygonSmartAccountAddress] = useState<string | null>(null)
  const [polygonSmartAccount, setPolygonSmartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [polygonTransactionHash, setPolygonTransactionHash] = useState<string | any>(null)

  const [module, setModule] = useState<MultiChainValidationModule | any>(null);

  const createSmartAccountAddresses = async () => {
    try {
      if (!window.ethereum) return;
      const [account] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const walletClient = createWalletClient({
        account,
        chain: polygon,
        transport: custom(window.ethereum),
      });

      const polygonWalletClient = createWalletClient({
        account,
        chain: polygonMumbai,
        transport: custom(window.ethereum),
      });

      const multiChainModule = await createMultiChainValidationModule({
        signer: walletClient,
        moduleAddress: DEFAULT_MULTICHAIN_MODULE,
      });

      const smartAccount = await createSmartAccountClient({
        signer: walletClient,
        bundlerUrl: "https://bundler.biconomy.io/api/v2/137/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f64",
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_POLYGON_MAINNET_PAYMASTER_API_KEY,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule
      });

      const polygonSmartAccount = await createSmartAccountClient({
        signer: polygonWalletClient,
        bundlerUrl: "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_POLYGON_PAYMASTER_API_KEY,
        defaultValidationModule: multiChainModule,
        activeValidationModule: multiChainModule
      });

     
      setModule(multiChainModule);
      const address = await smartAccount.getAccountAddress();
      console.log("nonce", (await smartAccount.getNonce()))
      setSmartAccount(smartAccount);
      setSmartAccountAddress(address);

      const polygonAddress = await polygonSmartAccount.getAccountAddress();
      setPolygonSmartAccount(polygonSmartAccount);
      setPolygonSmartAccountAddress(polygonAddress);
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

      const partialUserOp: any = await smartAccount?.buildUserOp([mintNFTTransaction], {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED
        }
      });

      const polygonPartialUserOp: any = await polygonSmartAccount?.buildUserOp([mintNFTTransaction], {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED
        }
      });
      console.log("module", module)
      const returnedOps = await module?.signUserOps([
        { userOp: partialUserOp, chainId: 137},
        { userOp: polygonPartialUserOp, chainId: 80001},
      ]);
      
      const response = await smartAccount?.sendSignedUserOp(returnedOps[0])
      const polygonResponse = await polygonSmartAccount?.sendSignedUserOp(returnedOps[1])
      const receipt = await response?.waitForTxHash();
      console.log(receipt)
      setTransactionHash(receipt?.transactionHash)
      
      const polygonReceipt = await polygonResponse?.waitForTxHash();
      console.log(polygonReceipt)
      setPolygonTransactionHash(polygonReceipt?.transactionHash)

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
        {smartAccount && polygonSmartAccount && (
          <>
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>Polygon Mainnet Smart account Address:</span>  {smartAccountAddress}
            </div>
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>Polygon Mumbai Smart account Address:</span>  {polygonSmartAccountAddress}
            </div>
            <button className={styles.demoButton}
              onClick={mintNFT}>
              mint NFT
            </button>
          </>
        )}
        {transactionHash && (
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Polygon Mainnet Transaction Hash:</span> {transactionHash}
            <br></br>
            <span style={{ fontWeight: 'bold' }}>Polygon Mumbai Transaction Hash:</span> {polygonTransactionHash}
          </div>
        )}
      </main>
    </>
  )
}
