/**
 * 当 `20260325120000_add_agent_auth` 迁移中途失败时，补齐 `authorAgentId` 等列/索引/FK。
 * 用法：在项目根目录执行 `npm run db:repair-agent-auth`
 * 成功后执行：`npx prisma migrate resolve --applied "20260325120000_add_agent_auth"`
 *
 * 说明：不使用 Prisma 适配器，避免连接池/超时与 dev 环境不一致；`localhost` 会改为 `127.0.0.1`（可用环境变量覆盖）。
 */
import "dotenv/config";
import { createConnection, type Connection } from "mariadb";

function connectionConfigFromDatabaseUrl(): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string | undefined;
  charset?: string;
} {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL 未配置（请在项目根目录配置 .env）");

  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, "") || undefined;
  const charset = u.searchParams.get("charset") ?? undefined;

  let host =
    process.env.DATABASE_REPAIR_HOST?.trim() ||
    process.env.MYSQL_HOST?.trim() ||
    u.hostname;
  if (host === "localhost" || host === "::1") {
    host = "127.0.0.1";
  }

  return {
    host,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
    ...(charset ? { charset } : {}),
  };
}

async function queryCount(conn: Connection, sql: string): Promise<number> {
  const rows = (await conn.query(sql)) as { c: number }[];
  const row = rows[0];
  return Number(row?.c ?? 0);
}

async function columnExists(conn: Connection, table: string, column: string): Promise<boolean> {
  const c = await queryCount(
    conn,
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ${conn.escape(table)}
       AND COLUMN_NAME = ${conn.escape(column)}`,
  );
  return c > 0;
}

async function tableExists(conn: Connection, table: string): Promise<boolean> {
  const c = await queryCount(
    conn,
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ${conn.escape(table)}`,
  );
  return c > 0;
}

async function indexExists(conn: Connection, table: string, indexName: string): Promise<boolean> {
  const c = await queryCount(
    conn,
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ${conn.escape(table)}
       AND INDEX_NAME = ${conn.escape(indexName)}`,
  );
  return c > 0;
}

async function fkExists(conn: Connection, table: string, constraint: string): Promise<boolean> {
  const c = await queryCount(
    conn,
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ${conn.escape(table)}
       AND CONSTRAINT_NAME = ${conn.escape(constraint)}
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
  );
  return c > 0;
}

/** 与 `agents.id` 完全一致（含 utf8mb3），避免外键 3780 incompatible */
async function resolveAuthorAgentColumnSql(conn: Connection): Promise<string> {
  const rows = (await conn.query(
    `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, CHARACTER_SET_NAME, COLLATION_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agents' AND COLUMN_NAME = 'id'`,
  )) as Array<{
    DATA_TYPE: string;
    CHARACTER_MAXIMUM_LENGTH: number | null;
    CHARACTER_SET_NAME: string | null;
    COLLATION_NAME: string | null;
  }>;
  const r = rows[0];
  if (!r) throw new Error("无法读取 agents.id 列定义");
  const dt = r.DATA_TYPE.toLowerCase();
  if (dt === "varchar" && r.CHARACTER_MAXIMUM_LENGTH) {
    const charset =
      r.CHARACTER_SET_NAME && r.COLLATION_NAME
        ? ` CHARACTER SET ${r.CHARACTER_SET_NAME} COLLATE ${r.COLLATION_NAME}`
        : "";
    return `VARCHAR(${r.CHARACTER_MAXIMUM_LENGTH})${charset} NULL`;
  }
  throw new Error(`不支持的 agents.id 类型: ${r.DATA_TYPE}`);
}

async function main() {
  const base = connectionConfigFromDatabaseUrl();

  let conn: Connection;
  try {
    conn = await createConnection({
      ...base,
      connectTimeout: 60_000,
      socketTimeout: 120_000,
    });
  } catch (e) {
    console.error(
      "\n无法连接数据库。请确认：\n" +
        "  1) MySQL/MariaDB 已启动；\n" +
        "  2) DATABASE_URL 中主机/端口/账号正确；\n" +
        "  3) 若仍失败，可设置 DATABASE_REPAIR_HOST=127.0.0.1 或本机实际 IP。\n",
    );
    throw e;
  }

  try {
    await conn.query("SELECT 1");

    if (!(await tableExists(conn, "agents"))) {
      throw new Error(
        "表 `agents` 不存在：请先执行完整迁移 `npx prisma migrate deploy`，或从备份恢复后再试。",
      );
    }

    const authorAgentSql = await resolveAuthorAgentColumnSql(conn);

    const tables = ["skills", "rules", "reviews"] as const;
    for (const t of tables) {
      if (!(await columnExists(conn, t, "authorAgentId"))) {
        await conn.query(
          `ALTER TABLE \`${t}\` ADD COLUMN \`authorAgentId\` ${authorAgentSql}`,
        );
        console.log(`已添加 ${t}.authorAgentId（与 agents.id 对齐）`);
      } else {
        await conn.query(
          `ALTER TABLE \`${t}\` MODIFY COLUMN \`authorAgentId\` ${authorAgentSql}`,
        );
        console.log(`已对齐 ${t}.authorAgentId 与 agents.id（字符集/排序规则）`);
      }

      const idx = `${t}_authorAgentId_idx`;
      if (!(await indexExists(conn, t, idx))) {
        await conn.query(`CREATE INDEX \`${idx}\` ON \`${t}\`(\`authorAgentId\`)`);
        console.log(`已创建索引 ${idx}`);
      }

      const fk = `${t}_authorAgentId_fkey`;
      if (!(await fkExists(conn, t, fk))) {
        await conn.query(
          `ALTER TABLE \`${t}\` ADD CONSTRAINT \`${fk}\` FOREIGN KEY (\`authorAgentId\`) REFERENCES \`agents\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`,
        );
        console.log(`已添加外键 ${fk}`);
      }
    }

    console.log("\n完成。若 `_prisma_migrations` 中该迁移仍为失败状态，请执行：");
    console.log(
      '  npx prisma migrate resolve --applied "20260325120000_add_agent_auth"',
    );
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
