import { CHARISMA_CHAINS } from "./charismaDungeons.js";

// ─── ENGLISH OVERRIDES FOR CHARISMA DUNGEONS ──────────────────────────────────
const EN_CHARISMA_CHAINS = {
  social_exposure: {
    name: "Social Exposure",
    description: "Overcome social anxiety through gradual exposure. Each encounter hardens your CHA.",
    rewardTitle: "Socially Awakened",
    steps: {
      1: { title: "Smile at 3 strangers", desc: "Direct eye contact, genuine smile. No words needed." },
      2: { title: "Greet 5 strangers with 'Good Morning'", desc: "Friendly greeting – simple and direct. Count your successes." },
      3: { title: "Ask someone for directions", desc: "Actively approach a stranger and ask for help. Even if you know the way." },
      4: { title: "Have a 2-minute conversation with a stranger", desc: "More than just small talk. Ask a question, show genuine interest." },
      5: { title: "Make a new contact in a social situation", desc: "Exchange contact info or connect on social media." },
    }
  },
  conversation_mastery: {
    name: "Conversation Mastery",
    description: "Master the art of conversation – from small talk to deep understanding.",
    rewardTitle: "Conversation Master",
    steps: {
      1: { title: "Hold a conversation for 5 minutes without your phone", desc: "Full presence. No looking at the phone. Full eye contact." },
      2: { title: "Ask 3 open questions in a conversation", desc: "Open questions start with How, What, Why. No yes/no questions." },
      3: { title: "Use active listening: Paraphrase", desc: "Summarize what your conversation partner says – show that you are truly listening." },
      4: { title: "Share a vulnerable personal story", desc: "Open up. Share something real about yourself. Vulnerability builds connection." },
      5: { title: "Have a 30-minute deep conversation with a stranger", desc: "Not just small talk – real connection, real topics." },
      6: { title: "Successfully mediate a conflict", desc: "Bring two people to an agreement. Stay neutral and clear." },
    }
  },
  dating_protocol: {
    name: "Dating Protocol",
    description: "Systematic approach for romantic connections. Exposure therapy for the heart.",
    rewardTitle: "Charmer",
    steps: {
      1: { title: "Smile at someone you find attractive", desc: "Direct eye contact + genuine smile. No words needed. Just start." },
      2: { title: "Give someone a genuine compliment", desc: "Not just physical – compliment something specific. Sincere and direct." },
      3: { title: "Start a conversation with someone you find attractive", desc: "Approach them directly. A simple conversation starter is enough." },
      4: { title: "Exchange numbers or connect on social media", desc: "Ask directly. The outcome doesn't matter – the question itself is the victory." },
      5: { title: "Suggest a date – regardless of the outcome", desc: "Clear and direct: 'Let's go for coffee.' Outcome doesn't matter. Courage counts." },
      6: { title: "Go on a first date", desc: "Be present, show genuine interest, have fun. That's all that matters." },
      7: { title: "Arrange a second date", desc: "Show initiative. Suggest a specific time and place. No 'maybe sometime'." },
    }
  },
  public_speaking: {
    name: "Public Speaking",
    description: "From dry mouth to the stage. Gradual overcoming of speech anxiety.",
    rewardTitle: "Speaker",
    steps: {
      1: { title: "Read aloud – alone for 5 minutes", desc: "Loud, clear, with expression. Train your voice. Alone is enough for now." },
      2: { title: "Tell a story to one person", desc: "Tell something interesting from your life. Structured and lively." },
      3: { title: "Give a 2-minute speech in front of 2 people", desc: "Choose a topic. Prepare 3 points. 2 minutes without pausing." },
      4: { title: "Ask a question in a group setting", desc: "In a meeting, class, or event: Raise your hand and ask your question loudly." },
      5: { title: "Give a 5-minute speech in front of 5+ people", desc: "Without notes, from memory. Clear structure: Introduction, main part, conclusion." },
      6: { title: "Moderate a group discussion", desc: "Guide a group through a conversation. Keep the structure. Let everyone speak." },
      7: { title: "Give a 15-minute presentation", desc: "With or without slides – in front of a real group. This is your Dungeon Boss." },
    }
  },
  leadership: {
    name: "Leadership Protocol",
    description: "Develop natural authority and leadership presence. The final dungeon of the CHA series.",
    rewardTitle: "Leader",
    steps: {
      1: { title: "Take initiative in a group decision", desc: "If the group hesitates: Make a concrete suggestion on how to proceed." },
      2: { title: "Delegate a task to someone", desc: "Communicate clearly what, how, and by when. Transfer responsibility." },
      3: { title: "Give constructive feedback directly", desc: "Honest, clear, and appreciative. No beating around the bush – straight to the point." },
      4: { title: "Lead a meeting or activity", desc: "Agenda points, time control, results. You lead, others follow." },
      5: { title: "Mentor someone for a week", desc: "Accompany someone daily. Give feedback, answer questions, guide through the process." },
    }
  }
};

/**
 * Returns the localized charisma chains based on the locale.
 * @param {string} locale "en" or "de"
 */
export function getLocalizedCharismaChains(locale) {
  if (!locale || locale.startsWith("de")) {
    return CHARISMA_CHAINS;
  }

  return CHARISMA_CHAINS.map(chain => {
    const override = EN_CHARISMA_CHAINS[chain.id];
    if (!override) return chain;

    return {
      ...chain,
      name: override.name || chain.name,
      description: override.description || chain.description,
      reward: {
        ...chain.reward,
        title: override.rewardTitle || chain.reward?.title
      },
      steps: chain.steps.map(step => {
        const stepOverride = override.steps[step.step];
        if (!stepOverride) return step;
        return {
          ...step,
          title: stepOverride.title || step.title,
          desc: stepOverride.desc || step.desc
        };
      })
    };
  });
}
