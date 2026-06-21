import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinClassSession, startLiveStream } from '../../actions/live-class';
import { db } from '@/db/db';
import { auth } from '@/auth';
import { RoomServiceClient, EgressClient } from 'livekit-server-sdk';

describe('Live Class Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('joinClassSession', () => {
    it('should throw Unauthorized if no session exists', async () => {
      (auth as any).mockResolvedValue(null);
      await expect(joinClassSession(1, 1)).rejects.toThrow('Unauthorized');
    });

    it('should respect participant limits for meetings (100)', async () => {
      (auth as any).mockResolvedValue({ user: { id: '1', name: 'Test', role: 'student' } });
      
      // Mock room exists and is meeting
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => [{ id: 1, roomName: 'room-1', mode: 'meeting', status: 'active' }])
          }))
        }))
      });

      // Mock 100 participants already in
      const listParticipants = vi.fn().mockResolvedValue(new Array(100).fill({ identity: 'other' }));
      (RoomServiceClient as any).mockImplementation(function() {
        return {
          listParticipants,
        };
      });

      await expect(joinClassSession(1, 1)).rejects.toThrow('Room is full. Maximum 100 participants allowed for meeting mode.');
    });

    it('should allow joining if user is already a participant even if full', async () => {
      (auth as any).mockResolvedValue({ user: { id: '1', name: 'Test', role: 'student' } });
      
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => [{ id: 1, roomName: 'room-1', mode: 'meeting', status: 'active' }])
          }))
        }))
      });

      // Mock 100 participants, one of them is the current user
      const listParticipants = vi.fn().mockResolvedValue([
        { identity: '1' },
        ...new Array(99).fill({ identity: 'other' })
      ]);
      (RoomServiceClient as any).mockImplementation(function() {
        return {
          listParticipants,
          listRooms: vi.fn().mockResolvedValue([])
        };
      });

      const result = await joinClassSession(1, 1);
      expect(result).toHaveProperty('token');
    });
  });

  describe('startLiveStream', () => {
    it('should stop unauthorized access for students', async () => {
      (auth as any).mockResolvedValue({ user: { id: '1', name: 'Student', role: 'student' } });
      const result = await startLiveStream('room-1', ['rtmp://url']);
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should start egress for staff', async () => {
      (auth as any).mockResolvedValue({ user: { id: '2', name: 'Staff', role: 'staff' } });
      
      const startRoomCompositeEgress = vi.fn().mockResolvedValue({ egressId: 'egress-123' });
      (EgressClient as any).mockImplementation(function() {
        return {
          startRoomCompositeEgress,
        };
      });

      const result = await startLiveStream('room-1', ['rtmp://url']);
      expect(result).toEqual({ success: true, egressId: 'egress-123' });
      expect(startRoomCompositeEgress).toHaveBeenCalledWith('room-1', expect.objectContaining({
        stream: expect.any(Object)
      }));
    });
  });
});
