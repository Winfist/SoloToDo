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
  qp_str_05: {
    desc: "Water is the most primordial training medium. Use hydrostatic pressure for full body activation.",
    subQuests: ["20 minutes of continuous swimming (any style)", "3 x underwater exhalations with controlled breathing technique"],
  },
  qp_str_05b: {
    desc: "The System detects movement deficits. Reactivate primitive movement patterns on the ground.",
    subQuests: ["15 minutes of Animal Flow or ground gymnastics (bear crawl, crab walk, rolls)"],
  },
  qp_str_06: {
    desc: "Conquer the vertical plane. Climbing activates 80% of all muscle chains simultaneously.",
    subQuests: ["30 minutes of bouldering or climbing (indoors or outdoors)", "Complete at least 3 different routes"],
  },
  qp_str_06b: {
    desc: "Initiate combat simulations. Striking technique and reaction time define the Hunter.",
    subQuests: ["30 minutes of martial arts training (boxing, kickboxing, MMA, or karate)", "100 clean punch combinations on the heavy bag or shadow boxing"],
  },
  qp_str_06c: {
    desc: "Leave the controlled environment. Uneven terrain recruits stabilizing muscle fibers that the gym doesn't target.",
    subQuests: ["60 minutes of hiking or trail running on uneven terrain", "Conquer at least 300 meters of cumulative elevation gain"],
  },
  qp_str_06d: {
    desc: "Stagnation is regression. Force a measurable increase compared to your last session.",
    subQuests: ["Increase the weight OR the repetitions in 3 exercises compared to last week", "Document the increase in a training log"],
  },
  qp_str_07: {
    desc: "Combine strength, endurance, and technique in a single session. The System tests your versatility.",
    subQuests: ["Complete a 30-minute circuit training: 5 exercises, 4 rounds, no rest between exercises", "Finish the session with a 1 km run under 5:30 minutes"],
  },
  qp_str_07b: {
    desc: "Own bodyweight is no longer enough. Add external resistance to bodyweight exercises.",
    subQuests: ["5 weighted pull-ups (dip belt or backpack)", "10 weighted dips", "20 weighted squats"],
  },
  qp_str_07c: {
    desc: "Endurance beyond the comfort zone. The System tests cardiopulmonary resilience on a competitive level.",
    subQuests: ["60 minutes of continuous aerobic activity without break (running, cycling, or rowing)", "Increase speed in the last 10 minutes (negative split)"],
  },
  qp_str_07d: {
    desc: "Theory without practice is worthless. Face an opponent and test your combat readiness under pressure.",
    subQuests: ["Complete 3 rounds of controlled sparring (3 minutes each) with a partner", "Analyze 2 weak points in your technique and note correction measures"],
  },
  qp_str_08: {
    desc: "Rank S stress test: Complete a multi-discipline hardship test that combines strength, endurance, and willpower.",
    subQuests: ["1 km swim OR 5 km run", "200 push-ups and 200 squats (divided into sets, max. 60 sec rest)", "5 minutes of cold exposure (ice bath or coldest shower) as a conclusion"],
  },
  qp_str_08a: {
    desc: "Conquer the vertical. Only a Hunter with maximum endurance overcomes gravity over hours.",
    subQuests: ["Complete a mountain hike or climbing tour with at least 1000 meters of elevation gain", "Carry a backpack with at least 10 kg of extra weight"],
  },
  qp_str_08b: {
    desc: "The ultimate physical trial. Ten disciplines. No dodging. No giving up. The System only accepts perfection.",
    subQuests: ["Complete 10 different exercises of 100 repetitions each (push-ups, squats, sit-ups, lunges, burpees, dips, pull-ups, plank 3 min, box jumps, mountain climbers)", "Finish everything within 90 minutes", "Document times and breaks for future comparison"],
  },
  qp_str_09: {
    desc: "Muscle tension without movement generates maximum neural activation. Hold the position.",
    subQuests: ["3 x 45 seconds wall sit", "3 x 30 seconds glute bridge hold"],
  },
  qp_str_09b: {
    desc: "Restructure stuck tissue. Foam rolling massively increases blood flow and flexibility.",
    subQuests: ["15 minutes intense foam rolling (focus on legs and back)", "Drink 500ml water afterwards to flush toxins"],
  },
  qp_str_10: {
    desc: "Isolate weak points. Unilateral training forces the weaker side of the body to adapt.",
    subQuests: ["3 sets of 10 pistol squats (or assisted) per leg", "3 sets of 12 one-arm dumbbell rows per arm"],
  },
  qp_str_10b: {
    desc: "Burn the fuel of the mitochondria. A constant pulse at the anaerobic threshold.",
    subQuests: ["100 kettlebell swings (or dumbbell swings)", "50 burpees as fast as possible"],
  },
  qp_str_10c: {
    desc: "Eliminate momentum. Slow, controlled execution stimulates muscle fibers deeper.",
    subQuests: ["3 sets of push-ups (4 sec down, 1 sec hold, explosive up)", "3 sets of squats in the same 4-1-1 tempo"],
  },
  qp_str_10d: {
    desc: "Reaction time is survival. Train multidirectional changes of direction and footwork.",
    subQuests: ["15 minutes of agility ladder drills or jump rope", "10 x 10 meter shuttle sprints"],
  },
  qp_str_11: {
    desc: "A circuit of absolute physical destruction and rebirth. The System tolerates no pauses.",
    subQuests: ["Round 1: 50 pull-ups, 50 push-ups, 50 squats", "Round 2: 30 pull-ups, 30 push-ups, 30 squats", "All exercises back-to-back with max 30 seconds rest between rounds"],
  },
  qp_str_11b: {
    desc: "Lift weights that test your structure. Deadlifts demand the entire posterior chain apparatus.",
    subQuests: ["Perform heavy deadlifts (5 sets, 3-5 reps at 80-85% 1RM)", "Complete 3 minutes of dead hang afterwards (can be split)"],
  },
  qp_str_11c: {
    desc: "Oxygen deficit training. Accustom your muscles to working under suboptimal conditions.",
    subQuests: ["400m running intervals: 6 reps breathing only through the nose", "Active recovery in between by walking slowly"],
  },
  qp_str_12: {
    desc: "A legendary test of strength. Only the elite can handle this massive volume shock.",
    subQuests: ["Move a cumulative 10,000 kg of weight in a single training session (any exercises)", "Track and calculate every movement precisely", "Finish the session with a 2km run at a moderate pace"],
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
  qp_int_05: {
    desc: "Music activates neural networks that no textbook can reach. Learn an instrument or train your ear.",
    subQuests: ["Practice an instrument or work through a music tutorial for 20 minutes", "Play a simple melody flawlessly from start to finish"],
  },
  qp_int_05b: {
    desc: "Drawing is visual thinking. Train hand-eye coordination and spatial imagination.",
    subQuests: ["Draw from reference (object, face, or landscape) for 15 minutes"],
  },
  qp_int_06: {
    desc: "Create a complete financial overview. Without control over resources, any strategy is worthless.",
    subQuests: ["Create a detailed monthly budget with all income and fixed costs", "Identify 3 areas with potential savings"],
  },
  qp_int_06b: {
    desc: "Writing is the highest form of organizing thoughts. Construct a coherent narrative.",
    subQuests: ["Write a short story, essay, or blog post (min. 500 words)", "Completely revise the text once for clarity and structure"],
  },
  qp_int_06c: {
    desc: "The Hunter needs diverse assets. Learn the basics of investing and asset allocation.",
    subQuests: ["Spend 45 minutes studying investment strategies, stocks, or ETFs", "Define your personal asset allocation strategy in a document"],
  },
  qp_int_06d: {
    desc: "Analyze complex systems. Learn how components interact to form a whole.",
    subQuests: ["Read a case study or watch a documentation on systems engineering, logistics, or economics (min. 30 minutes)", "Write down the 3 most important feedback loops of the system"],
  },
  qp_int_07: {
    desc: "Deep research. Penetrate a scientific or historical topic to its core.",
    subQuests: ["Select a specific topic and read at least 3 scientific papers or primary sources on it", "Summarize the current state of research in 5 key points"],
  },
  qp_int_07b: {
    desc: "Bridge theory and practice. Build a working prototype of a digital product or tool.",
    subQuests: ["Write code, design a database, or set up a web page for a personal project (min. 2 hours)", "Commit your progress to a repository or document it"],
  },
  qp_int_07c: {
    desc: "Acquire a new skill systematically. Break it down into sub-components.",
    subQuests: ["Select a new skill and create a 20-hour deconstruction plan (what are the sub-skills, what tools do you need)", "Complete the first 1-hour practice block"],
  },
  qp_int_07d: {
    desc: "Design a complete system from scratch. Architectural design is the ultimate test of structured thinking.",
    subQuests: ["Design the architecture of a system (app, business model, learning plan, organization)", "Document components, interfaces, and dependencies in a diagram", "Have the design reviewed by another person and integrate feedback"],
  },
  qp_int_08: {
    desc: "The Hunter's intellect knows no subject boundaries. Prove competence in three different domains in one day.",
    subQuests: ["Complete 60 minutes of focused work in 3 different areas of knowledge", "Create an output artifact for each area (text, code, sketch, analysis)"],
  },
  qp_int_08a: {
    desc: "True mastery is shown in the ability to pass on knowledge. Create an educational work.",
    subQuests: ["Create a complete guide, tutorial, or course on your specialty (min. 2000 words or 30 min video)", "Publish the material and collect feedback from at least 3 people"],
  },
  qp_int_08b: {
    desc: "The masterpiece. Bring a major project to completion that manifests months of intellectual work.",
    subQuests: ["Fully complete a long-running intellectual project (book, app, research, course certification)", "Present the result publicly (presentation, post, portfolio)", "Reflect in writing: What did you learn about yourself?"],
  },
  qp_int_09: {
    desc: "Optimize auditory input. Process high-quality podcasts like data packets.",
    subQuests: ["Listen to a 45-minute episode of an informative podcast", "Note down the three most important takeaways"],
  },
  qp_int_09b: {
    desc: "Activate spatial memory. Visualize and mentally map your environment.",
    subQuests: ["Draw a detailed floor plan of your house/apartment purely from memory", "Add at least 15 specific objects with correct positioning"],
  },
  qp_int_10: {
    desc: "Increase the clock frequency of your visual input. Train speed-reading techniques.",
    subQuests: ["Read for 20 minutes with a visual pacer (e.g. your finger) at twice normal speed", "Summarize what you read in a 5-minute written brain dump"],
  },
  qp_int_10b: {
    desc: "Deconstruct an argument into its premises and conclusions. Recognize logical fallacies.",
    subQuests: ["Analyze an opinion piece or debate video", "Identify at least 2 logical fallacies or weak premises"],
  },
  qp_int_10c: {
    desc: "Build the strongest argument for the opposing side. Expand your empathy-logic.",
    subQuests: ["Choose a view you fundamentally disagree with", "Write down the most convincing argument FOR this view in 300 words"],
  },
  qp_int_10d: {
    desc: "Connect isolated data points. Mind mapping simultaneously activates both hemispheres of the brain.",
    subQuests: ["Create a massive, hand-drawn mind map for a project or problem", "Use at least 3 different colors and draw visual symbols"],
  },
  qp_int_11: {
    desc: "Pattern recognition at the highest level. Train handling complex codes and encryptions.",
    subQuests: ["Solve 3 complex cryptograms or learn the basics of Python/Regex for 60 minutes", "Hide a message in your own code"],
  },
  qp_int_11b: {
    desc: "Decode dense, historical texts. The wisdom of centuries is hidden in the vocabulary.",
    subQuests: ["Read a primary philosophical text for 30 minutes (e.g., Seneca, Kant, Aurelius)", "Translate a paragraph into modern, own words without loss of meaning"],
  },
  qp_int_11c: {
    desc: "Merge with the machine. Use advanced AI tools to solve a problem in record time.",
    subQuests: ["Use LLMs or other AI to automate or penetrate a complex workflow", "Optimize the prompt at least 5 times to extract the absolute maximum", "Document the final workflow"],
  },
  qp_int_12: {
    desc: "Master the synthesis. The System tests your ability to retrieve massive knowledge instantly.",
    subQuests: ["Prepare a 15-minute presentation on a new subject area (without slides)", "Deliver the presentation fluently in front of a camera or real people", "Answer 5 deep questions on the subject afterwards (or simulate them)"],
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
  qp_vit_05: {
    desc: "The System registers chronic negativity bias. Recalibrate perception through conscious gratitude.",
    subQuests: ["Write down 5 specific things you are grateful for today (not generic)", "Share one of them with a person involved"],
  },
  qp_vit_05b: {
    desc: "Breathing patterns control the autonomic nervous system. Take manual control.",
    subQuests: ["Complete 10 minutes of structured breathing exercises (Box Breathing: 4-4-4-4 or Wim Hof)"],
  },
  qp_vit_06: {
    desc: "Macros alone are not enough. Analyze your micro-nutrient supply at the molecular level.",
    subQuests: ["Track all meals of the day in a nutrition app (Cronometer, MyFitnessPal)", "Identify 2 deficient micro-nutrients and plan targeted foods to counter them"],
  },
  qp_vit_06b: {
    desc: "Thoughts in the head are chaos. On paper they become data. Initiate daily journaling.",
    subQuests: ["Write unfiltered in a journal for 15 minutes (Morning Pages or evening reflection)", "Answer: What was today's biggest challenge and what did I learn from it?"],
  },
  qp_vit_06c: {
    desc: "Shinrin-yoku — forest bathing. Scientifically proven to lower cortisol and blood pressure.",
    subQuests: ["Spend 45 minutes consciously in the forest or park (no smartphone, no headphones)", "Use all 5 senses actively: What do you hear, smell, see, feel, taste?"],
  },
  qp_vit_06d: {
    desc: "Sleep quality > sleep quantity. Optimize sleep architecture for maximum REM and deep sleep phases.",
    subQuests: ["Establish a 30-minute bedtime ritual (same time, same sequence: dimming, reading, breathing exercise)", "No caffeine after 2:00 PM and cool the bedroom to below 19°C"],
  },
  qp_vit_07: {
    desc: "Total decoupling from digital noise. The System demands a complete reset of sensory inputs.",
    subQuests: ["12 hours completely without smartphone, laptop, and screens", "Fill the gained time with analog activities (reading, cooking, walking, crafting)"],
  },
  qp_vit_07b: {
    desc: "Nutrition is no coincidence. Plan and prepare meals to eliminate impulse consumption.",
    subQuests: ["Plan all meals for 3 days in advance (consider macros + micros)", "Prepare at least 4 meals and store them portioned"],
  },
  qp_vit_07c: {
    desc: "Suppressed emotions accumulate as systemic stress. Force a controlled discharge.",
    subQuests: ["Write unfiltered for 20 minutes about a topic that burdens you emotionally (Expressive Writing)", "Identify the underlying need behind the emotion and formulate a concrete action"],
  },
  qp_vit_07d: {
    desc: "Chronic overload without deload leads to system collapse. Plan an active recovery week.",
    subQuests: ["Plan a week with reduced training intensity (50% volume/weight)", "Replace intensive sessions with yoga, swimming, or long walks", "Sleep at least 8 hours every day this week"],
  },
  qp_vit_08: {
    desc: "A whole day just for regeneration. No output. No hustle. The System forces complete restoration.",
    subQuests: ["Spend the entire day offline (no internet, no news)", "Complete 3 different recovery activities (nature, bath/sauna, creative hobby)", "Write a reflection in the evening: How does your body and mind feel after a day without pressure?"],
  },
  qp_vit_08a: {
    desc: "Optimize every parameter of your biology. Sleep, nutrition, light, temperature — everything is calibrated.",
    subQuests: ["Implement 5 scientifically backed biohacks for one week (e.g., blue light filter, magnesium before sleep, morning sun, cold therapy, nasal strip)", "Track the effects on sleep quality, energy, and mood daily"],
  },
  qp_vit_08b: {
    desc: "The ultimate vitality trial. 7 days of perfect discipline in sleep, nutrition, exercise, and mindfulness.",
    subQuests: ["7 consecutive days: 8h sleep, 0% sugar, 30 min exercise, 10 min meditation — without a single exception", "Document each day with a short vitality score (1-10) and notes", "Compare Day 1 with Day 7: How has your baseline level changed?"],
  },
  qp_vit_09: {
    title: "Solar Receptors",
    desc: "Light controls biology. Activate your receptors.",
    subQuests: ["Spend 10 minutes in direct sunlight in the morning"]
  },
  qp_vit_09b: {
    title: "Baseline Hydration",
    desc: "The system needs water after the offline phase.",
    subQuests: ["Drink 500ml of water right after waking up"]
  },
  qp_vit_10: {
    title: "Nutritional Audit",
    desc: "Eliminate empty calories from the system.",
    subQuests: ["Replace one unhealthy meal with a completely wholesome one"]
  },
  qp_vit_10b: {
    title: "Cortisol Reduction",
    desc: "Stress hormones block regeneration. Initiate countermeasures.",
    subQuests: ["Complete 20 minutes of active relaxation (yoga, meditation, light stretching)"]
  },
  qp_vit_10c: {
    title: "Sleep Parameters",
    desc: "Optimize environmental conditions for shutdown.",
    subQuests: ["Ventilate the bedroom for 15 minutes and eliminate all light sources"]
  },
  qp_vit_10d: {
    title: "Oxygen Saturation",
    desc: "Increase oxygen intake through conscious diaphragmatic breathing.",
    subQuests: ["Perform 3 rounds of deep Wim Hof breathing"]
  },
  qp_vit_11: {
    title: "Fasting Protocol",
    desc: "Give the digestive system time for repair processes.",
    subQuests: ["Complete an 18-hour intermittent fast"]
  },
  qp_vit_11b: {
    title: "Endurance Test",
    desc: "Cardiovascular peak performance is non-negotiable.",
    subQuests: ["Run or cycle for 45 minutes in a moderate to high heart rate zone"]
  },
  qp_vit_11c: {
    title: "Bio Reset",
    desc: "Remove all stimulants to recalibrate sensors.",
    subQuests: ["A full day without caffeine and without sugar"]
  },
  qp_vit_12: {
    title: "Perfect Synchronization",
    desc: "Bring all vitality parameters into absolute harmony.",
    subQuests: ["7 consecutive days: Perfect macronutrients, 8 hours of sleep, and 3L of water daily"]
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
  qp_agi_05: {
    desc: "A chaotic working environment slows down cognitive processing speed. Optimize your base.",
    subQuests: ["Clean up your desk completely and wipe it down", "Clean your digital desktop of unnecessary shortcuts"],
  },
  qp_agi_05b: {
    desc: "The System demands uninterrupted concentration. Protect your time proactively.",
    subQuests: ["Block at least two 90-minute focus times for the coming week in the calendar"],
  },
  qp_agi_06: {
    desc: "Unread messages are open loops in working memory. Defragment your inboxes.",
    subQuests: ["Archive, delete, or answer all emails until inbox zero is reached", "Unsubscribe from at least 3 unused newsletters"],
  },
  qp_agi_06b: {
    desc: "Manual repetitions reduce agility. Delegate repetitive tasks to the system.",
    subQuests: ["Create a macro, an Apple Shortcut, or a small script for a daily task", "Test and optimize the process for minimal user interaction"],
  },
  qp_agi_06c: {
    desc: "Search time is wasted life energy. Structure your digital archive.",
    subQuests: ["Clean up the download folder and sort all files into a logical folder structure"],
  },
  qp_agi_06d: {
    desc: "Conduct a situational assessment. Do your current activities align with your career goals?",
    subQuests: ["List your 3 most important professional projects", "Define the next immediately executable step for each project"],
  },
  qp_agi_07: {
    desc: "You cannot optimize what you do not measure. Keep an exact log of your invested time.",
    subQuests: ["Track every minute of your working hours for a full working day (e.g., using Toggle or Excel)", "Analyze in the evening: Where did unproductive time leak away?"],
  },
  qp_agi_07b: {
    desc: "Link new habits to existing triggers to consolidate neural pathways faster.",
    subQuests: ["Establish a new habit loop: After [existing routine], I will immediately perform [new habit]", "Repeat this successfully on 3 consecutive days"],
  },
  qp_agi_07c: {
    desc: "A Hunter without a target drifts aimlessly. Chart the route to your ultimate professional form.",
    subQuests: ["Create a detailed 5-year career plan with milestones and required skills", "Identify 3 concrete skills you need to learn next"],
  },
  qp_agi_07d: {
    desc: "Inactive connections wither. Reactivate your professional network.",
    subQuests: ["Contact 3 former colleagues or business partners without business motives", "Propose a quick virtual coffee or phone call to catch up", "Conduct at least one of these conversations successfully"],
  },
  qp_agi_08: {
    desc: "Eliminate manual friction points in your life. Build an integrated workflow pipeline.",
    subQuests: ["Automate a complex, multi-step workflow using Zapier, Make, or scripts", "Document the system so you can repair it quickly in case of errors"],
  },
  qp_agi_08a: {
    desc: "Analyze your weekly routines and eliminate bottlenecks. Maximize your leverage.",
    subQuests: ["Perform a full analysis of your weekly obligations", "Eliminate, delegate, or automate at least 2 time-consuming tasks permanently"],
  },
  qp_agi_08b: {
    desc: "The ultimate efficiency trial. Bring time allocation to absolute perfection in a single day.",
    subQuests: ["Complete 10 hours of highly focused Deep Work blocks within a 15-hour window", "0 minutes of private distraction during work blocks", "Achieve all project goals set for that day without delay"],
  },
  qp_agi_09: {
    title: "Micro Actions",
    desc: "Complete small tasks immediately to generate momentum.",
    subQuests: ["Complete 3 tasks that each take less than 2 minutes"]
  },
  qp_agi_09b: {
    title: "Workspace Focus",
    desc: "A clear space leads to clear thoughts.",
    subQuests: ["Remove 5 unnecessary objects from your desk"]
  },
  qp_agi_10: {
    title: "Priority Matrix",
    desc: "Separate the important from the urgent.",
    subQuests: ["Organize your to-do list according to the Eisenhower Matrix"]
  },
  qp_agi_10b: {
    title: "Distraction Blocker",
    desc: "Protect your cognitive capacity.",
    subQuests: ["Activate 'Do Not Disturb' mode on all devices for 2 hours"]
  },
  qp_agi_10c: {
    title: "Batch Processing",
    desc: "Group similar tasks to minimize context switching.",
    subQuests: ["Process all emails and messages together in a single 30-minute block"]
  },
  qp_agi_10d: {
    title: "Weekly Review",
    desc: "Evaluate progress to make course corrections.",
    subQuests: ["Conduct a 20-minute review of your weekly goals"]
  },
  qp_agi_11: {
    title: "Deep Focus",
    desc: "Dive into deep work mode.",
    subQuests: ["Complete an uninterrupted 90-minute deep work block"]
  },
  qp_agi_11b: {
    title: "System Automation",
    desc: "Let machines handle routine work.",
    subQuests: ["Fully automate or delegate a recurring weekly task"]
  },
  qp_agi_11c: {
    title: "Energy Management",
    desc: "Align your work with your biological clock.",
    subQuests: ["Complete your most important and hardest task during your biological peak"]
  },
  qp_agi_12: {
    title: "Architect of Time",
    desc: "Master the dimension of time.",
    subQuests: ["Plan and execute an entire week in time-boxing format without significant deviations"]
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
  qp_cha_05: {
    desc: "Authentic appreciation strengthens social bonds. Send positive impulses into your network.",
    subQuests: ["Send two people in your circle an unexpected message thanking them for something specific"],
  },
  qp_cha_05b: {
    desc: "The strongest foundations lie in the family. Reactivate neglected family channels.",
    subQuests: ["Have a phone call or meet with a family member you haven't spoken to in a while (min. 15 minutes)"],
  },
  qp_cha_06: {
    desc: "A good conversation partner shines not by speaking, but by deep understanding.",
    subQuests: ["Have a conversation in which you give absolutely no advice, but only listen actively and mirror what is said", "Let the other person finish speaking without interrupting them (min. 10 minutes)"],
  },
  qp_cha_06b: {
    desc: "Knowledge becomes more valuable when shared. Help an ally with their development.",
    subQuests: ["Explain a complex skill or method you master well to someone", "Answer all comprehension questions patiently and clearly"],
  },
  qp_cha_06c: {
    desc: "A Hunter does not act in a vacuum. Connect with the local or global community.",
    subQuests: ["Participate in a local meeting, club evening, or community event"],
  },
  qp_cha_06d: {
    desc: "Analog appreciation has a far higher binding force. Leave a lasting signal.",
    subQuests: ["Write a handwritten thank-you letter to a person who has supported you", "Hand over or send the letter physically"],
  },
  qp_cha_07: {
    desc: "Unsaid words poison relationships. Confront tensions objectively and constructively.",
    subQuests: ["Address a smoldering misunderstanding or conflict openly but calmly", "Find a joint agreement or solution that both sides can live with"],
  },
  qp_cha_07b: {
    desc: "Relationships require undivided attention. Eliminate distractions for true proximity.",
    subQuests: ["Plan an evening together with a partner or close friend", "Ban all smartphones during the entire time (min. 3 hours offline)"],
  },
  qp_cha_07c: {
    desc: "Coordinate a team or group to achieve a common goal. Exercise leadership.",
    subQuests: ["Take the initiative in a group decision or project", "Lead the discussion in a goal-oriented manner and ensure everyone is heard"],
  },
  qp_cha_07d: {
    desc: "In hard times, the value of an alliance is shown. Be a rock for someone in need.",
    subQuests: ["Actively offer a friend in a difficult phase your help or a listening ear", "Take at least 1 hour of time to be fully there for this person"],
  },
  qp_cha_08: {
    desc: "Become the center of your network. Host an event that connects knowledge and people.",
    subQuests: ["Organize a network meeting, lecture, or workshop for at least 4 people", "Prepare the topic professionally and lead the event independently"],
  },
  qp_cha_08a: {
    desc: "Bring people together across boundaries. Settle a deep conflict or lead a large community project.",
    subQuests: ["Successfully settle a long-standing conflict in the team/family OR lead a charitable project", "Reach a written or orally fixed joint agreement of all parties"],
  },
  qp_cha_08b: {
    desc: "Leave a social legacy. The System demands the long-term promotion of the next generation.",
    subQuests: ["Take a person under your wing as a mentor for at least 3 months OR start a long-term charity initiative", "Document progress and development goals monthly", "Create a final reflection on the results achieved"],
  },
  qp_cha_09: {
    title: "Presence Check",
    desc: "Presence is the first step to influence.",
    subQuests: ["Consciously maintain eye contact and open body language in 3 conversations"]
  },
  qp_cha_09b: {
    title: "Active Listening",
    desc: "Listening is more powerful than speaking.",
    subQuests: ["Let the other person speak 80% of the time in a conversation without interrupting"]
  },
  qp_cha_10: {
    title: "Appreciation Signal",
    desc: "Distribute verbal rewards within your network.",
    subQuests: ["Give three sincere compliments to different people"]
  },
  qp_cha_10b: {
    title: "Network Maintenance",
    desc: "Invest in existing alliances.",
    subQuests: ["Send a message to an important person you haven't spoken to in a while"]
  },
  qp_cha_10c: {
    title: "Conflict Prevention",
    desc: "De-escalate situations before they arise.",
    subQuests: ["Address a minor disagreement calmly and objectively right away instead of ignoring it"]
  },
  qp_cha_10d: {
    title: "Voice & Tone",
    desc: "Tonality controls the emotional response.",
    subQuests: ["Record a voice message, listen to it, and optimize your emphasis and calmness"]
  },
  qp_cha_11: {
    title: "Public Speaking",
    desc: "The ability to move groups is essential.",
    subQuests: ["Confidently deliver a short presentation or tell a story to at least 3 people"]
  },
  qp_cha_11b: {
    title: "Influence",
    desc: "Convince others of your vision.",
    subQuests: ["Successfully convince a person of a proposal that benefits both"]
  },
  qp_cha_11c: {
    title: "Empathic Bridge",
    desc: "Understand the true motives of your counterpart.",
    subQuests: ["Have a deep conversation about another person's goals and fears without giving advice yourself"]
  },
  qp_cha_12: {
    title: "Aura of the Leader",
    desc: "Become the gravitational center of your network.",
    subQuests: ["Organize and lead a successful event or meeting with at least 5 participants"]
  }
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

export const OPERATION_EN_OVERRIDES = {
  op_dawn_disciplin: {
    title: "Operation Dawn Discipline",
    desc: "Establish an unshakeable morning routine for maximum efficiency.",
    steps: [
      { title: "Morning Routine Stage 1: Wake up before 6:30 AM and 5 min stretching" },
      { title: "Morning Routine Stage 2: No smartphone in the first 60 minutes" },
      { title: "Morning Routine Stage 3: 45 min deep work before breakfast" }
    ]
  },
  op_iron_forge: {
    title: "Operation Iron Forge",
    desc: "Break through physical plateaus through progressive strength increases.",
    steps: [
      { title: "Forge Stage 1: Complete 30 min of intense strength training" },
      { title: "Forge Stage 2: Perform a new personal record in a basic exercise" },
      { title: "Forge Stage 3: Complete a high-intensity full-body workout to muscle failure" }
    ]
  },
  op_mind_fortress: {
    title: "Operation Mind Fortress",
    desc: "Maximize your cognitive resilience and deep work capacity.",
    steps: [
      { title: "Fortress Stage 1: 45 min of uninterrupted learning without distraction" },
      { title: "Fortress Stage 2: Create a visual mind map or summary of the learned material" },
      { title: "Fortress Stage 3: Write a technical essay or script about the new skill" },
      { title: "Fortress Stage 4: Solve a complex logical problem or complete a difficult exam" }
    ]
  },
  op_vitality_reset: {
    title: "Operation Vitality Reset",
    desc: "Detoxify your body and completely recharge your biological reserves.",
    steps: [
      { title: "Reset Stage 1: Consume 3 liters of pure water and 0% sugar today" },
      { title: "Reset Stage 2: 12 hours of complete digital detox (all devices off)" },
      { title: "Reset Stage 3: 16 hours of intermittent fasting combined with a 1h walk in nature" }
    ]
  },
  op_social_expedition: {
    title: "Operation Social Expedition",
    desc: "Leave your social comfort zone and calibrate your charisma.",
    steps: [
      { title: "Expedition Stage 1: Send 3 unexpected thank-you messages to friends or family" },
      { title: "Expedition Stage 2: Start a challenging conversation with a stranger" },
      { title: "Expedition Stage 3: Give a speech in front of a group or mediate in an existing conflict" }
    ]
  },
  op_shadow_protocol: {
    title: "Operation Shadow Protocol",
    desc: "The ultimate stress test for the true Monarch.",
    steps: [
      { title: "Protocol Stage 1: 50 push-ups and 15 min stretching immediately after waking up" },
      { title: "Protocol Stage 2: Complete a 10 km run or 1 hour of intense cardio training" },
      { title: "Protocol Stage 3: 5 minutes of cold exposure (ice bath or cold shower)" },
      { title: "Protocol Stage 4: Complete 200 burpees and 200 squats within 30 minutes" }
    ]
  },
  op_digital_detox: {
    title: "Operation Digital Detox",
    desc: "Free your mind from digital noise.",
    steps: [
      { title: "Detox Stage 1: 4 hours without social media" },
      { title: "Detox Stage 2: A whole day without entertainment media" },
      { title: "Detox Stage 3: 48 hours complete smartphone detox" }
    ]
  },
  op_midnight_grind: {
    title: "Operation Midnight Grind",
    desc: "Use the silence of the night for extreme progress.",
    steps: [
      { title: "Grind Stage 1: Work on a project for 1 hour after 10 PM" },
      { title: "Grind Stage 2: Complete 3 quests between 12 AM and 3 AM" },
      { title: "Grind Stage 3: Reach a milestone in complete nocturnal isolation" },
      { title: "Grind Stage 4: Work continuously from 12 AM to 5 AM on your main goal" }
    ]
  },
  op_wealth_builder: {
    title: "Operation Wealth Builder",
    desc: "Take absolute control over your resources.",
    steps: [
      { title: "Wealth Stage 1: Track every cent of your expenses for 3 days" },
      { title: "Wealth Stage 2: Eliminate 2 unnecessary expenses or subscriptions" },
      { title: "Wealth Stage 3: Create an investment or savings plan for the next 12 months" }
    ]
  },
  op_community_pillar: {
    title: "Operation Community Pillar",
    desc: "Become a supporting pillar of your social network.",
    steps: [
      { title: "Community Stage 1: Proactively and unconditionally offer help to one person" },
      { title: "Community Stage 2: Organize a meetup for at least 3 people" },
      { title: "Community Stage 3: Take a leadership role in a community project" }
    ]
  }
};

export function localizeOperation(op, locale) {
  if (!op) return op;
  if (locale !== "en") return op;
  const override = OPERATION_EN_OVERRIDES[op.id];
  if (!override) return op;
  return {
    ...op,
    title: override.title || op.title,
    desc: override.desc || op.desc,
    steps: op.steps.map((step, idx) => ({
      ...step,
      title: override.steps?.[idx]?.title || step.title
    }))
  };
}
