import { useCallback, useRef } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export type SavedMessage = {
  role: 'user' | 'assistant';
  content: string;
  aiRole?: string;
  usedFallback?: boolean;
  ragSources?: unknown[];
};

export type LoadedMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  ai_role: string | null;
  used_fallback: boolean;
  rag_sources: unknown[];
  created_at: string;
};

export type SessionPreview = {
  id: string;
  topic: string | null;
  page_type: string | null;
  message_count: number;
  started_at: string;
  ended_at: string | null;
  preview: string | null;
};

/**
 * Hook for persisting AI mentor conversations to Supabase.
 * Creates a session on first message and appends messages to it.
 * On loadLastSession(), reuses the most recent session for the topic.
 */
export function useMentorSession(
  user: User | null,
  topic: string,
  pageType: 'theory' | 'practice' | 'independent',
) {
  const sessionIdRef = useRef<string | null>(null);

  /** Ensure a session exists and return its ID */
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    if (sessionIdRef.current) return sessionIdRef.current;

    const { data, error } = await supabase
      .from('mentor_sessions')
      .insert({
        user_id: user.id,
        topic,
        page_type: pageType,
        started_at: new Date().toISOString(),
        metadata: { created_from: 'math_topic_page' },
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Failed to create mentor session:', error.message);
      return null;
    }

    sessionIdRef.current = data.id as string;
    return data.id as string;
  }, [user, topic, pageType]);

  /**
   * Load the most recent session for this (user, topic) and return its messages.
   * Sets sessionIdRef so subsequent saveMessage calls append to that session.
   */
  const loadLastSession = useCallback(async (): Promise<{ messages: LoadedMessage[] }> => {
    if (!user) return { messages: [] };

    const { data: sessions, error: sessErr } = await supabase
      .from('mentor_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('topic', topic)
      .order('started_at', { ascending: false })
      .limit(1);

    if (sessErr || !sessions?.length) return { messages: [] };

    const sid = sessions[0].id as string;
    sessionIdRef.current = sid;

    const { data: msgs, error: msgErr } = await supabase
      .from('mentor_messages')
      .select('id, role, content, ai_role, used_fallback, rag_sources, created_at')
      .eq('session_id', sid)
      .order('created_at', { ascending: true })
      .limit(40);

    if (msgErr) {
      console.warn('Failed to load mentor messages:', msgErr.message);
      return { messages: [] };
    }

    return { messages: (msgs ?? []) as LoadedMessage[] };
  }, [user, topic]);

  /**
   * Load all sessions for this user (all topics), with a preview of the first message.
   * Used for the chat history sidebar.
   */
  const loadAllSessions = useCallback(async (): Promise<SessionPreview[]> => {
    if (!user) return [];

    const { data: sessions, error } = await supabase
      .from('mentor_sessions')
      .select('id, topic, page_type, message_count, started_at, ended_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error || !sessions?.length) return [];

    const sessionIds = sessions.map((s) => s.id as string);

    // Load first user message per session for preview text
    const { data: messages } = await supabase
      .from('mentor_messages')
      .select('session_id, content, created_at')
      .in('session_id', sessionIds)
      .eq('role', 'user')
      .order('created_at', { ascending: true });

    // First message per session
    const previewMap = new Map<string, string>();
    if (messages) {
      for (const msg of messages) {
        const sid = msg.session_id as string;
        if (!previewMap.has(sid)) {
          previewMap.set(sid, (msg.content as string).slice(0, 120));
        }
      }
    }

    return sessions.map((s) => ({
      id: s.id as string,
      topic: s.topic as string | null,
      page_type: s.page_type as string | null,
      message_count: s.message_count as number,
      started_at: s.started_at as string,
      ended_at: s.ended_at as string | null,
      preview: previewMap.get(s.id as string) ?? null,
    }));
  }, [user]);

  /**
   * Load messages from a specific session by ID.
   * Switches the active session to this ID so new messages append here.
   */
  const loadSession = useCallback(
    async (sessionId: string): Promise<{ messages: LoadedMessage[] }> => {
      if (!user) return { messages: [] };

      sessionIdRef.current = sessionId;

      const { data: msgs, error } = await supabase
        .from('mentor_messages')
        .select('id, role, content, ai_role, used_fallback, rag_sources, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.warn('Failed to load session messages:', error.message);
        return { messages: [] };
      }

      return { messages: (msgs ?? []) as LoadedMessage[] };
    },
    [user],
  );

  /** Save a single message (user or assistant) */
  const saveMessage = useCallback(
    async (msg: SavedMessage) => {
      if (!user) return;

      const sessionId = await ensureSession();
      if (!sessionId) return;

      const [{ error: msgError }, { error: countError }] = await Promise.all([
        supabase.from('mentor_messages').insert({
          session_id: sessionId,
          user_id: user.id,
          role: msg.role,
          content: msg.content,
          ai_role: msg.aiRole ?? null,
          used_fallback: msg.usedFallback ?? false,
          rag_sources: msg.ragSources ?? [],
        }),
        supabase.rpc('increment_session_message_count', { session_id: sessionId }).then(
          () => ({ error: null }),
          (e) => ({ error: e }),
        ),
      ]);

      if (msgError) console.warn('Failed to save message:', msgError.message);
      if (countError) console.warn('Failed to update message count:', countError);
    },
    [user, ensureSession],
  );

  /** Close current session (sets ended_at) and resets session ref */
  const closeSession = useCallback(async () => {
    if (!sessionIdRef.current || !user) return;

    await supabase
      .from('mentor_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionIdRef.current);

    sessionIdRef.current = null;
  }, [user]);

  /** Returns the current session ID if one has been created */
  const getSessionId = useCallback(() => sessionIdRef.current, []);

  return { saveMessage, closeSession, loadLastSession, loadAllSessions, loadSession, getSessionId };
}
