import { MigrationFileProcessor } from './migration-file';
import * as fs from 'fs/promises';

// Mock fs to avoid file system dependencies in tests
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MigrationFileProcessor - Gapped Numbering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findMatchingSubdirectory', () => {
    beforeEach(() => {
      // Mock directory structure with gapped numbering
      mockFs.readdir.mockResolvedValue([
        { name: '000_admin', isDirectory: () => true } as any,
        { name: '010_auth', isDirectory: () => true } as any,
        { name: '020_schema', isDirectory: () => true } as any,
        { name: 'README.md', isDirectory: () => false } as any,
      ]);
    });

    test('should match by number (10) to 010_auth', async () => {
      const result = await MigrationFileProcessor.findMatchingSubdirectory('/test', '10');
      expect(result).toBe('010_auth');
    });

    test('should match by name (auth) to 010_auth', async () => {
      const result = await MigrationFileProcessor.findMatchingSubdirectory('/test', 'auth');
      expect(result).toBe('010_auth');
    });

    test('should match by number (20) to 020_schema', async () => {
      const result = await MigrationFileProcessor.findMatchingSubdirectory('/test', '20');
      expect(result).toBe('020_schema');
    });

    test('should match by name (schema) to 020_schema', async () => {
      const result = await MigrationFileProcessor.findMatchingSubdirectory('/test', 'schema');
      expect(result).toBe('020_schema');
    });

    test('should match by full name (010_auth) to 010_auth', async () => {
      const result = await MigrationFileProcessor.findMatchingSubdirectory('/test', '010_auth');
      expect(result).toBe('010_auth');
    });

    test('should preserve legacy functionality for 000_admin', async () => {
      const result = await MigrationFileProcessor.findMatchingSubdirectory('/test', '0');
      expect(result).toBe('000_admin');
    });

    test('should return null for non-existent pattern', async () => {
      const result = await MigrationFileProcessor.findMatchingSubdirectory('/test', '999');
      expect(result).toBeNull();
    });
  });

  describe('filterMigrationFiles', () => {
    test('should filter migration files correctly', () => {
      const files = [
        '0001_authentication_up.surql',
        '0001_authentication_down.surql',
        '0002_core_users_up.surql',
        '0002_core_users_down.surql',
        'README.md'
      ];

      const upFiles = MigrationFileProcessor.filterMigrationFiles(files, undefined, 'up');
      expect(upFiles).toEqual([
        '0001_authentication_up.surql',
        '0002_core_users_up.surql'
      ]);

      const downFiles = MigrationFileProcessor.filterMigrationFiles(files, undefined, 'down');
      expect(downFiles).toEqual([
        '0002_core_users_down.surql',
        '0001_authentication_down.surql'
      ]);
    });

    test('should filter by pattern', () => {
      const files = [
        '0001_authentication_up.surql',
        '0002_core_users_up.surql'
      ];

      const filtered = MigrationFileProcessor.filterMigrationFiles(files, '0001_authentication', 'up');
      expect(filtered).toEqual(['0001_authentication_up.surql']);
    });
  });

  describe('matchesMigrationPattern', () => {
    test('should match migration patterns correctly', () => {
      // Test number matching
      expect(MigrationFileProcessor.matchesMigrationPattern('0001_authentication_up.surql', '1')).toBe(true);
      expect(MigrationFileProcessor.matchesMigrationPattern('0001_authentication_up.surql', '0001')).toBe(true);
      
      // Test name matching
      expect(MigrationFileProcessor.matchesMigrationPattern('0001_authentication_up.surql', 'authentication')).toBe(true);
      expect(MigrationFileProcessor.matchesMigrationPattern('0001_authentication_up.surql', '1_authentication')).toBe(true);
      expect(MigrationFileProcessor.matchesMigrationPattern('0001_authentication_up.surql', '0001_authentication')).toBe(true);
      
      // Test non-matching
      expect(MigrationFileProcessor.matchesMigrationPattern('0001_authentication_up.surql', '2')).toBe(false);
      expect(MigrationFileProcessor.matchesMigrationPattern('0001_authentication_up.surql', 'users')).toBe(false);
    });
  });
});