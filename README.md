# poi-plugin-auto-login

A poi plugin for automatically filling KanColle login credentials. Designed to reduce the hassle of repeatedly entering account information when switching between multiple devices.

## Features

- Automatically fills username and password on the login page
- Manual login button click required to avoid bot detection
- Easy configuration through poi plugin settings

## Installation

```bash
npm install poi-plugin-auto-login
```

Or install through poi's plugin menu.

## Usage

1. Enable the plugin in poi's plugin menu
2. Configure your login credentials in the plugin settings
3. The plugin will automatically fill in your credentials when you visit the login page
4. Click the login button manually to complete the login process

## ⚠️ Security Warning

Please be aware of the following important information before using this plugin:

- Username and password are stored in plaintext in local configuration files
- Data is stored only on your device and is never uploaded to any server
- Due to plaintext storage, ensure your device is secure and inaccessible to others
- Plugin developers are not responsible for any account security issues arising from the use of this plugin
- Recommended for use only on personal devices

## Use Cases

This plugin is suitable for:
- Switching between personal devices on home networks
- Situations requiring frequent re-login
- Gaming on devices without keyboards (e.g., tablets)

Not recommended for:
- Public devices
- Shared devices
- High-security environments

## License

MIT
