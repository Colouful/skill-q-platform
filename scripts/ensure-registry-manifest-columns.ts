import "dotenv/config";
import { createConnection, type Connection } from "mariadb";

function databaseConfigFromEnv() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) {
    const url = new URL(direct);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      charset: url.searchParams.get("charset") ?? undefined,
    };
  }

  const host = process.env.DB_HOST?.trim();
  const port = Number(process.env.DB_PORT?.trim() || "3306");
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_DATABASE?.trim();

  if (!host || !user || !database) {
    throw new Error(
      "DATABASE_URL 未配置（可设置 DATABASE_URL，或 DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_DATABASE）",
    );
  }

  return {
    host,
    port,
    user,
    password,
    database,
    charset: "utf8mb3",
  };
}

async function ensureColumn(
  conn: Connection,
  tableName: string,
  columnName: string,
  columnSql: string,
): Promise<void> {
  const rows = await conn.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
    `,
    [tableName, columnName],
  );
  const count = Number(rows[0]?.count ?? 0);
  if (count > 0) {
    console.log(`[skip] ${tableName}.${columnName} 已存在`);
    return;
  }

  await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnSql}`);
  console.log(`[ok] 新增列 ${tableName}.${columnName}`);
}

async function ensureIndex(
  conn: Connection,
  tableName: string,
  indexName: string,
  indexSql: string,
): Promise<void> {
  const rows = await conn.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
    `,
    [tableName, indexName],
  );
  const count = Number(rows[0]?.count ?? 0);
  if (count > 0) {
    console.log(`[skip] 索引 ${tableName}.${indexName} 已存在`);
    return;
  }

  await conn.query(`ALTER TABLE \`${tableName}\` ADD INDEX ${indexSql}`);
  console.log(`[ok] 新增索引 ${tableName}.${indexName}`);
}

async function main(): Promise<void> {
  const conn = await createConnection({
    ...databaseConfigFromEnv(),
    multipleStatements: false,
  });

  try {
    await ensureColumn(conn, "skills", "registryId", "`registryId` VARCHAR(255) NULL");
    await ensureColumn(conn, "skills", "manifestId", "`manifestId` VARCHAR(255) NULL");
    await ensureIndex(conn, "skills", "skills_registryId_idx", "`skills_registryId_idx` (`registryId`)");
    await ensureIndex(conn, "skills", "skills_manifestId_idx", "`skills_manifestId_idx` (`manifestId`)");

    await ensureColumn(conn, "rules", "registryId", "`registryId` VARCHAR(255) NULL");
    await ensureColumn(conn, "rules", "manifestId", "`manifestId` VARCHAR(255) NULL");
    await ensureIndex(conn, "rules", "rules_registryId_idx", "`rules_registryId_idx` (`registryId`)");
    await ensureIndex(conn, "rules", "rules_manifestId_idx", "`rules_manifestId_idx` (`manifestId`)");

    await ensureColumn(conn, "role_templates", "registryId", "`registryId` VARCHAR(255) NULL");
    await ensureColumn(conn, "role_templates", "manifestId", "`manifestId` VARCHAR(255) NULL");
    await ensureIndex(
      conn,
      "role_templates",
      "role_templates_registryId_idx",
      "`role_templates_registryId_idx` (`registryId`)",
    );
    await ensureIndex(
      conn,
      "role_templates",
      "role_templates_manifestId_idx",
      "`role_templates_manifestId_idx` (`manifestId`)",
    );

    console.log("[done] registryId / manifestId 字段检查完成。");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("ensure-registry-manifest-columns failed:", error);
  process.exit(1);
});
