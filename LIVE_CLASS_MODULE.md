# Live Class Module (Video Conferencing)

This module provides real-time video conferencing for live classes using the **LiveKit** ecosystem.

## Key Features

### 1. High-Performance Video/Audio
- Powered by LiveKit with adaptive stream and dynacast for optimal bandwidth usage.
- Supports background blur and real-time noise reduction.

### 2. Data Saver Mode (Optimized for Low Bandwidth)
- **Standard**: High quality (up to 540p).
- **Data Saver**: Low resolution (180p) to conserve mobile data.
- **Extreme Saver**: Audio-only mode. Disables all incoming video tracks for maximum data conservation.

### 3. Multi-Platform Streaming
- Instructors can broadcast classes simultaneously to **YouTube**, **Facebook**, and other RTMP-compatible platforms.
- Supports multiple stream destinations from a single session.

### 4. Participant Limits & Role-Based Control
- **Meeting Mode**: Up to 100 participants.
- **Webinar Mode**: Up to 300 participants.
- Automated participant counting and limit enforcement during room join.
- Role-based permissions (Staff can publish video/audio, Students in webinar mode are listeners by default).

### 5. Interactive Tools
- **SketchBoard**: Shared whiteboard for real-time collaboration.
- **Polls & Q&A**: Engagement tools for lecturers.
- **Hand Raising**: Signaling for student participation.
- **Breakout Rooms**: Sub-sessions for group work.

## Technical Details
- **Backend**: Next.js Server Actions with `livekit-server-sdk`.
- **Frontend**: `@livekit/components-react` for UI components.
- **Egress**: LiveKit Egress Service for recording and RTMP streaming.
