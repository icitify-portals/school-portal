import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Set mock environment variables
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Mock NextAuth
const mockAuth = vi.fn(async () => ({ 
  user: { id: '1', name: 'Admin User', email: 'admin@school.com', role: 'admin' } 
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Next.js Cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock RBAC permissions dynamically based on the mocked session user
vi.mock('@/lib/rbac', () => ({
  hasPermission: vi.fn(async (permission: string) => {
    const session = await mockAuth();
    if (!session?.user) return false;
    const user = session.user as any;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    if (user.permissions?.includes(permission)) return true;
    return false;
  }),
  hasRole: vi.fn(async (role: string) => {
    const session = await mockAuth();
    if (!session?.user) return false;
    const user = session.user as any;
    if (user.role === role) return true;
    if (user.roles?.includes(role)) return true;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    return false;
  }),
}));

// Mock Drizzle DB
vi.mock('@/db/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
          orderBy: vi.fn(() => []),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => []),
            orderBy: vi.fn(() => []),
          })),
        })),
        limit: vi.fn(() => []),
        orderBy: vi.fn(() => []),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => []),
    })),
  },
}));

// Mock LiveKit
vi.mock('livekit-server-sdk', () => ({
  AccessToken: vi.fn().mockImplementation(function() {
    return {
      addGrant: vi.fn(),
      toJwt: vi.fn(() => 'mock-jwt-token'),
    };
  }),
  EgressClient: vi.fn().mockImplementation(function() {
    return {
      startRoomCompositeEgress: vi.fn(),
      stopEgress: vi.fn(),
    };
  }),
  RoomServiceClient: vi.fn().mockImplementation(function() {
    return {
      listParticipants: vi.fn(),
      removeParticipant: vi.fn(),
      mutePublishedTrack: vi.fn(),
    };
  }),
  StreamOutput: vi.fn().mockImplementation(function() {}),
  EncodedFileOutput: vi.fn().mockImplementation(function() {}),
  S3Upload: vi.fn().mockImplementation(function() {}),
}));

// Mock AI Provider
vi.mock('@/lib/ai-service', () => ({
  getAIProvider: vi.fn(() => ({
    generateContent: vi.fn(),
  })),
}));

// Mock S3
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(() => 'https://mock-s3-url.com'),
}));
