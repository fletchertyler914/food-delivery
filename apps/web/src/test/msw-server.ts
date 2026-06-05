import { setupServer } from "msw/node";

import { defaultHandlers } from "./msw-handlers";

// One MSW server for the whole test process. Tests pull this in via
// `import { server } from "../../test/msw-server"` and override
// handlers per case with `server.use(...)`. The lifecycle hooks
// (listen/resetHandlers/close) live in `setup.ts` so individual specs
// don't have to manage them.
export const server = setupServer(...defaultHandlers);
