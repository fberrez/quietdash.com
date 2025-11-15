# @quietdash/api-client

Auto-generated TypeScript API client from OpenAPI specification.

## How it works

1. The NestJS API generates an OpenAPI spec file (`openapi.json`)
2. This package uses `openapi-typescript-codegen` to generate type-safe API client code
3. The generated client is used by the frontend application

## Regenerating the client

```bash
# From the root of the monorepo
pnpm generate:api-client
```

This will:
1. Build the API to generate the OpenAPI spec
2. Generate the TypeScript client code in this package

## Usage

```typescript
import { DefaultService } from '@quietdash/api-client';

// The client will be configured in the frontend app
const response = await DefaultService.authControllerLogin({
  email: 'user@example.com',
  password: 'password',
});
```
