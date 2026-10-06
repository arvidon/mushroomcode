# Mushroomcode

Terminal coding assistant. The CLI executes file and shell tools in the user's project; the hosted API manages authentication, conversations, model requests, and Polar credits.

The packaged CLI defaults to `https://mushroomcodeserver-production-5a18.up.railway.app` (Polar sandbox demo). Override with `--api-url` for another backend.

## Build a distributable CLI

Requires Bun 1.3.14+ and Node.js 20+.

```sh
bun install --frozen-lockfile
bun run --cwd packages/database db:generate
bun run package:cli
cd out/mushroomcode
npm pack
```

Distribute the resulting `mushroomcode-1.0.0.tgz`. Users install it and run:

```sh
npm install -g ./mushroomcode-1.0.0.tgz
cd their-project
mushroomcode --api-url https://YOUR-RAILWAY-DOMAIN
```

The backend URL is saved in `~/.nightcode/config.json`. Subsequent runs need only `mushroomcode`. Public OAuth settings are fetched from the backend; users do not need server secrets or a project `.env`. Use `/login` and `/upgrade` in the terminal interface. Bun must be on PATH. Native OpenTUI dependencies require platform verification before advertising support.

After publishing the generated package to an npm name you control, users can instead run `npm install -g mushroomcode`. Name ownership and npm authentication must be checked before publication; producing a tarball does not publish it.

## Railway backend

Deploy the repository root using `Dockerfile` and `railway.json`, with a **new PostgreSQL database**. The pre-deploy command applies committed migrations. For an existing database, inspect and baseline its schema before enabling migrations; never reset production data.

Set Railway variables:

- `DATABASE_URL`: Railway PostgreSQL private connection URL.
- `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY`: server-owned provider keys.
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_FRONTEND_API`, `CLERK_OAUTH_CLIENT_ID`.
- `BILLING_MODE=credits`: do not copy local `byok` mode into the hosted release.
- `POLAR_SERVER=sandbox` for demos, `production` for real payments.
- `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, `POLAR_CREDITS_METER_ID`: all from the same Polar environment.

Add `https://YOUR-RAILWAY-DOMAIN/auth/callback` to the Clerk OAuth application's allowed redirect URLs. Use a public OAuth client with PKCE; never ship the OAuth client secret to users. Verify login from a separate machine, a sandbox purchase granting a meter balance, chat streaming, and usage deductions before sharing the service.

Configure the Polar product with a credits benefit tied to the meter and an event filter matching `nightcode_usage`, aggregating its `credits` metadata. The existing gate checks available balance before each chat; it does not reserve usage against concurrent requests.

**Sandbox payments are test payments. OpenAI/Anthropic requests and Railway infrastructure still incur real costs.** Limit demo access and provider spend. Real payments require separate production Polar tokens, products, meters, and benefits; sandbox purchases do not transfer.
