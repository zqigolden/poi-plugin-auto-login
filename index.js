const { remote } = require('electron')
const { BrowserWindow } = remote
const { getStore } = require('poi-plugin-config')

// Plugin configuration
const config = {
  username: '',
  password: ''
}

// Load saved configuration
const store = getStore('auto-login')
const savedConfig = store.get('config', { username: '', password: '' })
config.username = savedConfig.username
config.password = savedConfig.password

// Plugin main class
class AutoLogin {
  constructor() {
    this.config = config
    this.autoFillCredentials()
  }

  // Auto fill credentials when login page is loaded
  autoFillCredentials() {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (!mainWindow) return

    mainWindow.webContents.on('did-finish-load', () => {
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

// Plugin settings component
const React = require('react')
const { FormControl, FormGroup, ControlLabel } = require('react-bootstrap')

class PluginSettings extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      username: config.username,
      password: config.password
    }
  }

  handleUsernameChange = (e) => {
    const newUsername = e.target.value
    this.setState({ username: newUsername })
    config.username = newUsername
    store.set('config', {
      username: newUsername,
      password: config.password
    })
  }

  handlePasswordChange = (e) => {
    const newPassword = e.target.value
    this.setState({ password: newPassword })
    config.password = newPassword
    store.set('config', {
      username: config.username,
      password: newPassword
    })
  }

  render() {
    return (
      <div>
        <FormGroup>
          <ControlLabel>Username</ControlLabel>
          <FormControl
            type="text"
            value={this.state.username}
            onChange={this.handleUsernameChange}
            placeholder="Enter username"
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Password</ControlLabel>
          <FormControl
            type="password"
            value={this.state.password}
            onChange={this.handlePasswordChange}
            placeholder="Enter password"
          />
        </FormGroup>
      </div>
    )
  }
}

module.exports = {
  pluginDidLoad: () => {
    new AutoLogin()
  },
  pluginWillUnload: () => {
    // Cleanup if needed
  },
  settingsClass: PluginSettings
}
