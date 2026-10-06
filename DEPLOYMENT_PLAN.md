# Mushroomcode deployment plan

## Recommendation and scope

Ship a private, single-user release first. The repository already contains a Bun Dockerfile and Railway configuration, so Railway is the shortest path to a hosted API and PostgreSQL. This plan does not deploy anything or change application behavior.

There is one product decision before implementation: where should code execution happen?

| Usage | Deployment design | Implication |
| --- | --- | --- |
| Edit projects on the user's laptop, like a local coding assistant | Distribute the CLI and run the tool-executing server locally; optionally host PostgreSQL initially | Preserves access to the local repository. Bind the local server to loopback, authenticate it, and keep credentials local. Hosted PostgreSQL still requires a secure connection and local credentials. |
| Edit repositories hosted in the cloud | Railway API + PostgreSQL + persistent workspace volume | Requires server-managed repositories and a CLI workspace selector. Laptop paths cannot be used remotely. |
| Public service for multiple users | Hosted control API + separately isolated execution workers | Requires authentication, ownership enforcement, execution isolation, quotas, and workspace provisioning before release. |

For the hosted pilot below, assume one trusted user working on cloud repositories. If laptop repositories are the main product, prioritize the first row and CLI distribution instead; hosting the current server alone will not deliver that behavior.

## Current state

- Bun workspace monorepo: terminal CLI using OpenTUI/React, Hono API, shared types, Prisma/PostgreSQL database.
- `Dockerfile` pins Bun 1.3.14, installs the root lockfile, builds the server, then starts TypeScript source. The generated bundle is currently unused at runtime.
- `railway.json` already selects Docker builds, `/health`, and restart-on-failure. The server listens on `0.0.0.0` and uses `PORT`.
- Prisma client generation runs through the server's postinstall hook. No committed Prisma migrations were found; only `db:push` and `db:generate` scripts exist.
- The CLI reads `API_URL` and sends `process.cwd()` when creating a session. Tools execute in that path on the API host.
- All sessions currently use `mock-user`; list, read, chat, and resume routes do not enforce authentication or ownership.
- Shell tools inherit all server environment variables, including database and provider credentials. File tools use string-prefix path checks, which do not safely enforce a workspace boundary or prevent symlink escapes.
- Resume coordination is held in a process-local set. Start with one replica; durable concurrency control is needed before scaling, including submit/resume coordination.
- `/health` checks the process only, not database readiness.
- `.dockerignore` excludes environment files and dependencies. Do not inject credentials into the image.

## Phase 1 — Prepare a deployable release

1. **Define workspace behavior.** For cloud repositories, provision repositories under a mounted `/workspaces` directory. Replace caller-supplied `cwd` with a workspace ID resolved by the server. Update the CLI to select that workspace. Validate canonical paths and symlinks against its allowed root. A directory restriction does not sandbox arbitrary shell commands.
2. **Restrict access.** For the private pilot, add a strong bearer token supplied by the CLI on every session/chat request and use one configured identity. For multiple users, use verified identities and enforce ownership on every query and write. Keep the API inaccessible to untrusted users until execution isolation exists.
3. **Contain tool execution.** Run as a non-root user; pass an explicit environment allowlist to commands. Limit execution time, concurrent jobs, and output while it is being read; today's truncation occurs after collecting output. Public execution must move into separate workers with their own workspace mounts, resource limits, restricted network access, and no API/database secrets. Treat trusted single-user co-location as a pilot limitation.
4. **Add migration history.** Generate and review an initial migration against a disposable development database. Commit migrations and a `db:migrate:deploy` script using the installed Prisma 7 CLI. For an existing populated database, baseline it after checking that its schema matches; do not reset it. Use `migrate deploy` in release automation, rather than `db push`.
5. **Make startup explicit.** Verify a clean Linux image build generates Prisma correctly with no developer `.env`. Either start `packages/server/dist/index.js` after verifying its generated-client/runtime dependencies, or deliberately retain source startup and remove the redundant build. Verify `bash`, `grep`, `git`, and project-specific build tools are available.
6. **Add readiness and shutdown handling.** Keep `/health` for liveness, add `/ready` with a bounded database query, and point deployment readiness checks at it. On shutdown, stop accepting work, abort/drain active streams within a defined window, persist interrupted state, and close database connections.
7. **Define operational limits.** Set request size, concurrent chat, context/history, and provider-spend limits. Add redacted request/error logs and basic uptime, failure, latency, and model-use monitoring.

## Phase 2 — Railway staging

