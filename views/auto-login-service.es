import { remote } from 'electron'

// Constants for elements
const SELECTORS = {
  GAME_WEBVIEW: 'webview.kancolle-webview',
  LOGIN_ID: '#login_id',
  PASSWORD: '#password',
  REMEMBER_ME: '#use_auto_login',
  IFRAME: 'iframe'
}

const PLUGIN_KEY = 'poi-plugin-auto-login'

class AutoLoginService {
  constructor() {
    this.hasInitialized = false
    this.config = window.config.get(PLUGIN_KEY, {
      username: '',
      password: '',
      enabled: true
    })

    console.log('[auto-login] Service constructor with config:', {
      username: this.config.username ? '(set)' : '(not set)',
      password: this.config.password ? '(set)' : '(not set)',
      enabled: this.config.enabled
    })
  }

  initialize() {
    if (this.hasInitialized) return
    this.hasInitialized = true
    console.log('[auto-login] Service initializing')
    this.autoFillCredentials()
  }

  getConfig() {
    // Reload config in case it changed
    this.config = window.config.get(PLUGIN_KEY, {
      username: '',
      password: '',
      enabled: true
    })
    return this.config
  }

  autoFillCredentials() {
    try {
      const gameWebView = document.querySelector(SELECTORS.GAME_WEBVIEW)
      if (!gameWebView) {
        console.log('[auto-login] Game webview not found. Will try again later.')
        setTimeout(() => this.autoFillCredentials(), 2000)
        return
      }

      console.log('[auto-login] Found game webview, setting up listeners')

      // Listen for page loads
      gameWebView.addEventListener('did-finish-load', () => {
        console.log('[auto-login] Webview did-finish-load event triggered')
        this.fillLoginForm(gameWebView)
      })

      // Also try to fill in case we missed the load event
      this.fillLoginForm(gameWebView)
    } catch (e) {
      console.error('[auto-login] Error setting up auto-login:', e)
    }
  }

  async fillLoginForm(webview) {
    const { enabled, username, password } = this.getConfig()

    if (!enabled) {
      console.log('[auto-login] Auto-login disabled in settings')
      return
    }

    if (!username || !password) {
      console.log('[auto-login] Username or password not configured')
      return
    }

    console.log('[auto-login] Attempting to fill login form with username:', username)

    // Execute code in the context of game webview
    try {
      const result = await webview.executeJavaScript(`
        (function() {
          console.log('[auto-login] Starting React-aware login form filling');

          // Debug information about the page
          console.log('[auto-login] Current URL:', window.location.href);

          // Function to fill login form for React applications
          function fillReactLoginForm() {
            // 1. Try to locate form elements
            const loginInput = document.querySelector('${SELECTORS.LOGIN_ID}');
            const passwordInput = document.querySelector('${SELECTORS.PASSWORD}');

            if (!loginInput || !passwordInput) {
              console.log('[auto-login] Form fields not found directly, trying iframe...');

              // Try iframe
              const loginIframe = document.querySelector('${SELECTORS.IFRAME}');
              if (loginIframe) {
                try {
                  const iframeDoc = loginIframe.contentDocument ||
                                  (loginIframe.contentWindow && loginIframe.contentWindow.document);

                  if (iframeDoc) {
                    // Look for form fields in the iframe
                    const iframeLoginInput = iframeDoc.querySelector('${SELECTORS.LOGIN_ID}');
                    const iframePasswordInput = iframeDoc.querySelector('${SELECTORS.PASSWORD}');

                    if (iframeLoginInput && iframePasswordInput) {
                      return fillReactInputs(iframeLoginInput, iframePasswordInput, iframeDoc);
                    } else {
                      console.log('[auto-login] Form fields not found in iframe');
                    }
                  } else {
                    console.log('[auto-login] Cannot access iframe document (cross-origin)');
                  }
                } catch (e) {
                  console.log('[auto-login] Error accessing iframe:', e.message);
                }
              }

              return false;
            }

            // Found form fields, attempt to fill
            return fillReactInputs(loginInput, passwordInput, document);
          }

          // Fill React input fields using multiple methods
          function fillReactInputs(loginInput, passwordInput, doc) {
            console.log('[auto-login] Found login form, attempting to fill with React-aware methods');

            try {
              // Use the same method React uses internally to set values
              const username = '${username}';
              const password = '${password}';

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

              console.log('[auto-login] Values set using native setters');

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
                    console.log('[auto-login] Found React fiber, attempting to use React event system');
                  }
                } catch (e) {
                  console.log('[auto-login] React fiber access error:', e);
                }
              }, 0);

              // 4. Monitor if values are cleared, and refill if necessary
              const valueMonitor = setInterval(() => {
                if (!loginInput.value || !passwordInput.value) {
                  console.log('[auto-login] Values were cleared, refilling...');

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
                const rememberCheckbox = doc.querySelector('${SELECTORS.REMEMBER_ME}');
                if (rememberCheckbox && !rememberCheckbox.checked) {
                  rememberCheckbox.checked = true;
                  rememberCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log('[auto-login] Remember checkbox checked');
                }
              } catch (e) {
                console.log('[auto-login] Error checking remember checkbox:', e);
              }

              return true;
            } catch (e) {
              console.error('[auto-login] Error filling React form:', e);
              return false;
            }
          }

          // Execute form filling
          return fillReactLoginForm();
        })();
      `)

      if (result) {
        console.log('[auto-login] Login form filled successfully')
      } else {
        console.log('[auto-login] Failed to fill login form')
      }
    } catch (err) {
      console.error('[auto-login] Failed to execute script in webview:', err)
    }
  }

  destroy() {
    this.hasInitialized = false
    console.log('[auto-login] Service destroyed')
  }
}

export default AutoLoginService
