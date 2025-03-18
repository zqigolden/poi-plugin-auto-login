import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { FormGroup, FormControl, ControlLabel, Button, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

const { config } = window
const PLUGIN_KEY = 'poi-plugin-auto-login'
const DEFAULT_CONFIG = {
  username: '',
  password: '',
  enabled: true
}

// Settings panel component
const PluginSettings = connect((state) => ({
  config: get(state.config, PLUGIN_KEY, DEFAULT_CONFIG)
}))(({ config }) => {
  const { t } = useTranslation('poi-plugin-auto-login')
  const [state, setState] = React.useState({
    username: config.username || '',
    password: config.password || '',
    enabled: config.enabled !== false,
    showSuccess: false,
    showPassword: false
  })

  const handleChange = (key) => (e) => {
    setState({
      ...state,
      [key]: e.target.value,
      showSuccess: false
    })
  }

  const handleToggle = () => {
    setState({
      ...state,
      enabled: !state.enabled,
      showSuccess: false
    })
  }

  const togglePasswordVisibility = () => {
    setState({
      ...state,
      showPassword: !state.showPassword
    })
  }

  const handleSave = () => {
    const { username, password, enabled } = state
    window.config.set(PLUGIN_KEY, {
      username,
      password,
      enabled
    })
    setState({ ...state, showSuccess: true })
    setTimeout(() => setState({ ...state, showSuccess: false }), 3000)
  }

  const { username, password, enabled, showSuccess, showPassword } = state

  return (
    <div className="settings-panel" style={{ padding: '10px' }}>
      <FormGroup>
        <ControlLabel>{t("Username")}</ControlLabel>
        <FormControl
          type="text"
          value={username}
          onChange={handleChange('username')}
          placeholder={t("Enter DMM account username")}
        />
      </FormGroup>
      <FormGroup>
        <ControlLabel>{t("Password")}</ControlLabel>
        <div style={{ display: 'flex' }}>
          <FormControl
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handleChange('password')}
            placeholder={t("Enter DMM account password")}
            style={{ flex: 1 }}
          />
          <Button
            onClick={togglePasswordVisibility}
            style={{ marginLeft: '5px' }}
          >
            {showPassword ? t("Hide") : t("Show")}
          </Button>
        </div>
      </FormGroup>
      <FormGroup>
        <Button
          bsStyle={enabled ? 'success' : 'danger'}
          onClick={handleToggle}
          style={{ marginRight: '10px' }}
        >
          {enabled ? t("Enabled") : t("Disabled")}
        </Button>
        <Button
          bsStyle="primary"
          onClick={handleSave}
        >
          {t("Save Settings")}
        </Button>
      </FormGroup>
      {showSuccess && (
        <Alert bsStyle="success">
          {t("Settings saved successfully!")}
        </Alert>
      )}
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
})

// Export the React component for plugin settings
export const reactClass = PluginSettings

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
      const gameWebView = document.querySelector('webview.kancolle-webview')
      if (!gameWebView) {
        console.log('Game webview not found. Will try again later.')
        // Retry after a short delay
        setTimeout(() => this.autoFillCredentials(), 2000)
        return
      }

      console.log('Found game webview, setting up listeners')

      // Listen for page loads
      gameWebView.addEventListener('did-finish-load', () => {
        console.log('Webview did-finish-load event triggered')
        this.fillLoginForm(gameWebView)
      })

      // Also try to fill in case we missed the load event
      this.fillLoginForm(gameWebView)
    } catch (e) {
      console.error('Error setting up auto-login:', e)
    }
  }

  fillLoginForm(webview) {
    if (!this.config.enabled) {
      console.log('Auto-login disabled in settings')
      return
    }

    if (!this.config.username || !this.config.password) {
      console.log('Username or password not configured')
      return
    }

    console.log('Attempting to fill login form with username:', this.config.username)

    // Execute code in the context of game webview
    webview.executeJavaScript(`
      (function() {
        console.log('Starting React-aware login form filling');

        // Debug information about the page
        console.log('Current URL:', window.location.href);

        // Function to fill login form for React applications
        function fillReactLoginForm() {
          // 1. Try to locate form elements
          const loginInput = document.querySelector('#login_id');
          const passwordInput = document.querySelector('#password');

          if (!loginInput || !passwordInput) {
            console.log('Form fields not found directly, trying iframe...');

            // Try iframe
            const loginIframe = document.querySelector('iframe');
            if (loginIframe) {
              try {
                const iframeDoc = loginIframe.contentDocument ||
                                (loginIframe.contentWindow && loginIframe.contentWindow.document);

                if (iframeDoc) {
                  // Look for form fields in the iframe
                  const iframeLoginInput = iframeDoc.querySelector('#login_id');
                  const iframePasswordInput = iframeDoc.querySelector('#password');

                  if (iframeLoginInput && iframePasswordInput) {
                    return fillReactInputs(iframeLoginInput, iframePasswordInput, iframeDoc);
                  } else {
                    console.log('Form fields not found in iframe');
                  }
                } else {
                  console.log('Cannot access iframe document (cross-origin)');
                }
              } catch (e) {
                console.log('Error accessing iframe:', e.message);
              }
            }

            return false;
          }

          // Found form fields, attempt to fill
          return fillReactInputs(loginInput, passwordInput, document);
        }

        // Fill React input fields using multiple methods
        function fillReactInputs(loginInput, passwordInput, doc) {
          console.log('Found login form, attempting to fill with React-aware methods');

          // Method 1: Native event simulation
          function nativeInputValueSetter(value) {
            const proto = Object.getPrototypeOf(loginInput);
            const protoValueSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
            const protoValueSetterCalled = protoValueSetter.call(loginInput, value);
            return protoValueSetterCalled;
          }

          try {
            // Use the same method React uses internally to set values
            const username = '${this.config.username}';
            const password = '${this.config.password}';

            // 1. Directly access prototype setter
            const loginProto = Object.getPrototypeOf(loginInput);
            const loginSetter = Object.getOwnPropertyDescriptor(loginProto, 'value').set;
            const passwordProto = Object.getPrototypeOf(passwordInput);
            const passwordSetter = Object.getOwnPropertyDescriptor(passwordProto, 'value').set;

            // Call native setter
            loginSetter.call(loginInput, username);
            passwordSetter.call(passwordInput, password);

            // 2. Trigger React onChange events
            loginInput.dispatchEvent(new Event('input', { bubbles: true }));
            loginInput.dispatchEvent(new Event('change', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

            console.log('Values set using native setters:', loginInput.value, passwordInput.value);

            // 3. Use React's synthetic event system - find and use React fiber
            setTimeout(() => {
              try {
                // Look for possible React fiber
                let fiber = loginInput._reactFiber ||
                          loginInput._reactInternalFiber ||
                          loginInput.__reactFiber ||
                          loginInput.__reactInternalFiber;

                if (!fiber) {
                  // Try to find React instance from DOM node
                  for (const key in loginInput) {
                    if (key.startsWith('__reactFiber$') ||
                        key.startsWith('__reactInternalInstance$')) {
                      fiber = loginInput[key];
                      break;
                    }
                  }
                }

                if (fiber) {
                  console.log('Found React fiber, attempting to use React event system');
                  // Here we found React fiber, could potentially manipulate component state
                  // but for security reasons, we won't do that, just log that we found it
                }
              } catch (e) {
                console.log('React fiber access error:', e);
              }
            }, 0);

            // 4. Monitor if values are cleared, and refill if necessary
            const valueMonitor = setInterval(() => {
              if (!loginInput.value || !passwordInput.value) {
                console.log('Values were cleared, refilling...');

                // Try setting values again
                loginSetter.call(loginInput, username);
                passwordSetter.call(passwordInput, password);

                loginInput.dispatchEvent(new Event('input', { bubbles: true }));
                loginInput.dispatchEvent(new Event('change', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }, 100);

            // Clear monitor after 10 seconds
            setTimeout(() => {
              clearInterval(valueMonitor);
            }, 10000);

            // 5. Try to handle "remember me" option if available
            try {
              const rememberCheckbox = doc.querySelector('#use_auto_login');
              if (rememberCheckbox && !rememberCheckbox.checked) {
                rememberCheckbox.checked = true;
                rememberCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('Remember checkbox checked');
              }
            } catch (e) {
              console.log('Error checking remember checkbox:', e);
            }

            return true;
          } catch (e) {
            console.error('Error filling React form:', e);
            return false;
          }
        }

        // Execute form filling
        return fillReactLoginForm();
      })();
    `).then(result => {
      if (result) {
        console.log('Login form filled successfully')
      } else {
        console.log('Failed to fill login form')
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