1. Create a Railway project with separate staging and production environments. Add PostgreSQL and one API service built from the repository root Dockerfile.
2. Mount a persistent volume at `/workspaces` for the cloud-workspace pilot. Provision repositories at startup or through an authenticated workflow, never during image build. Keep the application code outside the volume.
3. Configure runtime variables:

   | Variable | Location | Purpose |
   | --- | --- | --- |
   | `DATABASE_URL` | API service secret | PostgreSQL connection, preferably over the platform private network |
   | `ANTHROPIC_API_KEY` | API service secret | Required if Anthropic models are offered |
   | `OPENAI_API_KEY` | API service secret | Required if OpenAI models are offered |
   | `PORT` | Platform-provided | API listener |
   | `NODE_ENV=production` | API service | Production mode |
   | `API_AUTH_TOKEN` | API secret + CLI secret; proposed addition | Private-pilot authentication |
   | `WORKSPACE_ROOT=/workspaces` | API service; proposed addition | Allowed workspace location |
   | `API_URL=https://<api-domain>` | CLI configuration | Hosted API endpoint |

4. Add the database migration command as the pre-deploy step. It runs with runtime variables and private-network access; failed commands prevent deployment. Railway pre-deploy containers do not mount volumes, so workspace setup must happen elsewhere. [Railway pre-deploy documentation](https://docs.railway.com/deployments/pre-deploy-command).
5. Enable HTTPS and configure the readiness path. Start with one replica. A volume-attached service has deployment downtime; communicate this and avoid releasing during active tool runs. [Railway healthcheck documentation](https://docs.railway.com/deployments/healthchecks).
6. Test streaming through the actual public endpoint, including a quiet interval near the current 255-second Bun idle timeout. Add SSE heartbeats if needed and verify proxy behavior; do not infer streaming support from a successful health check.

For the pinned Prisma 7 release, pending committed migrations are applied with `prisma migrate deploy`. Revisit commands if upgrading Prisma rather than mixing major-version migration workflows. [Prisma migrate deploy reference](https://docs.prisma.io/docs/cli/migrate/deploy).

## Phase 3 — CLI release

- Add a command entry point, documented installation, version output, and a production run command without watch mode. Currently the CLI package is private and has no `bin` entry or release build.
- Start with a documented Bun/source installation from a tagged release if packaging takes longer. Validate it outside this monorepo before presenting it as a standalone package.
- Add persistent API URL/token configuration and clear connection/authentication errors.
- For cloud execution, expose workspace selection and explain that changes occur in the hosted repository. Provide a supported way to retrieve changes, such as reviewed Git commits/branches.
- Validate OpenTUI runtime/native dependencies on every advertised operating system and architecture before publishing binaries or a registry package. Avoid shipping unnecessary server/database runtime dependencies in the CLI.

## Phase 4 — Verification and production rollout

Release gates:

- A clean Docker build from the committed lockfile succeeds without local secrets or pre-generated files.
- Migrations succeed against an empty database and an existing staging schema; generated-client queries work.
- Missing/invalid authentication is rejected. Session ownership is enforced if more than one identity exists.
- Create session → stream chat → run approved tools → reload history works from an independently installed CLI.
- Paths outside the assigned workspace, sibling-prefix paths, and symlink escapes are rejected by file tools. Execution-worker boundaries are tested separately for a public release.
- PLAN mode exposes no write/shell tools. BUILD mode reads/writes only the intended hosted repository in the pilot workflow.
- Disconnect, cancellation, duplicate requests, server restart, provider errors, and database failures produce coherent session state.
- Workspace files and conversation history survive a redeploy.
- Database and workspace backups are configured and restored successfully to staging. Do not assume workspace files are covered by database backups.

Promote the same verified commit/image to production after a private staging trial. Record its image/revision, migration versions, configuration changes, and smoke-test result. CI should build the image and run the relevant integration checks before a production release; no CI workflow was found in the repository.

## Rollback and operation

- Keep a previous working image/revision available. Roll back the application only when it remains compatible with the migrated schema; use additive schema changes for early releases.
- Treat schema rollback and database restore as separate recovery procedures. Never automatically reset a production database to recover an application deployment.
- Drain active runs before redeployment. After rollback, check database readiness, session history, provider streaming, and workspace persistence.
- Monitor service health continuously: Railway deployment healthchecks are release gates, not a substitute for runtime monitoring.
- Budget separately for API compute, PostgreSQL, persistent storage/backups, and provider usage. Measure representative sessions before choosing a monthly budget; model spend is likely to vary most.

## Implementation order

1. Choose local or hosted repository execution.
2. Implement authentication and the corresponding workspace model.
3. Add migrations, reproducible image startup, readiness, and shutdown behavior.
4. Deploy staging with database and workspace persistence; pass the release gates.
5. Prepare and validate CLI distribution.
6. Enable backups and monitoring; release a private production pilot.
7. Add isolated execution workers, real user ownership, and quotas before opening to public users.

Planning review inspected source and deployment configuration. No build, live deployment, database mutation, or infrastructure provisioning was performed. Existing working-tree changes were left intact.
