import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { FormGroup, FormControl, ControlLabel, Button, Alert } from 'react-bootstrap'

const { config } = window
const PLUGIN_KEY = 'poi-plugin-auto-login'
const DEFAULT_CONFIG = {
  username: '',
  password: '',
  enabled: true
}

// Settings panel component
export const reactClass = connect((state) => ({
  config: get(state.config, PLUGIN_KEY, DEFAULT_CONFIG)
}))(class PluginSettingsClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      username: props.config.username || '',
      password: props.config.password || '',
      enabled: props.config.enabled !== false,
      showSuccess: false
    }
  }

  handleChange = (key) => (e) => {
    this.setState({
      [key]: e.target.value,
      showSuccess: false
    })
  }

  handleToggle = () => {
    const { enabled } = this.state
    this.setState({
      enabled: !enabled,
      showSuccess: false
    })
  }

  handleSave = () => {
    const { username, password, enabled } = this.state
    config.set(PLUGIN_KEY, {
      username,
      password,
      enabled
    })
    this.setState({ showSuccess: true })
    setTimeout(() => this.setState({ showSuccess: false }), 3000)
  }

  render() {
    const { username, password, enabled, showSuccess } = this.state

    return (
      <div className="settings-panel" style={{ padding: '10px' }}>
        <FormGroup>
          <ControlLabel>Username</ControlLabel>
          <FormControl
            type="text"
            value={username}
            onChange={this.handleChange('username')}
            placeholder="Enter DMM account username"
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Password</ControlLabel>
          <FormControl
            type="password"
            value={password}
            onChange={this.handleChange('password')}
            placeholder="Enter DMM account password"
          />
        </FormGroup>
        <FormGroup>
          <Button
            bsStyle={enabled ? 'success' : 'danger'}
            onClick={this.handleToggle}
            style={{ marginRight: '10px' }}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </Button>
          <Button
            bsStyle="primary"
            onClick={this.handleSave}
          >
            Save Settings
          </Button>
        </FormGroup>
        {showSuccess && (
          <Alert bsStyle="success">
            Settings saved successfully!
          </Alert>
        )}
        <Alert bsStyle="warning" style={{ marginTop: '20px' }}>
          <strong>Security Warning:</strong>
          <ul>
            <li>Credentials are stored in plaintext locally</li>
            <li>Only use this plugin on personal devices</li>
            <li>Manual login button click is required for security</li>
          </ul>
        </Alert>
      </div>
    )
  }
})

// Plugin main class
class AutoLogin {
  constructor() {
    this.config = config.get(PLUGIN_KEY, DEFAULT_CONFIG)
    this.autoFillCredentials()
  }

  // Auto fill credentials when login page is loaded
  autoFillCredentials() {
    // Set up event listener for game webview
    try {
      const gameWebView = document.querySelector('webview.kan-game-window')
      if (!gameWebView) {
        console.log('Game webview not found. Will try again later.')
        // Retry after a short delay
        setTimeout(() => this.autoFillCredentials(), 2000)
        return
      }

      // Listen for page loads
      gameWebView.addEventListener('did-finish-load', () => {
        this.fillLoginForm(gameWebView)
      })

      // Also try to fill in case we missed the load event
      this.fillLoginForm(gameWebView)
    } catch (e) {
      console.error('Error setting up auto-login:', e)
    }
  }

  fillLoginForm(webview) {
    if (!this.config.enabled) return

    if (!this.config.username || !this.config.password) {
      console.log('Username or password not configured')
      return
    }

    // Execute code in the context of game webview
    webview.executeJavaScript(`
      (function() {
        // Debug info
        console.log('Checking for login form...');

        // Try different possible selectors for login forms
        const possibleUserSelectors = [
          'input[name="username"]',
          'input[type="text"][id*="username"]',
          'input[type="text"][id*="login"]',
          'input[type="text"][name*="login"]',
          'input[type="email"]'
        ];

        const possiblePasswordSelectors = [
          'input[name="password"]',
          'input[type="password"]'
        ];

        // Find username field
        let usernameInput = null;
        for (const selector of possibleUserSelectors) {
          usernameInput = document.querySelector(selector);
          if (usernameInput) {
            console.log('Found username field with selector:', selector);
            break;
          }
        }

        // Find password field
        let passwordInput = null;
        for (const selector of possiblePasswordSelectors) {
          passwordInput = document.querySelector(selector);
          if (passwordInput) {
            console.log('Found password field with selector:', selector);
            break;
          }
        }

        // Fill the form if fields were found
        if (usernameInput && passwordInput) {
          console.log('Filling login credentials');

          // Fill username
          usernameInput.value = '${this.config.username}';
          usernameInput.dispatchEvent(new Event('input', { bubbles: true }));

          // Fill password
          passwordInput.value = '${this.config.password}';
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

          return true;
        } else {
          console.log('Login form not found');
          return false;
        }
      })();
    `).then(result => {
      if (result) {
        console.log('Auto-login credentials filled successfully')
      }
    }).catch(err => {
      console.error('Failed to execute script in webview:', err)
    })
  }
}

let autoLogin = null

// Export plugin API
export const pluginDidLoad = () => {
  autoLogin = new AutoLogin()
}

export const pluginWillUnload = () => {
  autoLogin = null
}
