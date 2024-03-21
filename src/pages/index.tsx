import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  const handleConnect = () => {
    alert("implement the function!")
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
        <button onClick={handleConnect} className={styles.demoButton}>Connect</button>
      </main>
    </>
  )
}
