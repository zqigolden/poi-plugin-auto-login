import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { FormControl, FormGroup, ControlLabel, Button, Alert } from 'react-bootstrap'

// Get initial state from config
const { config } = window
const PLUGIN_KEY = 'poi-plugin-auto-login'
const DEFAULT_CONFIG = {
  username: '',
  password: '',
  enabled: true
}

@connect((state, props) => ({
  config: get(state.config, PLUGIN_KEY, DEFAULT_CONFIG)
}))
export class SettingsPanel extends Component {
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
}
