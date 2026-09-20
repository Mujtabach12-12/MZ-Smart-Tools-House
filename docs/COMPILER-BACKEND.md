# MZ Programming Lab — secure compiler backend contract

The React application **does not execute arbitrary C/C++/Python/Java/etc. code on the Netlify function or main application server**. Browser JavaScript is isolated in a Web Worker and the HTML/CSS/JS playground runs in a sandboxed iframe with a restrictive CSP.

Compiled/runtime languages require a separate execution service configured through `VITE_COMPILER_API_URL`.

## API

### `GET /status`
Return the exact languages that are currently executable:

```json
{ "languages": ["c", "cpp", "python", "java"] }
```

A language is shown as backend-connected only when it appears in this response.

### `POST /execute`
Request:

```json
{
  "language": "cpp",
  "source": "#include <iostream> ...",
  "stdin": "5 7\n",
  "limits": { "timeoutMs": 5000 }
}
```

Response:

```json
{ "stdout": "12\n", "stderr": "", "exitCode": 0, "durationMs": 81 }
```

Compiler errors must be returned in `stderr` with the real non-zero exit code. Never generate simulated output.

## Required isolation

Each run must execute in a disposable sandbox/container, separate from the web server. Enforce all of the following at the infrastructure boundary:

- hard wall-clock timeout and CPU quota
- memory limit and OOM termination
- PID/process count limit
- read-only base filesystem plus a small temporary working directory
- no host filesystem mounts
- no Docker socket or cloud metadata access
- network disabled by default
- non-root user, dropped Linux capabilities, `no-new-privileges`
- syscall filtering (seccomp) and namespace isolation
- output-size limits for stdout/stderr
- source/input size limits and rate limiting
- cleanup after every run
- per-request identifiers and server-side audit logs without storing source longer than required

A production implementation should use a purpose-built sandbox service (for example isolated containers/microVMs) behind an authenticated/rate-limited API. Netlify Functions are not an appropriate place to run untrusted native code directly.
