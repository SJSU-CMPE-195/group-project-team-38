# MediTag

> AI-assisted patient verification system using QR/NFC scanning and local-first architecture.

## Team

| Name   | GitHub                                   | Email         |
| ------ | ---------------------------------------- | ------------- |
| Name 1 | [@username](https://github.com/username) | name@sjsu.edu |
| Name 2 | [@username](https://github.com/username) | name@sjsu.edu |
| Name 3 | [@username](https://github.com/username) | name@sjsu.edu |
| Name 4 | [@username](https://github.com/username) | name@sjsu.edu |

**Advisor:** [Advisor Name]

---

## Problem Statement

[2-3 sentences describing the problem you're solving and why it matters]

## Solution

[2-3 sentences describing your solution approach]

### Key Features

- Feature 1
- Feature 2
- Feature 3

---

## Demo

[Link to demo video or GIF]

**Live Demo:** [URL if deployed]

---

## Screenshots

| Feature     | Screenshot                                   |
| ----------- | -------------------------------------------- |
| [Feature 1] | ![Screenshot](docs/screenshots/feature1.png) |
| [Feature 2] | ![Screenshot](docs/screenshots/feature2.png) |

---

## Tech Stack

| Category        | Technology                                  |
| --------------- | ------------------------------------------- |
| Frontend        | Next.js, React Native, Tailwind CSS         |
| Backend         | Convex, Better Auth, TypeScript             |
| Database        | Convex                                      |
| Deployment      | Convex cloud with local web/native dev apps |
| Package Manager | Bun, Turborepo                              |

---

## Getting Started

### Prerequisites

- Bun v1.3+
- Node.js v20 or later
- A Convex account for backend setup

Verify installation:

```bash
bun --version
node -v
```

### Installation

```bash
# Clone the repository
git clone https://github.com/[org]/[repo].git
cd [repo]

# Install dependencies
bun install

# Configure Convex for the backend package
bun run dev:setup
```

Copy environment variables from `packages/backend/.env.local` into the app
`.env` files as needed.

### Running Locally

```bash
# Run the full monorepo
bun run dev

# Or run a single target
bun run dev:web
bun run dev:native
bun run dev:server
```

The web app runs at http://localhost:3001.

### Running Tests

```bash
bun run check
bun run check-types
bun --filter @meditag/backend test
```

---

## API Reference

<details>
<summary>Click to expand API endpoints</summary>

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| GET    | `/api/resource`     | Get all resources   |
| GET    | `/api/resource/:id` | Get resource by ID  |
| POST   | `/api/resource`     | Create new resource |
| PUT    | `/api/resource/:id` | Update resource     |
| DELETE | `/api/resource/:id` | Delete resource     |

</details>

---

## Project Structure

```
.
├── apps/
│   ├── web/            # Next.js web app
│   └── native/         # Expo / React Native app
├── packages/
│   ├── backend/        # Convex functions, schema, and tests
│   ├── config/         # Shared TypeScript config
│   └── env/            # Shared environment helpers
├── scripts/            # Repo utility scripts
├── package.json        # Root workspace scripts
└── README.md
```

---

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### Commit Messages

Use clear, descriptive commit messages:

- `Add user authentication endpoint`
- `Fix database connection timeout issue`
- `Update README with setup instructions`

---

## Acknowledgments

- [Resource/Library/Person]
- [Resource/Library/Person]

---

## License

This project is licensed under the <FILL IN> License - see the [LICENSE](LICENSE) file for details.

---

_CMPE 195A/B - Senior Design Project | San Jose State University | Spring 2026_
