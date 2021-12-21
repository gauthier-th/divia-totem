import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { SelectButton } from 'primereact/selectbutton'
import { ToggleButton } from 'primereact/togglebutton'
import DiviaAPI from 'divia-api'
import useStateWithLocalStorage from '../utils/useStateWithLocalStorage'
import styles from '../styles/Index.module.css'

type FavoriteType = {
  line: string;
  direction: string;
  stop: string;
}

const divia = new DiviaAPI()

export default function Index() {
  const [lineCode, setLineCode] = useState<string>()
  const [lineDirection, setLineDirection] = useState<string>('A')
  const [stopId, setStopId] = useState<string>()
  const [passages, setPassages] = useState<{ text: string, date: Date }[] | null>(null)
  const [favorites, setFavorites] = useStateWithLocalStorage<FavoriteType[]>('favorites', [])

  const getLineByDirection = (lineCode: string, direction: string) => (
    divia.getLine(divia.lines.find(line => line.codetotem === lineCode && line.senstotem === direction)?.id)
  )
  const getStopByName = (lineId: string, name: string) => {
    const line = divia.getLine(lineId)
    if (line)
      return line.getStop(line.stops.find(stop => stop.nom === name)?.id)
  }

  useEffect(() => {
    divia.init().then(() => {
      setLineCode(divia.lines[0].codetotem)
    })
  }, [])

  const directions: { value: string, label: string }[] = useMemo(() => {
    if (!lineCode)
      return []
    return [
      { value: 'A', label: getLineByDirection(lineCode, 'A').data.direction },
      { value: 'R', label: getLineByDirection(lineCode, 'R').data.direction }
    ]
  }, [lineCode])

  useEffect(() => {
    if (!lineCode || !lineDirection || !stopId)
      return
    const stop = getLineByDirection(lineCode, lineDirection).getStop(stopId)
    stop.totem().then(setPassages).catch(() => {})
    const interval = setInterval(() => {
      stop.totem().then(setPassages).catch(() => {})
    }, 15000)
    return () => {
      clearInterval(interval)
    }
  }, [lineCode, lineDirection, stopId])

  const getFavorite = (lineCode: string, lineDirection: string, stopId: string): FavoriteType | undefined => (
    (favorites || []).find(({ line, direction, stop }) => line === lineCode && direction === lineDirection && stop === stopId)
  ) 

  return <>
    <Head>
      <title>Divia Totem</title>
      <meta name="description" content="Prochain passages des trams et bus de Divia." />
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icons/divia-bus-tram-192.png" />
      <link rel="apple-touch-startup-image" href="icon.png" />
      <meta name="theme-color" content="#ce007c" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      <meta name="apple-mobile-web-app-capable" content="yes">
    </Head>
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Divia Totem</h1>
        {!lineCode && <>
          Chargement...
        </>}
        {lineCode && <>
          <Dropdown
            className={styles.dropdown}
            value={lineCode}
            options={divia.lines
              .filter((item, pos, self) => self.map(line => line.codetotem).indexOf(item.codetotem) == pos)
              .map((line) => ({ label: line.nom_commercial, value: line.codetotem }))}
            onChange={(e) => {
              setLineCode(e.value)
              setPassages(null)
              if (stopId && lineCode) {
                const newLine = getLineByDirection(e.value, lineDirection)
                const newStop = getStopByName(newLine.data.id, getLineByDirection(lineCode, lineDirection).getStop(stopId).data.nom)
                if (newStop)
                  setStopId(newStop.data.id)
                else
                  setStopId(undefined)
                }
            }}
            placeholder='Choisissez la ligne'
          />
          {lineCode && <>
            <SelectButton
              className={styles.select}
              value={lineDirection}
              options={directions}
              onChange={(e) => {
                setLineDirection(e.value)
                setPassages(null)
                if (stopId && lineDirection) {
                  const oldLine = getLineByDirection(lineCode, lineDirection)
                  const newLine = getLineByDirection(lineCode, e.value)
                  const newStop = getStopByName(newLine.data.id, oldLine.getStop(stopId).data.nom)
                  if (newStop)
                    setStopId(newStop.data.id)
                  else
                    setStopId(undefined)
                }
              }}
            />
            <Dropdown
              className={styles.dropdown}
              value={stopId}
              options={getLineByDirection(lineCode, lineDirection).stops
                .sort((a: any, b: any) => a.nom.localeCompare(b.nom))
                .map((stop: any) => ({ label: stop.nom, value: stop.id }))}
              onChange={(e) => {
                setStopId(e.value)
                setPassages(null)
              }}
              placeholder="Choisissez l'arrêt"
            />
          </>}
          <div className={styles.passagesContainer}>
            <div className={styles.passagesTitle}>
              <div>
                {!passages && lineCode && lineDirection && stopId && <>
                  Chargement...
                </>}
                {passages && <>
                  {passages.length === 0 && 'Aucun prochains passage.'}
                  {passages.length === 1 && 'Prochain passage :'}
                  {passages.length > 1 && 'Prochains passages :'}
                  <div className={styles.passages}>
                    {passages.map((passage, i) => <span key={i}>{passage.text}</span>)}
                  </div>
                </>}
              </div>
              <div>
                {stopId && <>
                  <ToggleButton
                    checked={!!getFavorite(lineCode, lineDirection, stopId)}
                    onIcon='pi pi-star'
                    offIcon='pi pi-star-o'
                    onLabel=''
                    offLabel=''
                    className='p-button-rounded'
                    onChange={() => {
                      if (!favorites)
                        return
                      const fav = getFavorite(lineCode, lineDirection, stopId)
                      const newFavorites = favorites.slice()
                      if (!fav)
                        newFavorites.push({ line: lineCode, direction: lineDirection, stop: stopId })
                      else
                        newFavorites.splice(favorites.indexOf(fav))
                      setFavorites(newFavorites)
                    }}
                  />
                </>}
              </div>
            </div>
          </div>
        </>}
        <h2 className={styles.favoritesTitle}>Favoris</h2>
        {(!favorites || favorites.length === 0 || !divia.reseau) && 'Aucun favoris pour le moment.'}
        {favorites && divia.reseau && <div className={styles.favorites}>
          {favorites.map((fav, i) => (
            <Favorite
              key={i}
              favorite={fav}
              onRemove={() => {
                const newFavorites = favorites.slice()
                newFavorites.splice(favorites.indexOf(fav))
                setFavorites(newFavorites)
              }}
            />
          ))}
        </div>}
        <div className={styles.footer}>
          Site créé par <a href='https://gauthierth.fr/' target='_blank' rel='noopener noreferrer'>gauthier-th</a>
          <br />
          <a href='https://github.com/gauthier-th/divia-totem' target='_blank' rel='noopener noreferrer'>Source sur GitHub</a>
        </div>
      </div>
    </div>
  </>
}

