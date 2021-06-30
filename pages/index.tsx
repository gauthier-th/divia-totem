import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import { SelectButton } from 'primereact/selectbutton'
import { ToggleButton } from 'primereact/togglebutton'
import DiviaAPI from 'divia-api'
import useStateWithLocalStorage from '../utils/useStateWithLocalStorage'
import styles from '../styles/Index.module.css'

type Favorite = {
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
  const [favorites, setFavorites] = useStateWithLocalStorage<Favorite[]>('favorites', [])

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
    getLineByDirection(lineCode, lineDirection).getStop(stopId).totem().then(setPassages)
  }, [lineCode, lineDirection, stopId])

  const getFavorite = (lineCode: string, lineDirection: string, stopId: string): Favorite | undefined => (
    favorites.find(({ line, direction, stop }) => line === lineCode && direction === lineDirection && stop === stopId)
  ) 

  return <>
    <Head>
      <title>Divia Totem</title>
      <meta name="description" content="Prochain passages des trams et bus de Divia" />
      <link rel="icon" href="/favicon.ico" />
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
            {!passages && lineCode && lineDirection && stopId && <>
              Chargement...
            </>}
            {passages && <>
              <div className={styles.passagesTitle}>
                <div>
                  {passages.length === 0 && 'Aucun prochains passage.'}
                  {passages.length === 1 && 'Prochain passage :'}
                  {passages.length > 1 && 'Prochains passages :'}
                  <div className={styles.passages}>
                    {passages.map((passage, i) => <span key={i}>{passage.text}</span>)}
                  </div>
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
            </>}
          </div>
        </>}
      </div>
    </div>
  </>
}
