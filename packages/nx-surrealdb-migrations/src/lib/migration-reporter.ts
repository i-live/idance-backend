export function reportDryRun(file: string, direction: string): void {
  console.log(`• Would apply: ${file} (direction: ${direction})`);
}

export function reportStatus(path: string, migration: { number: string; name: string }, status: string, appliedAt: string): void {
  const icon = status === 'up' ? '↑' : status === 'down' ? '↓' : '•';
  console.log(`${icon} ${migration.number}_${migration.name}: ${status} (applied at: ${appliedAt})`);
}