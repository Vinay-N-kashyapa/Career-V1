// hooks/useConversationAI.js
// 🤖 ADVANCED CONVERSATION AI WITH MEMORY INTEGRATION
// ✅ Memory-aware responses
// ✅ Context awareness
// ✅ Emotional tone matching
// ✅ Multi-turn conversations
// ✅ Personality consistency

import { useRef, useState, useCallback } from 'react';

const RESPONSE_STRATEGIES = {
  empathetic: {
    prefix: ['I understand', 'I can see how', 'That sounds'],
    examples: [
      'acknowledge the emotion first',
      'show understanding',
      'validate their feeling'
    ]
  },
  informative: {
    prefix: ['Based on', 'According to', 'I know that'],
    examples: [
      'provide factual information',
      'share knowledge',
      'explain concepts'
    ]
  },
  encouraging: {
    prefix: ['You can', 'I believe in you', 'That\'s great'],
    examples: [
      'motivate the user',
      'provide support',
      'celebrate achievements'
    ]
  },
  thoughtful: {
    prefix: ['Let me think', 'Consider this', 'Have you thought about'],
    examples: [
      'suggest alternatives',
      'offer perspectives',
      'encourage reflection'
    ]
  },
};

const CONVERSATION_CONTEXT_WEIGHTS = {
  recentMessages: 0.4,      // Last 3-5 messages
  sharedInterests: 0.25,    // Topics in common
  relationshipHistory: 0.2, // Past interactions
  currentEmotion: 0.15,     // Current emotional state
};

