import Head from 'next/head'
import styles from '../styles/Index.module.css'

export default function Index() {
  return <>
    <Head>
      <title>Divia Totem</title>
      <meta name="description" content="Prochain passages des trams et bus de Divia" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div>
      <h1>Divia Totem</h1>
    </div>
  </>
}
