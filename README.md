# Stackr

Stackr is a modern desktop launcher for web apps. Organize applications like ChatGPT, GitHub, Notion, or your own websites into separate profiles and open them in isolated windows — all from one central place.

## Features

- Modern Electron desktop application
- Built with React and Vite
- Launch websites as standalone desktop apps
- Isolated browser sessions per profile
- Profile support (Private, Work, and more)
- Automatic website icon downloading
- Searchable app grid
- JSON-based configuration system
- User data stored outside the installation directory
- Desktop shortcut support
- English language support

## Configuration

Stackr automatically creates a user data directory containing:

```text
apps.json
profiles.json
settings.json
icons/
```

### apps.json

Stores all installed applications.

### profiles.json

Stores available profiles and session configurations.

### settings.json

Stores application settings and preferences.

### icons/

Contains downloaded website icons.

## Roadmap

- App creation wizard
- Custom profile management
- Import and export functionality
- Notification support
- Theme customization
- Workspace management
- Application categories
- Cloud synchronization

## Technology Stack

- Electron
- React
- Vite
- TypeScript
- JSON Storage

## License

This project is licensed under the MIT License.