const Favorite = ({ favorite, onRemove }: { favorite: FavoriteType, onRemove?: () => void }) => {
  const { line: lineId, direction, stop: stopId } = favorite
  const line = divia.getLine(divia.lines.find(line => line.codetotem === lineId && line.senstotem === direction).id)
  const stop = line.getStop(stopId)

  const [passages, setPassages] = useState<{ text: string, date: Date }[] | null>(null)
  useEffect(() => {
    stop.totem().then(setPassages).catch(() => {})
    const interval = setInterval(() => {
      stop.totem().then(setPassages).catch(() => {})
    }, 15000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return <div className={styles.favorite}>
    <Button
      icon='pi pi-times'
      className='p-button-rounded p-button-danger p-button-text p-button-sm'
      onClick={() => {
        if (onRemove)
          onRemove()
      }}
    />
    <div className={styles.favoriteTitle}>
      {/* <div /> */}
      <img src={line.data.picto} alt={line.data.nom_commercial} />
    </div>
    <div className={styles.stop}>
      {stop.data.nom}
    </div>
    <div className={styles.direction}>
      <i className='pi pi-angle-right' />
      <span>{line.data.direction}</span>
    </div>
    <div className={styles.passages}>
      {passages === null && 'Chargement...'}
      {passages !== null && <>
        {/* {passages.length === 0 && 'Aucun prochains passage.'}
        {passages.length === 1 && 'Prochain passage :'}
        {passages.length > 1 && 'Prochains passages :'} */}
        {/* <div className={styles.passages}> */}
          {passages.map((passage, i) => <span key={i}>{passage.text}</span>)}
        {/* </div> */}
      </>}
    </div>
  </div>
}
