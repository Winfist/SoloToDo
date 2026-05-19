import { QUEST_POOL } from "./questPool.js";

const GENERIC_EN_SUBQUESTS = {
  str: [
    "Complete the physical training block with full attention.",
    "Log one short recovery action after the session.",
  ],
  int: [
    "Spend one focused block on the learning task.",
    "Write down the key insight in one clear note.",
  ],
  vit: [
    "Complete the recovery or health action today.",
    "Remove one source of avoidable strain from your environment.",
  ],
  agi: [
    "Clear the highest-friction task first.",
    "Reset the workspace or system that slows execution.",
  ],
  cha: [
    "Initiate one meaningful social action.",
    "Follow up with a clear message or reflection.",
  ],
};

const EN_OVERRIDES = {
  // ─── STR: STRENGTH & FITNESS ───
  qp_str_01: {
    desc: "Initialize physical activity to stimulate the body and raise baseline energy.",
    subQuests: ["10 push-ups", "20 squats"],
  },
  qp_str_01b: {
    desc: "Release joint blockages and increase muscular elasticity to prevent physical degradation.",
    subQuests: ["10 minutes of active mobility flow or yoga"],
  },
  qp_str_01c: {
    desc: "Strengthen the fundamental center of your body for maximum kinetic transfer.",
    subQuests: ["3 x 30-second plank hold", "20 crunches"],
  },
  qp_str_01d: {
    desc: "Recalibrate your spine. A hunched back signals weakness and reduces lung capacity.",
    subQuests: ["3 sets of 15 wall angels", "5 minutes of active dead hang or stretching"],
  },
  qp_str_02: {
    desc: "Cardiovascular and muscular stimulation to prepare for high-intensity exertion.",
    subQuests: ["30 push-ups", "60-second forearm plank", "15 burpees"],
  },
  qp_str_02b: {
    desc: "Increase maximum oxygen uptake (VO2 max) through steady aerobic exercise.",
    subQuests: ["30 minutes of continuous aerobic activity (running/swimming/cycling)"],
  },
  qp_str_02c: {
    desc: "Stimulate the central nervous system through maximum anaerobic intervals.",
    subQuests: ["15-minute HIIT protocol", "5 maximum sprints (15 seconds each)"],
  },
  qp_str_02d: {
    desc: "Fight gravity. Use your own body weight for vertical pulling power.",
    subQuests: ["10 pull-ups or 30 bodyweight rows"],
  },
  qp_str_02e: {
    desc: "A Hunter's strength begins with their grip. A weak grip limits the entire system.",
    subQuests: ["Accumulated 3-minute dead hang on the pull-up bar", "Farmers walk with heavy weights (3 x 30 seconds)"],
  },
  qp_str_03: {
    desc: "Targeted destruction of muscle fibers to initiate massive structural adaptation (muscle growth).",
    subQuests: ["45 minutes of isolated strength training", "Reach absolute muscle failure in at least 2 working sets"],
  },
  qp_str_03b: {
    desc: "Force the body to adapt its muscular endurance through accumulated volume.",
    subQuests: ["100 push-ups", "200 squats"],
  },
  qp_str_03c: {
    desc: "Maximize the recruitment of fast-twitch muscle fibers through plyometric training.",
    subQuests: ["50 jump squats", "30 explosive push-ups (clapping)"],
  },
  qp_str_04: {
    desc: "A physical fitness test of class S. Only for Hunters whose bodies have already been forged.",
    subQuests: ["100 push-ups (max. 1 pause)", "100 sit-ups", "10-kilometer run"],
  },

  // ─── INT: INTELLIGENCE & LEARNING ───
  qp_int_01: {
    desc: "Expand your knowledge base and extract the signal from high-quality information.",
    subQuests: ["Read 15 pages of non-fiction", "Capture the core idea in 3 sentences"],
  },
  qp_int_01b: {
    desc: "Activate prefrontal cortex activity through targeted logical stimulation.",
    subQuests: ["Solve a logical problem (Sudoku, chess puzzle, code kata)"],
  },
  qp_int_01c: {
    desc: "Eliminate irrelevant data streams. Structure incoming information.",
    subQuests: ["Clear the 'Read Later' / 'Watch Later' folder (consume or delete at least 3 items)"],
  },
  qp_int_01d: {
    desc: "Expand your horizon outside your usual domain. New knowledge creates new synaptic bridges.",
    subQuests: ["Consume a 20-minute documentary or podcast on a topic completely unfamiliar to you"],
  },
  qp_int_02: {
    desc: "Initiate the deep work state. Eliminate all distracting signals for maximum cognitive performance.",
    subQuests: ["45 minutes of absolute focus without external distractions (phone away)", "Recapitulate the work done verbally or in writing"],
  },
  qp_int_02b: {
    desc: "Install a new linguistic framework into your neural network.",
    subQuests: ["30 minutes of active language learning", "Verify 20 new vocabulary words or concepts"],
  },
  qp_int_02c: {
    desc: "Analyze resource flows. Knowledge of capital allocation is vital for survival.",
    subQuests: ["Review and track all expenses from the last 7 days", "Read an article or a chapter on investment/finance"],
  },
  qp_int_02d: {
    desc: "Creativity is not accidental, but the combination of existing data. Force the process.",
    subQuests: ["20 minutes of continuous 'Free Writing' or brainstorming ideas for a current project"],
  },
  qp_int_02e: {
    desc: "Strengthen your short-term and long-term memory through conscious storage processes.",
    subQuests: ["Actively memorize a list of 15 items, a poem, or an unfamiliar formula", "Verify the knowledge blindly from memory after 4 hours"],
  },
  qp_int_03: {
    desc: "Overcome mental fatigue through a prolonged phase of uninterrupted concentration.",
    subQuests: ["120-minute uninterrupted deep work session", "Physical isolation of the smartphone for the entire duration"],
  },
  qp_int_03b: {
    desc: "Crack a complex system. Apply advanced logic to a hard problem.",
    subQuests: ["Solve a challenging problem (programming, mathematics, or domain-specific)", "Document the solution path cleanly for future reference"],
  },
  qp_int_03c: {
    desc: "Extract complexity. Reduce a massive topic to its fundamental truths.",
    subQuests: ["Research a highly complex topic for 60 minutes", "Write a one-page summary that a layperson can understand (Feynman Method)"],
  },
  qp_int_04: {
    desc: "From student to master. Finalize a major cognitive project and share the data.",
    subQuests: ["Completely finish a long professional course or a demanding book", "Create a project that applies the new concepts", "Teach the concept in detail to another person"],
  },

  // ─── VIT: VITALITY & REGENERATION ───
  qp_vit_01: {
    desc: "Optimize hydration for cellular efficiency and stable energy.",
    subQuests: ["Drink at least 2.5 liters of unsweetened fluid"],
  },
  qp_vit_01b: {
    desc: "Calibrate the circadian rhythm through direct photon exposure (sunlight).",
    subQuests: ["15 minutes of direct sunlight within 30 minutes of waking up"],
  },
  qp_vit_01c: {
    desc: "Initiate the system's most important recovery phase.",
    subQuests: ["Ensure at least 7.5 hours of sleep tonight"],
  },
  qp_vit_01d: {
    desc: "Prevent your chassis from rusting. Light movement promotes blood circulation and joint lubrication.",
    subQuests: ["A light 15-minute digestive walk directly after a main meal"],
  },
  qp_vit_01e: {
    desc: "The optical sensors are overloaded. Minimize screen radiation to prevent fatigue.",
    subQuests: ["Apply the 20-20-20 rule 3 times today (6 meters, 20 seconds, every 20 minutes)", "Close eyes completely for 10 minutes without falling asleep"],
  },
  qp_vit_02: {
    desc: "Stop the intake of performance-reducing substances. Stabilize blood sugar.",
    subQuests: ["0% industrial sugar for 24 hours", "Consume a meal made entirely from unprocessed ingredients"],
  },
  qp_vit_02b: {
    desc: "Reduce cortical noise through conscious isolation.",
    subQuests: ["15 minutes of absolute silence and breath control (meditation)", "No dopamine spikes (social media/shorts) for 4 hours"],
  },
  qp_vit_02c: {
    desc: "Provide building blocks for muscle repair and enzyme production.",
    subQuests: ["Strictly meet your protein goal today (e.g. 1.5g+ per kg of body weight)"],
  },
  qp_vit_02d: {
    desc: "Provide the system with highly concentrated micronutrients. End the deficiency.",
    subQuests: ["Consume at least 500g of fresh, raw, or lightly steamed vegetables today"],
  },
  qp_vit_02e: {
    desc: "Elevated core temperature accelerates muscle relaxation and toxin elimination.",
    subQuests: ["Complete a sauna session or take a 20-minute hot relaxation bath", "Mobilize and stretch immediately afterwards"],
  },
  qp_vit_03: {
    desc: "Force the adaptation of the sympathetic nervous system through thermal shock.",
    subQuests: ["Take a cold shower (min. 90 seconds on the coldest setting)", "Control breathing under shock"],
  },
  qp_vit_03b: {
    desc: "Minimize blue light to maximize melatonin production.",
    subQuests: ["Strict screen lock starting at 8:00 PM (or 2 hours before bed)", "Only read or journal before sleeping"],
  },
  qp_vit_04: {
    desc: "A complete day of relief for stomach, senses, and nervous system. Rebooting...",
    subQuests: ["16+ hours of strict intermittent fasting (water/tea/black coffee only)", "30 minutes of complete isolation and silence", "At least 1 hour of nature exposure without electronic devices"],
  },

  // ─── AGI: AGILITY & PRODUCTIVITY ───
  qp_agi_01: {
    desc: "Remove environmental friction so execution becomes easier.",
    subQuests: ["Reset one visible workspace", "Remove or archive 5 distracting items"],
  },
  qp_agi_01b: {
    desc: "Define vectors before energy is invested. Prevents blind actionism.",
    subQuests: ["Write down all upcoming tasks (brain dump)", "Mark the top 3 mission goals of the day"],
  },
  qp_agi_01c: {
    desc: "Clean up your digital operations center to minimize search times.",
    subQuests: ["Empty the 'Downloads' folder / clean up the desktop"],
  },
  qp_agi_01d: {
    desc: "Remove obstacles to future action. Tomorrow's success is planned tonight.",
    subQuests: ["Lay out your clothes for tomorrow visibly", "Pack your bag/backpack for the next day"],
  },
  qp_agi_02: {
    desc: "Hesitation is deadly. Attack the most unpleasant task head-on.",
    subQuests: ["Complete the task you have been putting off the longest (Eat the Frog)"],
  },
  qp_agi_02b: {
    desc: "Eliminate all open communication buffers. Reset to zero state.",
    subQuests: ["Process all emails/messages (reply, archive, or schedule)"],
  },
  qp_agi_02c: {
    desc: "Optimize mental endurance through strict work and break intervals.",
    subQuests: ["Complete 4 strict 25-minute Pomodoro blocks", "Use the 5-minute breaks physically (stand up, stretch)"],
  },
  qp_agi_02d: {
    desc: "The 2-minute rule. What can be done quickly is done immediately to keep the backlog clean.",
    subQuests: ["Find 5 tasks that take less than 2 minutes and do them immediately"],
  },
  qp_agi_02e: {
    desc: "Optimize the system's cash flow by eliminating leaks.",
    subQuests: ["Review all ongoing subscriptions", "Cancel at least one unused or unnecessary subscription"],
  },
  qp_agi_03: {
    desc: "Leave no room for chaos. Every time block must be assigned a purpose.",
    subQuests: ["Time-Boxing: Plan the entire day in calendar blocks", "Execute day priority #1 exactly in the defined block"],
  },
  qp_agi_03b: {
    desc: "Secure a tactical advantage before the rest of the world wakes up.",
    subQuests: ["Wake up before 6:00 AM", "No smartphone/internet in the first hour", "Complete 60 minutes of highly focused work before 8:30 AM"],
  },
  qp_agi_03c: {
    desc: "Outer order creates inner order. Completely clean the physical base.",
    subQuests: ["Clean the entire bedroom and study intensively (vacuum, dust, dispose of trash)", "Sort out 5 things you no longer need (donate/throw away)"],
  },
  qp_agi_04: {
    desc: "Compress a week's worth of output into a single day.",
    subQuests: ["Start working before sunrise", "Clean the entire work and living environment", "Complete a project that has been pending for weeks"],
  },

  // ─── CHA: CHARISMA & SOCIAL ───
  qp_cha_01: {
    desc: "Strengthen social presence through one deliberate contact.",
    subQuests: ["Send one thoughtful message", "Ask one direct follow-up question"],
  },
  qp_cha_01b: {
    desc: "Boost the self-esteem of allies through authentic recognition.",
    subQuests: ["Give someone a specific, sincere compliment"],
  },
  qp_cha_01c: {
    desc: "Train vocal output for maximum persuasive power.",
    subQuests: ["Read a text aloud with a strong, loud voice for 5 minutes"],
  },
  qp_cha_01d: {
    desc: "A true leader knows their troops. Pay attention to details that others miss.",
    subQuests: ["Observe a specific detail about a person (e.g. new clothing, mood)", "Subtly bring it up to them in a positive way"],
  },
  qp_cha_02: {
    desc: "Optimize your physical appearance. Present yourself as an authority.",
    subQuests: ["Choose an above-average groomed outfit today (Dress up)", "Correct your posture (chest out, shoulders back) every time you walk through a door"],
  },
  qp_cha_02b: {
    desc: "Digital connections are weak. Force physical synchronization.",
    subQuests: ["Invite someone for coffee or lunch", "Keep smartphone invisible during the entire meeting"],
  },
  qp_cha_02c: {
    desc: "Focus 100% on the transmitter. Listen to understand, not to answer.",
    subQuests: ["Have a conversation in which you listen 80% of the time and ask questions"],
  },
  qp_cha_02d: {
    desc: "Real influence is built on creating value for others. Give before you take.",
    subQuests: ["Proactively offer your help to someone with a problem", "Expect and demand absolutely nothing in return"],
  },
  qp_cha_02e: {
    desc: "Build digital authority. Share knowledge with the collective.",
    subQuests: ["Write a high-quality, value-adding post (LinkedIn, blog, etc.) and publish it"],
  },
  qp_cha_03: {
    desc: "Step out of your comfort zone and act confidently in asymmetrical interactions.",
    subQuests: ["Start a conversation with a complete stranger", "Give someone critical but constructive feedback directly to their face"],
  },
  qp_cha_03b: {
    desc: "Withdraw from artificial validation. Build real presence.",
    subQuests: ["Delete/deactivate social media apps for 24 hours", "Have a deep, long phone call as a replacement"],
  },
  qp_cha_03c: {
    desc: "Unresolved conflicts are blind spots. Confront the uncomfortable.",
    subQuests: ["Address an unpleasant topic that you have avoided so far", "Stay calm and focus on finding a solution, not on assigning blame"],
  },
  qp_cha_04: {
    desc: "Take command. Shape your environment according to your will.",
    subQuests: ["Organize and lead a social event or meeting", "Give a presentation or speech in front of a group"],
  },
};

function localizeSubQuests(template, locale, override) {
  if (locale !== "en") return template.subQuests;
  const titles = override?.subQuests || GENERIC_EN_SUBQUESTS[template.category] || GENERIC_EN_SUBQUESTS.agi;
  return titles.map((title, index) => ({
    ...(template.subQuests?.[index] || { id: String(index + 1), completed: false }),
    title,
    completed: false,
  }));
}

export function localizeQuestTemplate(template, locale) {
  if (!template) return template;
  const templateId = template.templateId || template.id;
  if (locale !== "en") {
    return { ...template, templateId };
  }

  const override = EN_OVERRIDES[templateId];
  return {
    ...template,
    templateId,
    title: override?.title || template.title,
    desc: override?.desc || `Complete this ${template.difficulty || "normal"} ${template.category?.toUpperCase() || "AGI"} Quest to strengthen your Hunter profile.`,
    subQuests: localizeSubQuests(template, locale, override),
  };
}

export function getSystemQuestPoolForLocale(locale) {
  return QUEST_POOL.map((template) => localizeQuestTemplate(template, locale));
}
