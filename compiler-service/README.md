# MZ Compiler Service

This is the separate execution service for MZ Programming Lab. It is intentionally **disabled for native/server languages by default**. A language only appears as supported to the frontend after it is explicitly listed in `MZ_COMPILER_LANGUAGES` and the deployment has passed the test matrix.

## Security boundary

Each request is executed by the Docker CLI in a disposable container with:

- network disabled (`--network none`)
- memory + swap cap
- CPU cap
- process/PID cap
- read-only container root filesystem
- all Linux capabilities dropped
- `no-new-privileges`
- non-root user
- temporary workspace deleted after execution
- stdout/stderr size cap
- request/source/stdin limits
- execution timeout with container kill
- bounded execution queue
- CORS allow-list

This service must run on a separate VPS/worker host. Do not run arbitrary code inside the main Netlify/Vercel application runtime.

## VPS prerequisites

1. Linux VPS (recommended starting point: 2 vCPU / 4 GB RAM).
2. Docker Engine and Docker CLI.
3. Node.js 20+.
4. HTTPS reverse proxy (Caddy/Nginx/Traefik).
5. Firewall allowing only 80/443 publicly; keep the Node port private.

Copy `.env.example`, configure your production origin, then start:

```bash
node --env-file=.env compiler-service/server.mjs
```

Before enabling a language, pull/build and pin the exact runtime image you will use, then run `test/compiler-backend-matrix.mjs` against the deployed service. Only add that language to `MZ_COMPILER_LANGUAGES` after Hello World, stdin/stdout, syntax error, runtime error, timeout, output limit and source-size tests pass.

Frontend configuration:

```env
VITE_COMPILER_API_URL=https://compiler.your-domain.example
```

## Important production hardening

Docker limits reduce risk but are not a complete hostile-code security boundary by themselves. For a public high-volume compiler, prefer dedicated worker nodes plus stronger isolation such as gVisor/Kata/Firecracker, seccomp/AppArmor profiles, image digest pinning, rate limiting, abuse detection and routine patching. Never mount the Docker socket into a public API container.
