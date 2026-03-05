import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Snackbar, Alert, AlertColor, Fade } from '@mui/material'

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AlertColor>('success')

  const showToast = (msg: string, sev: AlertColor = 'success') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Fade}
        sx={{ 
          top: { xs: 76, sm: 76 }, 
          right: { xs: 12, sm: 12 },
          margin: 0
        }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="standard"
          sx={{
            minWidth: '280px',
            backgroundColor: '#ffffff',
            color: '#333333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f0f0f0',
            borderRadius: '8px',
            alignItems: 'center',
            fontWeight: 400,
            fontSize: '0.875rem',
            px: 2,
            py: 0.5,
            '& .MuiAlert-icon': {
              fontSize: '1.25rem',
              mr: 1.5,
              opacity: 0.9,
            },
            '& .MuiAlert-message': {
              padding: '8px 0',
            },
            '& .MuiAlert-action': {
              pt: 0,
              pb: 0,
              '& svg': {
                fontSize: '1.1rem',
                color: '#cccccc',
                transition: 'color 0.2s',
                '&:hover': {
                  color: '#888888'
                }
              }
            }
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}
