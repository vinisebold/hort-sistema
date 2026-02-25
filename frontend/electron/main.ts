import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { spawn, ChildProcess } from 'child_process'

let mainWindow: BrowserWindow | null = null
let backendProcess: ChildProcess | null = null

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  })

  if (isDev) {
    // Desenvolvimento: carrega o Vite dev server
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Produção: carrega os arquivos estáticos
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startBackend() {
  if (isDev) {
    // Em desenvolvimento, o backend é iniciado separadamente (mvn spring-boot:run)
    console.log('Desenvolvimento: inicie o backend manualmente com "mvn spring-boot:run"')
    return
  }

  // Em produção, inicia o JAR como processo filho
  const jarPath = path.join(process.resourcesPath, 'backend', 'hort-0.0.1-SNAPSHOT.jar')
  
  backendProcess = spawn('java', ['-jar', jarPath], {
    cwd: path.dirname(jarPath),
  })

  backendProcess.stdout?.on('data', (data) => {
    console.log(`Backend: ${data}`)
  })

  backendProcess.stderr?.on('data', (data) => {
    console.error(`Backend Error: ${data}`)
  })
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
}

app.whenReady().then(() => {
  startBackend()
  
  // Aguarda o backend iniciar (simplificado - em produção usar polling)
  setTimeout(() => {
    createWindow()
  }, isDev ? 0 : 5000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopBackend()
})
