export interface LearningContext {
  current_topic: string;
  retrieved_theory: string;
  recent_topics: string;
  experience: string;
  level: string;
  interests: string;
  mastered_concepts: string;
  weak_concepts: string;
  knowledge_graph_summary: string;
  /** Graph-augmented context: related concepts from kg_edges */
  graph_context?: string;
  current_page: string;
  user_input: string;
  /** When true, RAG also searches the authenticated user's personal uploaded chunks */
  personal_rag?: boolean;
  /** When set, RAG retrieves chunks ONLY from this personal document and skips the global corpus. */
  personal_source_id?: string;
  /** Last N messages of the conversation to pass as context to the LLM */
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
