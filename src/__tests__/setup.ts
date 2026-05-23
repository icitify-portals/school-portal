import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock NextAuth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
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
  AccessToken: vi.fn().mockImplementation(() => ({
    addGrant: vi.fn(),
    toJwt: vi.fn(() => 'mock-jwt-token'),
  })),
  EgressClient: vi.fn().mockImplementation(() => ({
    startRoomCompositeEgress: vi.fn(),
    stopEgress: vi.fn(),
  })),
  RoomServiceClient: vi.fn().mockImplementation(() => ({
    listParticipants: vi.fn(),
    removeParticipant: vi.fn(),
    mutePublishedTrack: vi.fn(),
  })),
  StreamOutput: vi.fn(),
  EncodedFileOutput: vi.fn(),
  S3Upload: vi.fn(),
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
