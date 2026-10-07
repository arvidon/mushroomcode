# 🍄 Mushroomcode

**Explore, plan, and build software from your terminal.**

Mushroomcode is a terminal coding assistant that combines conversation, model selection, and project tools in one interface. Ask it to explain a codebase, investigate a bug, or implement a change while staying inside your project directory.

The terminal interface and coding tools run on your laptop. A hosted backend handles model requests, authentication, conversation storage, and credit billing.

> **Current release: hosted sandbox demo.** Install from the provided tarball; the package has not yet been published to npm. Polar purchases use test payments. Model API calls and hosting still incur real costs for the service operator.

## Contents

- [Install](#install)
- [Start your first session](#start-your-first-session)
- [Commands and modes](#commands-and-modes)
- [Architecture](#architecture)
- [Authentication and configuration](#authentication-and-configuration)
- [How billing works](#how-billing-works)
- [Run from source](#run-from-source)
- [Package and distribute](#package-and-distribute)
- [Deploy the backend](#deploy-the-backend)
- [Troubleshooting](#troubleshooting)

## Install

### Requirements

| Requirement | Purpose |
| --- | --- |
| Node.js 20+ and npm | Install the global command and run its launcher |
| Bun 1.3.14+ on `PATH` | Run the terminal application |
| Interactive terminal | Display the OpenTUI interface |
| Browser and internet connection | Sign in and connect to the backend |
| Bash | Execute shell tools in Build mode |

Install the runtimes from [Node.js](https://nodejs.org/) and [Bun](https://bun.sh/), then verify:

```sh
node --version
npm --version
bun --version
```

Installation has been verified on macOS Apple Silicon. Linux and Windows have not yet been validated for this release. OpenTUI uses native platform packages; test each intended platform before advertising support.

### Install the current release

Obtain `mushroomcode-1.0.0.tgz` from the maintainer and copy it onto your laptop. From the directory containing the file:

```sh
npm install -g ./mushroomcode-1.0.0.tgz
mushroomcode --version
```

The repository's package builder produces this file at `out/mushroomcode/mushroomcode-1.0.0.tgz`. Installing the tarball gives you the `mushroomcode` command without requiring a source checkout or local database. Bun must be installed separately.

**After npm publication**, installation will be:

```sh
npm install -g mushroomcode
```

That registry command is not the current installation method.

## Start your first session

1. Open a terminal in the project you want to work on:

   ```sh
   cd /path/to/your-project
   mushroomcode
   ```

2. Type `/login` to sign in through your browser. The updated CLI also starts login when you submit a prompt without a saved login for the selected backend.
3. Use `/upgrade` if the hosted service requires credits. The current demo uses Polar sandbox checkout.
4. Select a model with `/models` and a mode with `/agents`.
5. Describe your task. For example:

   ```text
   Explain how this project is organized and where requests enter the app.
   ```

   ```text
   Investigate why login fails. Start with a plan before changing files.
   ```

   ```text
   Add validation to the signup endpoint and run the relevant tests.
   ```

Run Mushroomcode from the directory you want its tools to use. Build mode can edit files and execute shell commands as your operating-system user. Review changes with your normal Git workflow.

### Connect to another backend

The packaged command defaults to the hosted demo:

```text
https://mushroomcodeserver-production-5a18.up.railway.app
```

To use another server:

```sh
mushroomcode --api-url https://your-backend.example.com
```

The URL is saved for subsequent runs. Remote backends require HTTPS; loopback HTTP is allowed for development:

```sh
mushroomcode --api-url http://localhost:3000
```

Changing backends requires a login for the new backend. The CLI does not start a local server automatically.

## Commands and modes

| Command | Action |
| --- | --- |
| `/new` | Start a new conversation |
| `/login` | Sign in through your browser |
| `/logout` | Clear the saved login |
| `/models` | Choose a model |
| `/agents` | Choose Plan or Build mode |
| `/sessions` | Browse saved conversations |
| `/theme` | Change the terminal theme |
| `/upgrade` | Open the credits checkout |
| `/usage` | Open the Polar billing portal |
| `/exit` | Exit Mushroomcode |

Press **Tab** in the prompt input to switch modes. The input also supports project path mentions using `@`.

| Mode | Tools | Use it for |
| --- | --- | --- |
| **Plan** | Read files, list directories, search contents, find paths | Understanding code and planning changes |
| **Build** | All Plan tools, plus write files, edit files, execute shell commands | Implementing and testing changes |

The model catalog lives in [`packages/shared/src/models.ts`](packages/shared/src/models.ts). It currently includes GPT-5.4 variants and Claude Sonnet 4.6, Haiku 4.5, and Opus 4.6. Each model requires its provider's credentials on the backend. The default is Claude Opus 4.6; select an OpenAI model when using a backend configured only with an OpenAI key.

## Architecture

```mermaid
flowchart LR
    User[User in a project directory] --> CLI[Terminal CLI]
    CLI -->|Authenticated requests| API[Hosted API]
    API -->|Streamed responses and tool calls| CLI
    CLI -->|Execute tools locally| Files[Local files and shell]
    Files -->|Tool results| CLI
    CLI -->|Results for continuation| API
    API --> Models[OpenAI / Anthropic]
    API --> DB[(PostgreSQL)]
    CLI -->|Browser sign-in with PKCE| Clerk[Clerk OAuth]
    API -->|Verify tokens| Clerk
    API -->|Credit balance and usage events| Polar[Polar]
```

### Repository structure

```text
mushroomcode/
├── packages/
│   ├── cli/          Terminal UI, authentication, and local tools
│   ├── server/       HTTP API, model streaming, sessions, and billing
│   ├── shared/       Models, schemas, modes, and tool contracts
│   └── database/     Prisma client, schema, and migrations
├── scripts/          CLI packaging
├── Dockerfile        Backend container build
├── railway.json      Backend deployment configuration
└── .env.example      Local server configuration template
```

| Layer | Technology | Responsibility |
| --- | --- | --- |
| CLI | Bun, React, OpenTUI | Terminal rendering, local tools, login, streamed messages |
| API | Bun, Hono, AI SDK | Authentication, ownership checks, model requests, streaming |
| Contracts | TypeScript, Zod | Shared validation, modes, models, and tool definitions |
| Database | Prisma, PostgreSQL | Persist sessions and conversation messages |
| Identity | Clerk OAuth | Browser sign-in and token verification |
| Billing | Polar | Checkout, credit benefits, balances, and usage deductions |

### What happens when you send a prompt

1. The CLI submits a message with your selected mode and model.
2. The API verifies your Clerk token, enforces session ownership, and checks credits when credit billing is enabled.
3. The API calls the model and streams its response to the terminal.
4. When the model requests a tool, the CLI executes it in your current project directory.
5. The CLI returns the tool output so the model can continue.
6. The API stores completed conversation state and records billable usage when applicable.

**Local execution does not mean all data stays local.** Prompts, file contents returned by tools, and tool output can be sent to the backend and model provider. Conversation messages and tool results can be persisted in PostgreSQL. Provider API keys and billing credentials belong on the server, not in the distributed CLI.

The shell tool runs with your local permissions and environment. Plan mode omits write and shell tools; Build mode is not an isolated execution sandbox.

## Authentication and configuration

The CLI uses Clerk OAuth with PKCE. A temporary loopback callback server receives the sign-in result through the backend's `/auth/callback` route. Protected requests send the saved access token as a bearer token.

CLI state lives under `~/.nightcode/`:

| File | Contents |
| --- | --- |
| `config.json` | Saved backend URL |
| `auth.json` | Access token and its associated backend URL |

The legacy directory name is retained for compatibility. Do not share `auth.json`. Switching backends requires a fresh login; older unscoped tokens also require signing in again.

For the packaged command, backend selection follows this order:

1. `--api-url` argument.
2. Exported `API_URL` environment variable.
3. Saved URL in `config.json`.
4. Built-in hosted demo URL.

The npm launcher disables automatic project `.env` loading. Configure the installed command with `--api-url` or an exported environment variable. Source development commands use Bun's normal environment loading.

The packaged CLI fetches public OAuth settings from `/config`. Hosted users do not need server secrets, provider keys, or a PostgreSQL connection string.

## How billing works

**Polar credits authorize app usage. The backend's OpenAI or Anthropic API account pays for model execution.** App credits do not fund or transfer money to the provider account.

| Server setting | Behavior |
| --- | --- |
| `BILLING_MODE=credits` | Check Polar balance before session creation or chat; record usage afterward |
| `BILLING_MODE=byok` | Skip Polar checks and deductions; use the provider keys configured on that server |

The default when unset is `credits`. Use `byok` for a personal local backend. On a shared hosted backend, it removes the credit gate for all authenticated users while charging the operator's provider account.

The implementation estimates cost using model-catalog input/output token rates and converts that estimate to internal credits, rounding up. The current conversion is $0.01 per internal credit. Product prices and benefit quantities are configured separately in Polar: a product's dollar price does not automatically determine its credit quantity.

### Sandbox payments

The hosted demo uses `POLAR_SERVER=sandbox`. Test purchases can grant credits without collecting real money, but model requests still incur real provider costs.

Real payments require separate production Polar credentials, products, benefits, and meters. Sandbox purchases and balances do not transfer to production.

The product's credits benefit must target the same meter as `POLAR_CREDITS_METER_ID`. That meter must filter events named `nightcode_usage` and sum the `credits` metadata field. Purchasing credits on another meter will not satisfy the server's balance check.

## Run from source

### 1. Clone and install

```sh
git clone https://github.com/arvidon/mushroomcode.git
cd mushroomcode
bun install --frozen-lockfile
cp .env.example .env
```

Use a checkout containing the latest fixes. A local tarball or CLI-uploaded deployment can be newer than the repository's published branch.

### 2. Configure your server

Edit `.env` with your own values:

```dotenv
API_URL=http://localhost:3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/mushroomcode

# Configure the providers you intend to use.
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Authentication is required even with Polar billing disabled.
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_FRONTEND_API=https://your-instance.clerk.accounts.dev
CLERK_OAUTH_CLIENT_ID=your_public_oauth_client_id

# Personal local development without the credits gate.
BILLING_MODE=byok
```

Create a public Clerk OAuth application supporting PKCE and the `openid`, `email`, and `profile` scopes. Register the exact redirect URL:

```text
http://localhost:3000/auth/callback
```

`CLERK_FRONTEND_API` must be the base origin, without `/.well-known/openid-configuration`. Never distribute Clerk secrets or an OAuth client secret.

For credit-billing development, set `BILLING_MODE=credits` and fill in the Polar settings in [`.env.example`](.env.example).

### 3. Initialize a new database

Create the PostgreSQL database referenced by `DATABASE_URL`, then run:

```sh
bun run --cwd packages/database db:generate
bun run --cwd packages/database db:migrate:deploy
```

These commands assume a new database or one already managed by the committed migration history. If you previously used `db:push` against a populated database, inspect and baseline it before applying the initial migration. Do not reset a database containing data you need.

### 4. Start the application

In one terminal:

```sh
bun run dev:server
```

In another terminal, from the repository root:

```sh
bun run dev:cli
```

The source CLI uses the repository as its tool working directory. To work on another project with your local server, install the packaged command, enter that project's directory, and run:

```sh
mushroomcode --api-url http://localhost:3000
```

### Development commands

| Command | Purpose |
| --- | --- |
| `bun run dev:server` | API with hot reload |
| `bun run dev:cli` | Source CLI in watch mode |
| `bun run build` | Build the server bundle |
| `bun run start` | Start the server from source without hot reload |
| `bun run package:cli` | Stage the standalone CLI package |
| `bun run --cwd packages/database db:generate` | Generate the Prisma client |
| `bun run --cwd packages/database db:migrate:deploy` | Apply committed migrations |
| `bunx tsc --noEmit -p packages/cli/tsconfig.json` | Check CLI types |
| `bunx tsc --noEmit -p packages/server/tsconfig.json` | Check server types |

## Package and distribute

From the repository root:

```sh
bun run package:cli
cd out/mushroomcode
npm pack
```

The builder bundles the CLI and shared workspace code, declares external runtime dependencies, and adds the `mushroomcode` command. It does not include your `.env`, database client, or backend secrets.

Distribute the tarball and test installation on a clean machine. Hosted users need neither a source checkout nor a local PostgreSQL database.

To publish, authenticate to npm, verify ownership of the package name, and publish **from the generated package directory**:

```sh
npm login
npm publish --access public
```

Do not publish the repository root as the CLI release. Update the version consistently before publishing another version. Publishing the CLI does not deploy the backend.

## Deploy the backend

Deploy the **API and PostgreSQL** to Railway. The CLI is distributed to users, not hosted as a separate web service. The `packages/database` workspace contains application code; it is not a PostgreSQL server.

Use the repository root as the build context with [`Dockerfile`](Dockerfile). It installs the frozen Bun lockfile, explicitly generates Prisma using the installed version, and builds the server. [`railway.json`](railway.json) defines migrations, production startup, and database readiness checks.

### Server environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL; prefer the Railway private database reference |
| `PORT` | Listener port assigned by the platform |
| `OPENAI_API_KEY` | Required for OpenAI models |
| `ANTHROPIC_API_KEY` | Required for Anthropic models |
| `CLERK_SECRET_KEY` | Verify OAuth tokens |
| `CLERK_PUBLISHABLE_KEY` | Clerk instance configuration |
| `CLERK_FRONTEND_API` | Clerk base origin exposed to the CLI |
| `CLERK_OAUTH_CLIENT_ID` | Public OAuth application client ID |
| `BILLING_MODE` | `credits` for the hosted credit-billing service |
| `POLAR_SERVER` | `sandbox` or `production` |
| `POLAR_ACCESS_TOKEN` | Token from the selected Polar environment |
| `POLAR_PRODUCT_ID` | Product offered by `/upgrade` |
| `POLAR_CREDITS_METER_ID` | Meter used by the product's credits benefit |

### Deployment sequence

1. Provision PostgreSQL and an API service.
2. Configure the server variables. Do not blindly copy local `BILLING_MODE=byok` into a shared service.
3. Build from the repository root using the Dockerfile.
4. Run `bun run --cwd packages/database db:migrate:deploy` before deployment.
5. Start with `bun run start`, avoiding inherited development commands.
6. Route the HTTPS domain to the port actually assigned by Railway.
7. Register `https://YOUR-BACKEND/auth/callback` in the Clerk OAuth application's redirect URLs.
8. Verify readiness, login, session creation, a credit purchase, chat streaming, local tools, and usage deductions.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Process liveness |
| `GET /ready` | Database and session-table readiness |
| `GET /config` | Public OAuth settings and sandbox billing indicator |
| `/auth/callback` | Relay the OAuth result to the local CLI |
| `/sessions` | Authenticated conversation storage |
| `POST /chat` | Authenticated model streaming |
| `/billing/checkout` | Authenticated credit checkout |
| `/billing/portal` | Authenticated billing portal |

A CLI upload deploys local files without committing or pushing them. Keep the GitHub branch current before reconnecting automatic deployments. The demo server's outdated GitHub source was disconnected after it repeatedly rebuilt old code.

The current credit gate checks balance without reserving funds for concurrent requests. Usage-ingestion failures are logged rather than retried durably. Add concurrency limits, spend controls, and reliable usage reconciliation before a broad paid launch.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `mushroomcode: command not found` | Verify global installation and npm's executable directory on `PATH` |
| Bun is missing | Install Bun and verify `bun --version` in the same terminal |
| Backend configuration fails | Check the selected URL, internet access, server health, and Clerk settings |
| Unauthorized after changing servers | Run `/login`; saved tokens are scoped to a backend URL |
| Clerk sign-in page is missing | Use the Clerk base origin without the discovery-document path |
| OAuth redirect mismatch | Register the exact callback URL, including scheme, hostname, and port |
| Payment succeeds but credits are unavailable | Match the product benefit's meter to the server setting; verify the Polar environment and purchasing customer identity |
| Provider reports insufficient quota | Check the backend's provider account; Polar credits do not fund its API balance |
| Local billing change has no effect | The CLI is connected to a hosted server, whose environment controls billing |
| Local server cannot start | Check required configuration and whether port 3000 is occupied |
| Railway returns 502 | Check startup and the public domain's target port |
| Prisma generation fails in Railway | Deploy the current scripts; avoid downloading an unpinned CLI during workspace postinstall |

For local issues, inspect the server terminal output. For hosted issues, inspect Railway build and deployment logs. Never include API keys, access tokens, or database credentials in bug reports.
