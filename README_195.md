# MediTag

> AI-assisted patient verification system using QR/NFC scanning and local-first architecture.

## Team

| Name | GitHub | Email |
|------|--------|-------|
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

| Feature | Screenshot |
|---------|------------|
| [Feature 1] | ![Screenshot](docs/screenshots/feature1.png) |
| [Feature 2] | ![Screenshot](docs/screenshots/feature2.png) |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React Native, React|
| Backend | Node.js, Express, TypeScript|
| Database | PostgreSQL (Docker), Prisma ORM|
| Deployment | Local Docker environment (LAN-based)|
| Package Manager | pnpm (workspace monorepo)|

---

## Getting Started

### Prerequisites

- Node.js v20 or later
- pnpm (npm install -g pnpm)
- Docker Desktop
Verify installation:
```bash
node -v
pnpm -v
docker --version
```

### Installation

```bash
# Clone the repository
git clone https://github.com/[org]/[repo].git
cd [repo]

# Install dependencies
pnpm install

# Start PostgreSQL (Docker)
pnpm db:up

# Run Database Migration
pnpm db:migrate

# Seed Initial Data
pnpm db:seed

# Start Backend Server
pnpm api:dev

Test the API:
http://localhost:3001/health

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations (if applicable)
pnpm db:migrate
```

### Running Locally

```bash
# Development mode
[dev command]

# The app will be available at http://localhost:XXXX
```

### Running Tests

```bash
[test command]
```

---

## API Reference

<details>
<summary>Click to expand API endpoints</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resource` | Get all resources |
| GET | `/api/resource/:id` | Get resource by ID |
| POST | `/api/resource` | Create new resource |
| PUT | `/api/resource/:id` | Update resource |
| DELETE | `/api/resource/:id` | Delete resource |

</details>

---

## Project Structure

```
.
├── src/
│   ├── apps/
│   │   ├── api/        # Backend (Node.js + Express + Prisma)
│   │   ├── mobile/     # React Native application
│   │   └── admin/      # Admin web application
│   │
│   └── packages/       # Shared utilities
│
├── infra/
│   └── docker/         # Docker configuration (PostgreSQL)
│
├── pnpm-workspace.yaml # pnpm monorepo configuration
├── package.json        # Root project scripts
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

*CMPE 195A/B - Senior Design Project | San Jose State University | Spring 2026*