export function useConversationAI(memorySystem, emotionDetection) {
  const conversationStateRef = useRef({
    currentTopic: null,
    topicHistory: [],
    conversationPhase: 'greeting', // greeting, building, deepening, closing
    depthLevel: 0, // 0-3 scale of conversation depth
    engagementScore: 0.5,
  });

  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [responseMetrics, setResponseMetrics] = useState({
    relevanceScore: 0,
    toneMismatchScore: 0,
    personalityConsistency: 0,
  });

  // Generate context-aware response
  const generateContextAwareResponse = useCallback(async (userInput) => {
    setIsGeneratingResponse(true);

    try {
      // Get memory context
      const relevantMemories = memorySystem.getRelevantMemories(userInput, 5);
      const conversationHistory = memorySystem.getConversationContext(5);
      const persona = memorySystem.getPersona();
      const relationship = memorySystem.getRelationshipState();

      // Get emotional context
      const emotionalContext = emotionDetection.getEmotionalContext(userInput);

      // Extract topic
      const currentTopic = extractTopic(userInput);
      conversationStateRef.current.currentTopic = currentTopic;
      if (!conversationStateRef.current.topicHistory.includes(currentTopic)) {
        conversationStateRef.current.topicHistory.push(currentTopic);
      }

      // Determine response strategy
      const strategy = selectResponseStrategy(
        emotionalContext,
        persona,
        conversationHistory
      );

      // Build context weights
      const contextWeights = {
        recentMessages: conversationHistory.length > 0 ? 0.4 : 0.2,
        sharedInterests: relationship.sharedInterests.includes(currentTopic) ? 0.35 : 0.25,
        relationshipHistory: relationship.trustLevel > 0.7 ? 0.25 : 0.15,
        currentEmotion: emotionalContext ? 0.15 : 0.1,
      };

      // Generate response prompt
      const responsePrompt = buildResponsePrompt({
        userInput,
        relevantMemories,
        conversationHistory,
        persona,
        relationship,
        emotionalContext,
        strategy,
        contextWeights,
      });

      // Call AI API (OpenAI, Groq, etc.)
      const response = await callAIAPI(responsePrompt);

      // Calculate metrics
      const metrics = calculateResponseMetrics(
        response,
        emotionalContext,
        persona,
        strategy
      );

      setResponseMetrics(metrics);

      // Update conversation state
      updateConversationState(emotionalContext, currentTopic);

      setIsGeneratingResponse(false);

      return {
        text: response,
        strategy,
        metrics,
        context: {
          emotionalContext,
          relevantMemories,
          persona,
          relationship,
        }
      };
    } catch (error) {
      console.error('Error generating response:', error);
      setIsGeneratingResponse(false);
      return { text: 'I\'m thinking...', error };
    }
  }, [memorySystem, emotionDetection]);

  // Extract main topic from input
  const extractTopic = useCallback((input) => {
    const topicKeywords = {
      career: ['job', 'work', 'career', 'project', 'company', 'boss'],
      relationships: ['friend', 'family', 'partner', 'love', 'relationship'],
      health: ['health', 'fitness', 'exercise', 'diet', 'wellness', 'sick'],
      learning: ['learn', 'study', 'school', 'course', 'knowledge', 'skill'],
      hobbies: ['hobby', 'hobby', 'music', 'art', 'game', 'sport'],
      goals: ['goal', 'want', 'dream', 'achieve', 'plan', 'future'],
    };

    const lowerInput = input.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => lowerInput.includes(kw))) {
        return topic;
      }
    }

    return 'general';
  }, []);

  // Select appropriate response strategy
  const selectResponseStrategy = useCallback((emotionalContext, persona, history) => {
    if (!emotionalContext) return 'thoughtful';

    const emotion = emotionalContext.detectedEmotion || 'neutral';
    const tone = emotionalContext.analyzedTone || 'neutral';

    // Strategy selection logic
    if (emotion === 'sad' || emotion === 'fearful') {
      return 'empathetic';
    } else if (tone === 'excited' || emotion === 'happy') {
      return 'encouraging';
    } else if (history.length > 3) {
      return 'thoughtful'; // Deeper conversations
    } else {
      return 'informative';
    }
  }, []);

  // Build response prompt for AI
  const buildResponsePrompt = useCallback((context) => {
    const {
      userInput,
      relevantMemories,
      conversationHistory,
      persona,
      relationship,
      emotionalContext,
      strategy,
    } = context;

    let prompt = `You are ${persona.name}, a helpful and empathetic AI avatar.

YOUR PERSONALITY:
- Warmth: ${persona.personality.warmth}
- Humor: ${persona.personality.humor}
- Empathy: ${persona.personality.empathy}
- Professionalism: ${persona.personality.professionalism}

USER INFORMATION:
${relevantMemories.length > 0 ? `- Known interests: ${relevantMemories.map(m => m.data).join(', ')}` : ''}
- Trust Level: ${relationship.trustLevel}
- Interaction Count: ${relationship.interactionCount}

CONVERSATION CONTEXT:
${conversationHistory.slice(-2).map(c => `User: ${c.userMessage}\nYou: ${c.avatarResponse}`).join('\n')}

RESPONSE STRATEGY: Use a ${strategy} approach.
${emotionalContext ? `- User's Emotion: ${emotionalContext.detectedEmotion}` : ''}
${emotionalContext ? `- User's Tone: ${emotionalContext.analyzedTone}` : ''}

USER MESSAGE: "${userInput}"

GENERATE A RESPONSE THAT:
1. Reflects your personality traits
2. Shows you remember previous interactions
3. Addresses the user's emotional state
4. Stays consistent with your character
5. Is warm but natural (not overdone)

RESPONSE:`;

    return prompt;
  }, []);

  // Calculate response quality metrics
  const calculateResponseMetrics = useCallback((response, emotionalContext, persona, strategy) => {
    let relevanceScore = 0.7; // Base score
    let toneMismatchScore = 0;
    let personalityConsistency = 0.8; // Base score

    // Check tone matching
    if (emotionalContext) {
      const shouldBeWarm = ['happy', 'sad', 'fearful'].includes(emotionalContext.detectedEmotion);
      const responseHasWarmth = response.includes('understand') || 
                               response.includes('feel') || 
                               response.includes('amazing') ||
                               response.includes('great');
      
      if (shouldBeWarm && !responseHasWarmth) {
        toneMismatchScore = 0.3;
      } else if (shouldBeWarm && responseHasWarmth) {
        toneMismatchScore = 0;
      }
    }

    // Check personality consistency
    const hasHumor = persona.personality.humor > 0.6;
    const responseHasHumor = response.includes(':)') || 
                            response.includes('haha') ||
                            response.includes('😊');
    
    if (hasHumor && !responseHasHumor) {
      personalityConsistency -= 0.1;
    }

    return {
      relevanceScore: Math.min(1, relevanceScore),
      toneMismatchScore: Math.max(0, toneMismatchScore),
      personalityConsistency: Math.min(1, personalityConsistency),
    };
  }, []);

  // Update conversation state over time
  const updateConversationState = useCallback((emotionalContext, currentTopic) => {
    const state = conversationStateRef.current;

    // Increase depth as conversation progresses
    if (emotionalContext && emotionalContext.detectedEmotion !== 'neutral') {
      state.depthLevel = Math.min(3, state.depthLevel + 0.3);
    }

    // Update engagement score
    if (emotionalContext) {
      state.engagementScore = Math.min(
        1,
        state.engagementScore + (emotionalContext.emotionConfidence * 0.1)
      );
    }

    // Detect conversation phase
    const messageCount = state.topicHistory.length;
    if (messageCount < 2) {
      state.conversationPhase = 'greeting';
    } else if (messageCount < 5) {
      state.conversationPhase = 'building';
    } else if (messageCount < 10) {
      state.conversationPhase = 'deepening';
    } else {
      state.conversationPhase = 'sustaining';
    }
  }, []);

  // Call AI API (configure with your provider)
  const callAIAPI = useCallback(async (prompt) => {
    try {
      // Example: Using Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('API Error:', error);
      return 'I\'m having trouble processing that. Could you rephrase?';
    }
  }, []);

  // Get conversation analysis
  const getConversationAnalysis = useCallback(() => {
    const state = conversationStateRef.current;

    return {
      currentTopic: state.currentTopic,
      topicsDiscussed: state.topicHistory.length,
      conversationPhase: state.conversationPhase,
      depthLevel: state.depthLevel,
      engagementScore: state.engagementScore,
      topicHistory: state.topicHistory,
    };
  }, []);

  return {
    generateContextAwareResponse,
    extractTopic,
    selectResponseStrategy,
    getConversationAnalysis,
    conversationStateRef,
    isGeneratingResponse,
    responseMetrics,
    RESPONSE_STRATEGIES,
  };
}

export { RESPONSE_STRATEGIES, CONVERSATION_CONTEXT_WEIGHTS };
