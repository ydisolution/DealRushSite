import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, generateToken } from '../auth';

describe('Authentication', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'Test1234!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test1234!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Test1234!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Test1234!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword!', hash);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'Test1234!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a random token', () => {
      const token = generateToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 (hex)
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).not.toBe(token2);
    });
  });
});
