import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { locale } from 'primereact/api'
import Layout from '../components/Layout'

import 'primereact/resources/themes/arya-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

locale('fr');

function MyApp({ Component, pageProps }: AppProps) {
  return <Layout>
    <Component {...pageProps} />
  </Layout>
}
export default MyApp
