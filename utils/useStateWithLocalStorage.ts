import { useState, useEffect } from 'react'

type SetStateActionCallback<T> = (value: T) => void
type LocalStorageState<T> = [T, SetStateActionCallback<T>]

function useStateWithLocalStorage<T>(localStorageKey: string, defaultValue?: T): LocalStorageState<T> {
  let initialValue = null
  if (typeof window !== "undefined") {
    initialValue = JSON.parse(localStorage.getItem(localStorageKey) || 'null')
    if (defaultValue !== undefined && initialValue === null)
      initialValue = defaultValue
  }
  const [value, setValue]: [T, SetStateActionCallback<T>] = useState(initialValue)

  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(localStorageKey, JSON.stringify(value));
  }, [value])

  return [value, setValue]
}

export default useStateWithLocalStorage