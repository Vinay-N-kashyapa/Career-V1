// hooks/usePersonalAvatarMemory.js
// 🧠 PERSONAL AVATAR MEMORY & PERSONA SYSTEM
// ✅ User profile storage
// ✅ Conversation history
// ✅ Personality traits
// ✅ Relationship memory
// ✅ Emotional context

import { useRef, useState, useCallback, useEffect } from 'react';

const MEMORY_TYPES = {
  PERSONAL_INFO: 'personal_info',
  PREFERENCES: 'preferences',
  CONVERSATION: 'conversation',
  RELATIONSHIPS: 'relationships',
  EMOTIONAL_HISTORY: 'emotional_history',
  AVATAR_TRAITS: 'avatar_traits',
  USER_PATTERNS: 'user_patterns',
};

const DEFAULT_PERSONA = {
  name: 'PersonaAI',
  personality: {
    warmth: 0.7,
    humor: 0.6,
    professionalism: 0.8,
    empathy: 0.8,
    curiosity: 0.7,
    patience: 0.8,
  },
  appearance: {
    style: 'friendly',
    formality: 'casual',
    expressiveness: 0.9,
  },
  traits: [
    'attentive',
    'supportive',
    'engaging',
    'thoughtful',
    'responsive',
  ],
};

export function usePersonalAvatarMemory(userId) {
  const memoryRef = useRef(new Map());
  const conversationHistoryRef = useRef([]);
  const personaRef = useRef({ ...DEFAULT_PERSONA });
  const relationshipStateRef = useRef({
    trustLevel: 0.5,
    connectionStrength: 0.3,
    interactionCount: 0,
    lastPositiveInteraction: null,
    sharedInterests: [],
  });

  const [memoryStats, setMemoryStats] = useState({
    totalMemories: 0,
    conversationLength: 0,
    lastUpdate: null,
  });

  // Initialize or load existing persona
  const initializePersona = useCallback((customPersona = {}) => {
    const newPersona = {
      ...DEFAULT_PERSONA,
      ...customPersona,
      userId,
      createdAt: new Date(),
    };

    personaRef.current = newPersona;
    return newPersona;
  }, [userId]);

  // Store memory
  const storeMemory = useCallback((type, data, metadata = {}) => {
    const memory = {
      id: Math.random().toString(36),
      type,
      data,
      metadata,
      timestamp: Date.now(),
      importance: metadata.importance || 0.5,
    };

    if (!memoryRef.current.has(type)) {
      memoryRef.current.set(type, []);
    }

    memoryRef.current.get(type).push(memory);

    // Update stats
    setMemoryStats({
      totalMemories: Array.from(memoryRef.current.values()).reduce((a, b) => a + b.length, 0),
      conversationLength: conversationHistoryRef.current.length,
      lastUpdate: new Date(),
    });

    return memory;
  }, []);

  // Store user personal info
  const storePersonalInfo = useCallback((info) => {
    return storeMemory(MEMORY_TYPES.PERSONAL_INFO, {
      name: info.name,
      age: info.age,
      occupation: info.occupation,
      interests: info.interests,
      goals: info.goals,
      preferences: info.preferences,
    }, { importance: 0.9 });
  }, [storeMemory]);

  // Store conversation
  const storeConversation = useCallback((userMessage, avatarResponse, context = {}) => {
    const conversation = {
      userMessage,
      avatarResponse,
      timestamp: Date.now(),
      emotionalContext: context.emotion,
      userTone: context.tone,
      responseStrategy: context.strategy,
      effectiveness: context.effectiveness || 0.5,
    };

    conversationHistoryRef.current.push(conversation);

    // Store in memory
    storeMemory(MEMORY_TYPES.CONVERSATION, conversation);

    // Update relationship
    updateRelationshipState(context);

    return conversation;
  }, [storeMemory]);

  // Store user preferences
  const storePreferences = useCallback((preferences) => {
    return storeMemory(MEMORY_TYPES.PREFERENCES, preferences, { importance: 0.7 });
  }, [storeMemory]);

  // Build relationship context
  const updateRelationshipState = useCallback((context) => {
    if (!context) return;

    const rel = relationshipStateRef.current;
    rel.interactionCount += 1;

    // Increase trust based on positive interactions
    if (context.emotion === 'happy' || context.emotion === 'satisfied') {
      rel.trustLevel = Math.min(1, rel.trustLevel + 0.05);
      rel.lastPositiveInteraction = Date.now();
    }

    // Adjust connection based on engagement
    if (context.engagement > 0.7) {
      rel.connectionStrength = Math.min(1, rel.connectionStrength + 0.03);
    }

    // Add shared interests
    if (context.sharedInterest) {
      if (!rel.sharedInterests.includes(context.sharedInterest)) {
        rel.sharedInterests.push(context.sharedInterest);
      }
    }
  }, []);

  // Get relevant memories for response
  const getRelevantMemories = useCallback((query, limit = 5) => {
    const allMemories = [];

    for (const [type, memories] of memoryRef.current) {
      allMemories.push(...memories);
    }

    // Sort by relevance and recency
    allMemories.sort((a, b) => {
      const recencyScore = Math.exp(-(Date.now() - a.timestamp) / (1000 * 60 * 60 * 24)); // Decay over days
      const importanceScore = a.importance;
      const queryMatch = a.data.toString().toLowerCase().includes(query.toLowerCase()) ? 1 : 0;

      return (importanceScore * 0.4 + recencyScore * 0.3 + queryMatch * 0.3) - 
             (b.importance * 0.4 + Math.exp(-(Date.now() - b.timestamp) / (1000 * 60 * 60 * 24)) * 0.3);
    });

    return allMemories.slice(0, limit);
  }, []);

  // Get conversation context
  const getConversationContext = useCallback((depth = 5) => {
    return conversationHistoryRef.current.slice(-depth);
  }, []);

  // Generate response with memory
  const generateMemoryAwareResponse = useCallback((userInput, context = {}) => {
    const relevantMemories = getRelevantMemories(userInput, 3);
    const conversationContext = getConversationContext(5);
    const persona = personaRef.current;
    const relationship = relationshipStateRef.current;

    const responseContext = {
      relevantMemories,
      conversationContext,
      persona,
      relationship,
      userInput,
      ...context,
    };

    return responseContext;
  }, [getRelevantMemories, getConversationContext]);

  // Get persona
  const getPersona = useCallback(() => personaRef.current, []);

  // Update persona traits
  const updatePersonaTraits = useCallback((traits) => {
    personaRef.current = {
      ...personaRef.current,
      ...traits,
    };
  }, []);

  // Get relationship state
  const getRelationshipState = useCallback(() => ({
    ...relationshipStateRef.current,
  }), []);

  // Export memory to file
  const exportMemory = useCallback(() => {
    const exportData = {
      userId,
      persona: personaRef.current,
      memories: Array.from(memoryRef.current.entries()).filter(([type]) => type !== 'conversation'),
      conversationHistory: [],
      relationshipState: relationshipStateRef.current,
      exportDate: new Date(),
    };

    return exportData;
  }, [userId]);

  // Import memory from file
  const importMemory = useCallback((importData) => {
    if (importData.userId !== userId) {
      console.warn('⚠️ Memory from different user, caution advised');
    }

    if (importData.persona) {
      personaRef.current = importData.persona;
    }

    if (importData.memories) {
      importData.memories.forEach(([type, memories]) => {
        if (type !== 'conversation') {
          memoryRef.current.set(type, memories);
        }
      });
    }

    if (importData.conversationHistory) {
      conversationHistoryRef.current = [];
    }

    if (importData.relationshipState) {
      Object.assign(relationshipStateRef.current, importData.relationshipState);
    }

    setMemoryStats({
      totalMemories: Array.from(memoryRef.current.values()).reduce((a, b) => a + b.length, 0),
      conversationLength: 0,
      lastUpdate: new Date(),
    });
  }, [userId]);

  // Clear all memory
  const clearMemory = useCallback((type = null) => {
    if (type) {
      memoryRef.current.delete(type);
    } else {
      memoryRef.current.clear();
      conversationHistoryRef.current = [];
      relationshipStateRef.current = {
        trustLevel: 0.5,
        connectionStrength: 0.3,
        interactionCount: 0,
        lastPositiveInteraction: null,
        sharedInterests: [],
      };
    }

    setMemoryStats({
      totalMemories: Array.from(memoryRef.current.values()).reduce((a, b) => a + b.length, 0),
      conversationLength: conversationHistoryRef.current.length,
      lastUpdate: new Date(),
    });
  }, []);

  return {
    // Memory operations
    storeMemory,
    storePersonalInfo,
    storeConversation,
    storePreferences,
    getRelevantMemories,
    getConversationContext,
    generateMemoryAwareResponse,

    // Persona operations
    initializePersona,
    getPersona,
    updatePersonaTraits,

    // Relationship
    getRelationshipState,
    updateRelationshipState,

    // Import/Export
    exportMemory,
    importMemory,
    clearMemory,

    // State
    memoryStats,
    conversationHistory: conversationHistoryRef.current,
    memoryRef,
    personaRef,
  };
}

export { MEMORY_TYPES, DEFAULT_PERSONA };
