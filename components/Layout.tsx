import type { ReactNode } from 'react'
import styles from '../styles/Layout.module.css'

const Layout = ({ children }: { children: ReactNode }) => {
  return <div className={styles.pageContainer}>
    {children}
  </div>
}

export default Layout