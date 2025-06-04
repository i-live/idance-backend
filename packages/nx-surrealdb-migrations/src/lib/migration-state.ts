import { SurrealDBClient } from './client';

export async function tableExists(client: SurrealDBClient, tableName: string): Promise<boolean> {
  try {
    await client.query(`SELECT * FROM ${tableName} LIMIT 1;`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('table does not exist')) {
      console.warn(`Table ${tableName} does not exist.`);
      return false;
    }
    console.warn(`Failed to check if table ${tableName} exists: ${error}`);
    return false;
  }
}

export async function getLatestMigrationState(client: SurrealDBClient, number: string, path: string): Promise<string | null> {
  const exists = await tableExists(client, 'migration_history');
  if (!exists) {
    console.warn('migration_history table does not exist. Treating migration as unapplied.');
    return null;
  }
  try {
    const result = await client.query(
      "SELECT direction, applied_at FROM migration_history WHERE migration_number = $number AND migration_path = $path ORDER BY applied_at DESC LIMIT 1",
      { number, path }
    );
    return result[0]?.result?.[0]?.direction || null;
  } catch (error) {
    console.warn(`Schema error: Failed to order by applied_at (${error.message}). Using latest record without ordering.`);
    const result = await client.query(
      "SELECT direction FROM migration_history WHERE migration_number = $number AND migration_path = $path LIMIT 1",
      { number, path }
    );
    return result[0]?.result?.[0]?.direction || null;
  }
}

export async function hasPriorMigrations(client: SurrealDBClient, path: string): Promise<boolean> {
  const exists = await tableExists(client, 'migration_history');
  if (!exists) {
    console.warn('migration_history table does not exist. Skipping prior migrations check.');
    return false;
  }
  const history = await client.query(
    "SELECT migration_number, migration_path FROM migration_history WHERE migration_path = $path LIMIT 1",
    { path }
  );
  return history[0]?.result?.length > 0;
}