
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      JWT_SECRET: "elitelance-test-secret-not-for-production",
      NODE_ENV: "test",
    },
  },
});
