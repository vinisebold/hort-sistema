import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface SelectionContextValue {
  selectedCount: number
  onClearSelection: (() => void) | null
  onCancelSelected: (() => void) | null
  registerSelection: (
    count: number,
    onClear: () => void,
    onCancel: () => void
  ) => void
  unregisterSelection: () => void
}

const SelectionContext = createContext<SelectionContextValue>({
  selectedCount: 0,
  onClearSelection: null,
  onCancelSelected: null,
  registerSelection: () => {},
  unregisterSelection: () => {},
})

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedCount, setSelectedCount] = useState(0)
  const [onClearSelection, setOnClearSelection] = useState<(() => void) | null>(null)
  const [onCancelSelected, setOnCancelSelected] = useState<(() => void) | null>(null)

  const registerSelection = useCallback(
    (count: number, onClear: () => void, onCancel: () => void) => {
      setSelectedCount(count)
      setOnClearSelection(() => onClear)
      setOnCancelSelected(() => onCancel)
    },
    []
  )

  const unregisterSelection = useCallback(() => {
    setSelectedCount(0)
    setOnClearSelection(null)
    setOnCancelSelected(null)
  }, [])

  return (
    <SelectionContext.Provider
      value={{
        selectedCount,
        onClearSelection,
        onCancelSelected,
        registerSelection,
        unregisterSelection,
      }}
    >
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelectionContext() {
  return useContext(SelectionContext)
}
