import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export type PageType = 'theory' | 'practice' | 'independent';

export type TopicProgress = {
  theory: boolean;
  practice: boolean;
  independent: boolean;
  scores: Record<PageType, number | null>;
};

export function useMathTopicProgress(user: User | null, section: string, topic: string) {
  const [progress, setProgress] = useState<TopicProgress>({
    theory: false,
    practice: false,
    independent: false,
    scores: { theory: null, practice: null, independent: null },
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('math_topic_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic', topic)
      .then(({ data }) => {
        if (!data) return;
        const next = { ...progress };
        for (const row of data) {
          const pt = row.page_type as PageType;
          next[pt] = row.completed;
          next.scores[pt] = row.score;
        }
        setProgress(next);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, topic]);

  const markCompleted = useCallback(
    async (pageType: PageType, score?: number) => {
      if (!user) return;
      await supabase.from('math_topic_progress').upsert(
        {
          user_id: user.id,
          section,
          topic,
          page_type: pageType,
          completed: true,
          score: score ?? null,
          last_visited_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,topic,page_type' },
      );
      setProgress((prev) => ({
        ...prev,
        [pageType]: true,
        scores: { ...prev.scores, [pageType]: score ?? null },
      }));
    },
    [user, section, topic],
  );

  const updateVisit = useCallback(
    async (pageType: PageType) => {
      if (!user) return;
      await supabase.from('math_topic_progress').upsert(
        {
          user_id: user.id,
          section,
          topic,
          page_type: pageType,
          last_visited_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,topic,page_type', ignoreDuplicates: false },
      );
    },
    [user, section, topic],
  );

  return { progress, markCompleted, updateVisit };
}
