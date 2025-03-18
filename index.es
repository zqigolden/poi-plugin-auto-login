import React from 'react'
import { FormGroup, FormControl, ControlLabel, Button, Alert } from 'react-bootstrap'
import { useTranslation, withTranslation } from 'react-i18next'
import AutoLoginService from './views/auto-login-service'

const PLUGIN_KEY = 'poi-plugin-auto-login'

// Simple class-based plugin UI component
class SettingsPanel extends React.Component {
  constructor(props) {
    super(props)
    // Load config directly
    const config = window.config.get(PLUGIN_KEY, {})

    this.state = {
      username: config.username || '',
      password: config.password || '',
      enabled: typeof config.enabled === 'undefined' ? true : config.enabled,
      showPassword: false,
    }

    console.log('Initial state loaded:', this.state)
  }

  handleChange = (key) => (e) => {
    console.log(`Changing ${key} to:`, e.target.value)
    this.setState({ [key]: e.target.value }, this.saveConfig)
  }

  handleToggle = () => {
    console.log('Toggle button clicked, current enabled:', this.state.enabled)
    this.setState(
      prevState => ({ enabled: !prevState.enabled }),
      this.saveConfig
    )
  }

  togglePasswordVisibility = () => {
    console.log('Password visibility toggle clicked')
    this.setState(prevState => ({ showPassword: !prevState.showPassword }))
  }

  saveConfig = () => {
    console.log('Saving config with state:', this.state)
    const { username, password, enabled } = this.state
    window.config.set(PLUGIN_KEY, { username, password, enabled })
  }

  render() {
    const { username, password, enabled, showPassword } = this.state
    const { t } = this.props

    console.log('Rendering with state:', {
      username,
      password: password ? '(set)' : '(not set)',
      enabled,
      showPassword
    })

    return (
      <div className="settings-panel" style={{ padding: '10px' }}>
        <h4>{t('Auto Login')}</h4>
        <FormGroup>
          <ControlLabel>{t("Username")}</ControlLabel>
          <FormControl
            type="text"
            value={username}
            onChange={this.handleChange('username')}
            placeholder={t("Enter DMM account username")}
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>{t("Password")}</ControlLabel>
          <div style={{ display: 'flex' }}>
            <FormControl
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={this.handleChange('password')}
              placeholder={t("Enter DMM account password")}
              style={{ flex: 1 }}
            />
            <Button
              onClick={this.togglePasswordVisibility}
              style={{ marginLeft: '5px' }}
            >
              {showPassword ? t("Hide") : t("Show")}
            </Button>
          </div>
        </FormGroup>
        <FormGroup>
          <Button
            bsStyle={enabled ? 'success' : 'danger'}
            onClick={this.handleToggle}
            style={{ marginRight: '10px' }}
          >
            {enabled ? t("Enabled") : t("Disabled")}
          </Button>
        </FormGroup>
        <Alert bsStyle="warning" style={{ marginTop: '20px' }}>
          <strong>{t("Security Warning")}</strong>
          <ul>
            <li>{t("Credentials are stored in plaintext locally")}</li>
            <li>{t("Only use this plugin on personal devices")}</li>
            <li>{t("Manual login button click is required for security")}</li>
          </ul>
        </Alert>
      </div>
    )
  }
}

// Wrap with translation HOC
const TranslatedSettingsPanel = withTranslation('poi-plugin-auto-login')(SettingsPanel)

// Export the React component for plugin settings
export const reactClass = TranslatedSettingsPanel

// Service singleton
let service = null

// Plugin lifecycle methods
export const pluginDidLoad = () => {
  console.log('[auto-login] Plugin loading')
  // Initialize service
  try {
    service = new AutoLoginService()
    service.initialize()
    console.log('[auto-login] Service initialized')
  } catch (e) {
    console.error('[auto-login] Error initializing service:', e)
  }
}

export const pluginWillUnload = () => {
  console.log('[auto-login] Plugin unloading')
  // Clean up service
  if (service) {
    service.destroy()
    service = null
    console.log('[auto-login] Service destroyed')
  }
}
