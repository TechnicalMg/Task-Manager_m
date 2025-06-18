// src/app/models/user.model.spec.ts
import { User, LoginRequest, LoginResponse, AuthState } from './user.model';

describe('User Model Interfaces', () => {
  describe('User', () => {
    it('should have the correct properties', () => {
      const testUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'ADMIN',
        isActive: true
      };

      expect(testUser.id).toEqual(1);
      expect(testUser.username).toEqual('testuser');
      expect(testUser.email).toEqual('test@example.com');
      expect(testUser.role).toEqual('ADMIN');
      expect(testUser.isActive).toBeTrue();
    });
  });

  describe('LoginRequest', () => {
    it('should require email and password', () => {
      const loginRequest: LoginRequest = {
        email: 'user@example.com',
        password: 'securepassword123'
      };

      expect(loginRequest.email).toBeDefined();
      expect(loginRequest.password).toBeDefined();
    });

    it('should have string type for both fields', () => {
      const loginRequest: LoginRequest = {
        email: 'user@example.com',
        password: 'securepassword123'
      };

      expect(typeof loginRequest.email).toBe('string');
      expect(typeof loginRequest.password).toBe('string');
    });
  });

  describe('LoginResponse', () => {
    it('should require token and user', () => {
      const loginResponse: LoginResponse = {
        token: 'abc123.xyz456.def789',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          isActive: true
        }
      };

      expect(loginResponse.token).toBeDefined();
      expect(loginResponse.user).toBeDefined();
    });

    it('should have an optional message', () => {
      const loginResponseWithoutMessage: LoginResponse = {
        token: 'abc123.xyz456.def789',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          isActive: true
        }
      };

      const loginResponseWithMessage: LoginResponse = {
        token: 'abc123.xyz456.def789',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          isActive: true
        },
        message: 'Login successful'
      };

      expect(loginResponseWithoutMessage.message).toBeUndefined();
      expect(loginResponseWithMessage.message).toEqual('Login successful');
    });
  });

  describe('AuthState', () => {
    it('should handle authenticated state', () => {
      const authenticatedState: AuthState = {
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          isActive: true
        },
        token: 'abc123.xyz456.def789'
      };

      expect(authenticatedState.isAuthenticated).toBeTrue();
      expect(authenticatedState.user).toBeTruthy();
      expect(authenticatedState.token).toBeTruthy();
    });

    it('should handle unauthenticated state', () => {
      const unauthenticatedState: AuthState = {
        isAuthenticated: false,
        user: null,
        token: null
      };

      expect(unauthenticatedState.isAuthenticated).toBeFalse();
      expect(unauthenticatedState.user).toBeNull();
      expect(unauthenticatedState.token).toBeNull();
    });
  });
});