/**
 * 从 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_DATABASE 拼 Prisma 用的 DATABASE_URL。
 * 密码中的特殊字符用 encodeURIComponent 处理。供 build-env.sh 与文档说明使用。
 */
const host = process.env.DB_HOST?.trim();
const port = (process.env.DB_PORT?.trim() || "3306").replace(/^\//, "");
const user = process.env.DB_USER?.trim();
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_DATABASE?.trim();

if (!host || !user || !database) {
  process.stdout.write("");
  process.exit(0);
}

const url = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?charset=utf8mb3`;
process.stdout.write(url);
