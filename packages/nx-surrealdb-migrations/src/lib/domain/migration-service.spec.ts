import * as fs from 'fs/promises';
import { MigrationService, MigrationServiceOptions } from './migration-service';
import { SurrealDBClient } from '../infrastructure/client';
import { MigrationRepository } from './migration-repository';
import { DependencyResolver } from './dependency-resolver';

jest.mock('fs/promises');
jest.mock('../infrastructure/client');
jest.mock('./migration-repository');
jest.mock('./dependency-resolver');
jest.mock('../infrastructure/env', () => ({
  replaceEnvVars: jest.fn((str) => str),
  loadEnvFile: jest.fn()
}));
jest.mock('../infrastructure/project', () => ({
  resolveProjectPath: jest.fn((ctx, path) => `/resolved/${path}`)
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const MockSurrealDBClient = SurrealDBClient as jest.MockedClass<typeof SurrealDBClient>;
const MockMigrationRepository = MigrationRepository as jest.MockedClass<typeof MigrationRepository>;
const MockDependencyResolver = DependencyResolver as jest.MockedClass<typeof DependencyResolver>;

describe('MigrationService', () => {
  let engine: MigrationService;
  let mockClient: jest.Mocked<SurrealDBClient>;
  let mockRepository: jest.Mocked<MigrationRepository>;
  let mockResolver: jest.Mocked<DependencyResolver>;

  const defaultOptions: MigrationServiceOptions = {
    url: 'ws://localhost:8000',
    user: 'root',
    pass: 'root',
    namespace: 'test',
    database: 'test',
    initPath: 'database'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockRepository = {
      initialize: jest.fn().mockResolvedValue(undefined),
      canApplyMigration: jest.fn().mockResolvedValue({ canApply: true }),
      addMigration: jest.fn().mockResolvedValue(undefined),
      getMigrationsByDirectionAndPath: jest.fn().mockResolvedValue([])
    } as any;

    mockResolver = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getAllModules: jest.fn().mockReturnValue(['000_admin', '010_auth']),
      getExecutionOrder: jest.fn().mockReturnValue(['000_admin', '010_auth']),
      getRollbackOrder: jest.fn().mockReturnValue(['010_auth', '000_admin']),
      validateRollback: jest.fn().mockReturnValue({ canRollback: true, blockedBy: [] }),
      getModuleDependencies: jest.fn().mockReturnValue([]),
      getModuleDependents: jest.fn().mockReturnValue([])
    } as any;

    MockSurrealDBClient.mockImplementation(() => mockClient);
    MockMigrationRepository.mockImplementation(() => mockRepository);
    MockDependencyResolver.mockImplementation(() => mockResolver);

    engine = new MigrationService();
  });

  afterEach(async () => {
    await engine.close();
  });

  describe('initialization', () => {
    it('should initialize with basic options', async () => {
      await engine.initialize(defaultOptions);

      expect(MockSurrealDBClient).toHaveBeenCalled();
      expect(mockClient.connect).toHaveBeenCalledWith({
        url: 'ws://localhost:8000',
        username: 'root',
        password: 'root',
        namespace: 'test',
        database: 'test'
      });
      expect(mockRepository.initialize).toHaveBeenCalled();
      expect(mockResolver.initialize).toHaveBeenCalled();
    });

    it('should resolve environment variables', async () => {
      process.env.SURREALDB_URL = 'ws://env-url:8000';
      process.env.SURREALDB_ROOT_USER = 'env-user';
      process.env.SURREALDB_ROOT_PASS = 'env-pass';
      process.env.SURREALDB_NAMESPACE = 'env-namespace';
      process.env.SURREALDB_DATABASE = 'env-database';

      await engine.initialize({
        url: '',
        user: '',
        pass: ''
      });

      expect(mockClient.connect).toHaveBeenCalledWith({
        url: 'ws://env-url:8000',
        username: 'env-user',
        password: 'env-pass',
        namespace: 'env-namespace',
        database: 'env-database'
      });

      // Cleanup
      delete process.env.SURREALDB_URL;
      delete process.env.SURREALDB_ROOT_USER;
      delete process.env.SURREALDB_ROOT_PASS;
      delete process.env.SURREALDB_NAMESPACE;
      delete process.env.SURREALDB_DATABASE;
    });

    it('should throw error for missing required options', async () => {
      // Make sure environment variables are not set
      delete process.env.SURREALDB_URL;
      delete process.env.SURREALDB_ROOT_USER;
      delete process.env.SURREALDB_ROOT_PASS;
      
      await expect(engine.initialize({
        url: '',
        user: '',
        pass: ''
      })).rejects.toThrow('Missing required configuration');
    });
  });

  describe('findPendingMigrations', () => {
    beforeEach(async () => {
      await engine.initialize(defaultOptions);
      
      // Mock file system
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath.toString().includes('000_admin')) {
          return ['0001_setup_up.surql', '0001_setup_down.surql'] as any;
        }
        if (dirPath.toString().includes('010_auth')) {
          return ['0001_users_up.surql', '0001_users_down.surql', '0002_roles_up.surql', '0002_roles_down.surql'] as any;
        }
        return [] as any;
      });

      mockFs.readFile.mockResolvedValue('-- migration content');
    });

    it('should find pending up migrations in execution order', async () => {
      const pending = await engine.findPendingMigrations();

      expect(pending).toHaveLength(3); // 1 from admin + 2 from auth
      expect(pending[0].moduleId).toBe('000_admin');
      expect(pending[0].direction).toBe('up');
      expect(pending[1].moduleId).toBe('010_auth');
      expect(pending[2].moduleId).toBe('010_auth');
    });

    it('should find pending down migrations in rollback order', async () => {
      const pending = await engine.findPendingMigrations(undefined, 'down');

      expect(mockResolver.getRollbackOrder).toHaveBeenCalledWith(['000_admin', '010_auth']);
      expect(pending).toHaveLength(3);
      expect(pending[0].direction).toBe('down');
    });

    it('should respect target modules', async () => {
      mockResolver.getExecutionOrder.mockReturnValue(['010_auth']);

      const pending = await engine.findPendingMigrations(['010_auth']);

      expect(pending).toHaveLength(2); // Only auth migrations
      expect(pending.every(m => m.moduleId === '010_auth')).toBe(true);
    });

    it('should skip migrations that cannot be applied', async () => {
      mockRepository.canApplyMigration.mockResolvedValueOnce({ canApply: false, reason: 'Already applied' });

      const pending = await engine.findPendingMigrations();

      expect(pending).toHaveLength(2); // One skipped
    });

    it('should include non-applicable migrations when force is true', async () => {
      await engine.initialize({ ...defaultOptions, force: true });
      mockRepository.canApplyMigration.mockResolvedValue({ canApply: false, reason: 'Already applied' });

      const pending = await engine.findPendingMigrations();

      expect(pending).toHaveLength(3); // All included due to force
    });
  });

  describe('executeMigrations', () => {
    beforeEach(async () => {
      await engine.initialize(defaultOptions);
      
      (mockFs.readdir as jest.Mock).mockImplementation(async (dirPath: string) => {
        if (dirPath.includes('000_admin')) {
          return ['0001_setup_up.surql'];
        }
        return [];
      });

      mockFs.readFile.mockResolvedValue('-- migration content');
    });

    it('should execute pending migrations successfully', async () => {
      const result = await engine.executeMigrations();

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(1);
      expect(result.filesSkipped).toBe(0);
      expect(result.results).toHaveLength(1);
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockRepository.addMigration).toHaveBeenCalled();
    });

    it('should handle migration execution failure', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('SQL error'));

      const result = await engine.executeMigrations();

      expect(result.success).toBe(false);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('SQL error');
      expect(mockRepository.addMigration).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'fail' })
      );
    });

    it('should skip migrations that cannot be applied', async () => {
      // Set up files to be found
      mockFs.readdir.mockImplementation(async (dirPath) => {
        if (dirPath.includes('000_admin')) {
          return ['0001_setup_up.surql'];
        }
        return [];
      });
      
      mockRepository.canApplyMigration.mockResolvedValue({ canApply: false, reason: 'Already applied' });

      const result = await engine.executeMigrations();

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(0);
      expect(result.filesSkipped).toBe(0); // No files reach execution to be skipped
      expect(result.results).toHaveLength(0); // No migrations returned from findPending
    });

    it('should stop on first failure unless force is enabled', async () => {
      mockFs.readdir.mockImplementation(async (dirPath) => {
        if (dirPath.includes('000_admin')) {
          return ['0001_setup_up.surql', '0002_config_up.surql'];
        }
        return [];
      });

      mockClient.query.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('SQL error'));

      const result = await engine.executeMigrations();

      expect(result.filesProcessed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });

    it('should return early when no pending migrations', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const result = await engine.executeMigrations();

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(mockClient.query).not.toHaveBeenCalled();
    });
  });

  describe('validateRollback', () => {
    beforeEach(async () => {
      await engine.initialize(defaultOptions);
      
      // Mock file system for rollback file detection
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath.toString().includes('010_auth')) {
          return ['0001_users_up.surql', '0001_users_down.surql'] as any;
        }
        return [] as any;
      });
      mockFs.readFile.mockResolvedValue('-- rollback content');
    });

    it('should validate safe rollback with all checks', async () => {
      mockResolver.validateRollback.mockReturnValue({ canRollback: true, blockedBy: [] });

      const result = await engine.validateRollback(['010_auth']);

      expect(result.canRollback).toBe(true);
      expect(result.blockedBy).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.migrationChecks).toHaveLength(1);
      expect(result.migrationChecks[0]).toEqual({
        moduleId: '010_auth',
        hasAppliedMigrations: false,
        rollbackFilesAvailable: true,
        dependencyConflicts: []
      });
    });

    it('should detect unsafe rollback due to dependencies', async () => {
      mockResolver.validateRollback.mockReturnValue({
        canRollback: false,
        blockedBy: ['020_schema'],
        reason: 'Module 010_auth has dependents'
      });

      const result = await engine.validateRollback(['010_auth']);

      expect(result.canRollback).toBe(false);
      expect(result.blockedBy).toContain('020_schema');
      expect(result.warnings).toContain('Module 010_auth has dependents');
      expect(result.migrationChecks[0].dependencyConflicts).toContain('020_schema');
    });

    it('should detect missing rollback files', async () => {
      mockResolver.validateRollback.mockReturnValue({ canRollback: true, blockedBy: [] });
      mockFs.readdir.mockImplementation(async (dirPath: any) => {
        if (dirPath.toString().includes('010_auth')) {
          return ['0001_users_up.surql'] as any; // Missing down file
        }
        return [] as any;
      });

      const result = await engine.validateRollback(['010_auth']);

      expect(result.canRollback).toBe(true); // No applied migrations, so no rollback files needed
      expect(result.migrationChecks[0].rollbackFilesAvailable).toBe(false);
    });

    it('should override safety checks when force is enabled', async () => {
      await engine.initialize({ ...defaultOptions, force: true });
      mockResolver.validateRollback.mockReturnValue({
        canRollback: false,
        blockedBy: ['020_schema'],
        reason: 'Module 010_auth has dependents'
      });

      const result = await engine.validateRollback(['010_auth']);

      expect(result.canRollback).toBe(true); // Force overrides safety
      expect(result.warnings).toContain('WARNING: Force flag enabled - bypassing rollback safety checks');
    });

    it('should validate multiple modules', async () => {
      mockResolver.validateRollback
        .mockReturnValueOnce({ canRollback: true, blockedBy: [] })
        .mockReturnValueOnce({ canRollback: false, blockedBy: ['030_communications'], reason: 'Has dependents' });

      const result = await engine.validateRollback(['010_auth', '020_schema']);

      expect(result.canRollback).toBe(false);
      expect(result.migrationChecks).toHaveLength(2);
      expect(result.blockedBy).toContain('030_communications');
    });
  });

  describe('getMigrationStatus', () => {
    beforeEach(async () => {
      await engine.initialize(defaultOptions);
      
      mockFs.readdir.mockImplementation(async (dirPath) => {
        if (dirPath.includes('000_admin')) {
          return ['0001_setup_up.surql'];
        }
        if (dirPath.includes('010_auth')) {
          return ['0001_users_up.surql', '0002_roles_up.surql'];
        }
        return [];
      });
    });

    it('should return migration status for all modules', async () => {
      const status = await engine.getMigrationStatus();

      expect(status.modules).toHaveLength(2);
      expect(status.modules[0].moduleId).toBe('000_admin');
      expect(status.modules[0].pendingMigrations).toBe(1);
      expect(status.modules[1].moduleId).toBe('010_auth');
      expect(status.modules[1].pendingMigrations).toBe(2);
      expect(status.totalPending).toBe(3);
    });

    it('should return status for specific modules', async () => {
      mockResolver.getAllModules.mockReturnValue(['010_auth']);

      const status = await engine.getMigrationStatus(['010_auth']);

      expect(status.modules).toHaveLength(1);
      expect(status.modules[0].moduleId).toBe('010_auth');
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await engine.initialize(defaultOptions);
      await engine.close();

      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle close when not initialized', async () => {
      await expect(engine.close()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw error when calling methods before initialization', async () => {
      await expect(engine.findPendingMigrations()).rejects.toThrow('Migration engine not initialized');
      await expect(engine.executeMigrations()).rejects.toThrow('Migration engine not initialized');
      await expect(engine.validateRollback(['test'])).rejects.toThrow('Migration engine not initialized');
      await expect(engine.getMigrationStatus()).rejects.toThrow('Migration engine not initialized');
    });

    it('should handle module resolution errors', async () => {
      await engine.initialize(defaultOptions);
      mockResolver.getAllModules.mockReturnValue(['000_admin']);

      await expect(engine.findPendingMigrations(['nonexistent']))
        .rejects.toThrow('Module not found: nonexistent');
    });
  });
});