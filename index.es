import { remote } from 'electron'
import { SettingsPanel } from './views/settings-panel'

const { config } = window
const PLUGIN_KEY = 'poi-plugin-auto-login'

// Plugin main class
class AutoLogin {
  constructor() {
    this.config = config.get(PLUGIN_KEY, {
      username: '',
      password: '',
      enabled: true
    })
    this.autoFillCredentials()
  }

  // Auto fill credentials when login page is loaded
  autoFillCredentials() {
    const mainWindow = remote.getCurrentWindow()
    if (!mainWindow) return

    mainWindow.webContents.on('did-finish-load', () => {
      if (!this.config.enabled) return

      mainWindow.webContents.executeJavaScript(`
        // Check if we're on the login page
        if (document.querySelector('input[name="username"]') && document.querySelector('input[name="password"]')) {
          // Fill username
          const usernameInput = document.querySelector('input[name="username"]')
          usernameInput.value = '${this.config.username}'
          usernameInput.dispatchEvent(new Event('input', { bubbles: true }))

          // Fill password
          const passwordInput = document.querySelector('input[name="password"]')
          passwordInput.value = '${this.config.password}'
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
      `)
    })
  }
}

let autoLogin = null

export const pluginDidLoad = () => {
  autoLogin = new AutoLogin()
}

export const pluginWillUnload = () => {
  autoLogin = null
}

export const settingsClass = SettingsPanel
