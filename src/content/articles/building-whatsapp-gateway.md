# Building a WhatsApp API Gateway with MCP Server Integration

## Why another WhatsApp gateway?

OpenWA is good. 10k+ stars, pluggable architecture, multi-session support. But it lacked two things I needed: AI agent integration and proper Docker security.

The idea was simple: let Claude or Cursor drive WhatsApp directly. Not through a custom chatbot, but through the Model Context Protocol — the same standard that lets AI agents call any tool.

## Architecture overview

Whatbot runs on NestJS 11.x with 23 modules. The key insight is the engine abstraction layer:

```
whatsapp-web.js (default)
        ↕
IWhatsAppEngine interface
        ↕
    Baileys (browser-free)
```

Both adapters implement the same interface. Application code never sees engine-specific types. The neutral JID dialect folds `@s.whatsapp.net` into `@c.us` and handles privacy IDs (`@lid`) transparently.

## MCP Server deep dive

The MCP server mounts at `/mcp` as a stateless Streamable-HTTP transport. It exposes ~39 curated tools — a focused surface so agents aren't overwhelmed.

```typescript
// Example: sending a message via MCP
McpModule.forRoot({
  basePath: '/mcp',
  serverInfo: { name: 'whatbot', version },
})
```

Every tool call goes through the same API-key auth, role, and per-session scoping as REST. Destructive operations stay off the agent path.

**Security guidance:**

-   Mint a dedicated, least-privilege key for the agent
-   Set `MCP_READONLY=true` for read-only access
-   Rate limit with `MCP_RATE_LIMIT_MAX`
-   Don't expose `/mcp` to public internet without a proxy

## Docker security hardening

The production stack never exposes `/var/run/docker.sock` directly. A dedicated `docker-proxy` sidecar gates only the operations needed for container orchestration:

```
whatbot-api  ──TCP 2375──▶  docker-proxy  ──unix──▶  /var/run/docker.sock
```

Non-root container execution follows this chain:

```
dumb-init (PID 1)
  └─ docker-entrypoint.sh (root — fixes named-volume ownership)
       └─ gosu whatbot node dist/main  (drops to whatbot user)
```

No `su` or `sudo` wrappers. The node process is the direct child of dumb-init.

## Lessons learned

**What worked:** The engine abstraction. Swapping between whatsapp-web.js and Baileys is a config change. The MCP server was surprisingly straightforward once the tool registry was in place.

**What didn't:** The plugin system took three redesigns. Early versions were too permissive — sandbox routing and capability gates came later.

**What's next:** OAuth 2.1 for public MCP exposure. Currently uses static API keys which are fine for self-hosted but not for SaaS deployments.
