import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const scriptPath = path.resolve(__dirname, "prisma-generate-if-needed.cjs");
const scriptSource = fs.readFileSync(scriptPath, "utf8");

class ScriptExit extends Error {
  code: number;

  constructor(code: number) {
    super(`exit:${code}`);
    this.code = code;
  }
}

type ScriptRunOptions = {
  env?: NodeJS.ProcessEnv;
  existsSync?: (file: string) => boolean;
  readFileSync?: (file: string, encoding: string) => string;
  hostname?: string;
};

function runScript(options: ScriptRunOptions = {}) {
  const spawnCalls: Array<{
    command: string;
    args: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  }> = [];
  const writes: string[] = [];

  const sandbox = {
    __dirname: path.dirname(scriptPath),
    process: {
      env: options.env ?? {},
      platform: "linux",
      stdout: {
        write(message: string) {
          writes.push(message);
        },
      },
      exit(code: number) {
        throw new ScriptExit(code);
      },
    },
    require(specifier: string) {
      if (specifier === "node:fs") {
        return {
          existsSync:
            options.existsSync ??
            ((file: string) =>
              file.endsWith("/src/generated/prisma/client.js") ||
              file.endsWith("/src/generated/prisma/index.js") ||
              file.endsWith("/src/generated/prisma/index.d.ts") ||
              file.endsWith("/src/generated/prisma/schema.prisma")),
          readFileSync:
            options.readFileSync ??
            ((file: string, encoding: string) => {
              if (file === scriptPath) {
                return fs.readFileSync(file, encoding);
              }

              if (file === "/proc/1/cgroup") {
                return "0::/\n";
              }

              throw new Error(`unexpected readFileSync: ${file}`);
            }),
        };
      }

      if (specifier === "node:path") {
        return require("node:path");
      }

      if (specifier === "node:child_process") {
        return {
          spawnSync(command: string, args: string[], spawnOptions: { cwd?: string; env?: NodeJS.ProcessEnv }) {
            spawnCalls.push({ command, args, cwd: spawnOptions.cwd, env: spawnOptions.env });
            return { status: 0 };
          },
        };
      }

      if (specifier === "node:os") {
        return {
          hostname: () => options.hostname ?? "local-dev-host",
        };
      }

      throw new Error(`unexpected require: ${specifier}`);
    },
    module: { exports: {} },
    exports: {},
  };

  try {
    vm.runInNewContext(scriptSource, sandbox, { filename: scriptPath });
    return { exitCode: 0, spawnCalls, writes };
  } catch (error) {
    if (error instanceof ScriptExit) {
      return { exitCode: error.code, spawnCalls, writes };
    }

    throw error;
  }
}

describe("prisma-generate-if-needed", () => {
  it("skips prisma generate in BuildKit when bundled client is already present", () => {
    const result = runScript({
      env: {},
      hostname: "buildkitsandbox",
    });

    expect(result.exitCode).toBe(0);
    expect(result.spawnCalls).toHaveLength(0);
    expect(result.writes.join("")).toContain("跳过 prisma generate");
  });

  it("still runs prisma generate on a local development machine", () => {
    const result = runScript({
      env: {},
      hostname: "my-local-machine",
      existsSync: () => false,
    });

    expect(result.exitCode).toBe(0);
    expect(result.spawnCalls).toHaveLength(1);
    expect(result.spawnCalls[0]).toMatchObject({
      command: "npx",
      args: ["prisma", "generate"],
    });
  });

  it("respects SKIP_PRISMA_POSTINSTALL before any runtime detection", () => {
    const result = runScript({
      env: {
        SKIP_PRISMA_POSTINSTALL: "1",
      },
      hostname: "my-local-machine",
      existsSync: () => false,
    });

    expect(result.exitCode).toBe(0);
    expect(result.spawnCalls).toHaveLength(0);
    expect(result.writes.join("")).toContain("SKIP_PRISMA_GENERATE / SKIP_PRISMA_POSTINSTALL");
  });
});
