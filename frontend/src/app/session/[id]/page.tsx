'use client';

import { use } from 'react';
import { SessionRoom } from '@/components/session/SessionRoom';

interface SessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string; host?: string }>;
}

export default function SessionPage({ params, searchParams }: SessionPageProps) {
  const { id: roomId } = use(params);
  const { name, host } = use(searchParams);
  
  const participantName = name || 'Anonymous';
  const isHost = host === 'true';

  return (
    <SessionRoom
      roomId={roomId}
      participantName={participantName}
      isHost={isHost}
    />
  );
}