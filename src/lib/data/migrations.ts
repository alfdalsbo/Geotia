type SqlClient = ReturnType<typeof import("@neondatabase/serverless").neon>;

export const postgresSchemaMigrations = [
  {
    id: "202605220001_bootstrap_protocol_tables",
    description: "Create Geotia protocol tables and JSONB payload columns.",
  },
  {
    id: "202605220002_protocol_indexes_and_constraints",
    description: "Add operational indexes and guardrails for status and numbering fields.",
  },
  {
    id: "202605220003_runtime_cache_tables",
    description: "Create runtime cache and SlowGeo used-challenge tracking tables.",
  },
] as const;

export async function recordAppliedSchemaMigrations(sql: SqlClient) {
  const timestamp = new Date().toISOString();
  for (const migration of postgresSchemaMigrations) {
    await sql`
      INSERT INTO geotia_meta (key, value, updated_at)
      VALUES (${`schema:migration:${migration.id}`}, ${migration.description}, ${timestamp})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `;
  }
}
