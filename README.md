# mìmú Admin Console

A Vue 3 + Tailwind CSS conversion of the mìmú Admin Console, featuring a comprehensive admin interface for managing screens, hosts, advertisers, payouts, and more.

## Features

- **Modern UI** - Clean, density-first design with dark mode support
- **Vue 3** - Built with Composition API and script setup
- **Tailwind CSS 3** - Utility-first CSS framework
- **Keyboard-forward** - Comprehensive keyboard shortcuts for power users
- **Responsive** - Optimized for admin workflows
- **Theme Support** - Light and dark modes with system persistence
- **Auth Flows** - Google OAuth and TOTP authentication examples
- **Rich Components** - Metrics, charts, tables, modals, drawers, and more

## Project Structure

```
mimu-admin/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css          # Main styles with theme tokens
│   ├── components/
│   │   ├── Logo.vue               # Bouncing ball M logo
│   │   ├── Sidebar.vue            # Navigation sidebar
│   │   ├── Topbar.vue             # Global top bar
│   │   ├── CmdK.vue               # Command palette
│   │   ├── ToastHost.vue          # Toast notifications
│   │   └── ...                    # Other components
│   ├── composables/
│   │   ├── useAppState.js         # Global app state
│   │   └── useMockData.js         # Mock data for all resources
│   ├── views/
│   │   ├── Dashboard.vue          # Main dashboard
│   │   ├── Vetting.vue            # Creative vetting queue
│   │   ├── Hosts.vue              # Host management
│   │   ├── Payouts.vue            # Payout approvals
│   │   ├── Fraud.vue              # Fraud review
│   │   └── ...                    # Other pages
│   ├── utils/
│   │   └── format.js              # Formatting utilities
│   ├── App.vue                    # Root component
│   └── main.js                    # App entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Key Features

### Global Keyboard Shortcuts

- `⌘K` - Open command palette
- `⌘⇧D` - Toggle dark mode
- `⌘/` - Show keyboard shortcuts
- `Esc` - Close modals/drawers
- `G` then letter - Quick navigation (e.g., `G H` for Dashboard)

### Keyboard Navigation

- `J/K` or `↓/↑` - Navigate table rows
- `Enter` - Open focused item
- `Space` - Toggle selection
- `Esc` - Clear selection

### Pages

1. **Dashboard** - Operations overview with metrics and system health
2. **Vetting Queue** - Creative vetting and approval workflow
3. **Hosts** - Host management and onboarding
4. **Screens** - Screen inventory with map view
5. **Payouts** - Payout approval workflow with TOTP
6. **Fraud Review** - Fraud detection and investigation
7. **Support** - Support ticket management
8. **Advertisers** - Advertiser management
9. **Audit Log** - Complete audit trail
10. **Components** - Component showcase and documentation

### Theme System

The app uses CSS custom properties for theming:

```css
[data-theme="light"] {
  --bg: #F7F5F2;
  --fg: #0E0D0B;
  /* ... */
}

[data-theme="dark"] {
  --bg: #0E0D0B;
  --fg: #F2EFE9;
  /* ... */
}
```

Themes are automatically persisted to localStorage.

### Logo

The bouncing ball "M" logo is dynamically generated based on the design from `M Logo Explorations.html`. It features:

- Configurable humps, heights, decay
- Responsive sizing
- Mono/color variants

## Design Principles

1. **Density-first** - Optimized for information density
2. **Keyboard-forward** - All actions keyboard accessible
3. **Dark-equal** - Dark mode is a first-class citizen
4. **Context-aware** - Appropriate helpers and shortcuts per context
5. **Audit-everything** - All critical actions logged

## Technologies

- **Vue 3.4** - Progressive JavaScript framework
- **Vite 5** - Next-generation frontend tooling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Vue Router 4** - Official router for Vue.js
- **Phosphor Icons** - Flexible icon family
- **Cormorant** - Display font
- **Plus Jakarta Sans** - Body font
- **JetBrains Mono** - Monospace font

## Environment

The app supports `staging` and `production` environments. Set `MOCK.env` in `useMockData.js`:

```javascript
env: 'staging', // or 'production'
```

Staging shows a warning banner and uses mock data.

## License

Licensed under MIT License.

---

**Built with using Vue 3 + Tailwind CSS**

