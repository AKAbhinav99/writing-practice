const CATEGORY_META = {
  everyday: { label: "Everyday Life", color: "#b5651d" },
  travel: { label: "Travel & Adventure", color: "#2f6fed" },
  nature: { label: "Nature & Seasons", color: "#2f9e44" },
  relationships: { label: "Relationships & Family", color: "#d6336c" },
  imagination: { label: "Imagination & Future", color: "#7048e8" },
  work: { label: "Work & Learning", color: "#5c6f8a" },
  science: { label: "Science & Discovery", color: "#0c8599" },
  celebrations: { label: "Celebrations & Milestones", color: "#e0a82e" },
};

const CUSTOM_SET = {
  id: "custom",
  category: null,
  title: "Freeform Writing",
  words: [],
  prompt: "Write about anything you'd like — there's no required topic or word list this time.",
};

const PRACTICE_SETS = [
  { id: 1, category: "everyday", title: "The Coffee Shop Window Seat", words: ["aroma", "hurried", "regulars", "steam", "notebook", "drizzle", "barista", "lingered", "familiar"], prompt: "Write about an ordinary morning at a coffee shop that turns out to be more interesting than expected." },
  { id: 2, category: "everyday", title: "Power Outage", words: ["flicker", "candle", "silence", "generator", "flashlight", "neighbors", "stranded", "melted", "glow"], prompt: "Describe what happens when the power goes out in your home for an entire evening." },
  { id: 3, category: "everyday", title: "The Grocery Run", words: ["aisle", "cart", "coupon", "impulse", "checkout", "forgotten", "receipt", "crowded", "basket"], prompt: "Write about a quick trip to the grocery store that doesn't go as planned." },
  { id: 4, category: "everyday", title: "Laundry Day", words: ["detergent", "tangled", "static", "folded", "missing", "sock", "dryer", "wrinkled", "pile"], prompt: "Describe the small chaos of doing laundry for an entire household." },
  { id: 5, category: "everyday", title: "Rainy Commute", words: ["umbrella", "puddle", "soaked", "traffic", "fogged", "honking", "shortcut", "drenched", "delayed"], prompt: "Write about commuting to work or school during a sudden downpour." },
  { id: 6, category: "everyday", title: "Sunday Cleaning", words: ["clutter", "dust", "vacuum", "sorted", "donate", "scrubbed", "reorganized", "spotless", "fresh"], prompt: "Describe a Sunday spent deep-cleaning a space you've been putting off." },
  { id: 7, category: "everyday", title: "The Broken Appliance", words: ["sputtered", "warranty", "manual", "repairman", "jammed", "sparks", "frustrated", "replaced", "hum"], prompt: "Write about an appliance that broke at the worst possible time and what you did about it." },

  { id: 8, category: "travel", title: "Lost in a New City", words: ["unfamiliar", "alleyway", "map", "signage", "wandered", "dialect", "landmark", "courage", "eventually"], prompt: "Write about getting lost in a city you've never visited before." },
  { id: 9, category: "travel", title: "The Overnight Train", words: ["compartment", "rattling", "border", "passport", "bunk", "stranger", "horizon", "lull", "dawn"], prompt: "Describe a long train journey, real or imagined, and who you meet along the way." },
  { id: 10, category: "travel", title: "Camping Under the Stars", words: ["tent", "campfire", "crackling", "mosquito", "lantern", "ember", "owl", "marshmallow", "constellation"], prompt: "Write about a night spent camping far from city lights." },
  { id: 11, category: "travel", title: "Missed Flight", words: ["boarding", "gate", "layover", "frantic", "rebooked", "terminal", "exhausted", "standby", "refund"], prompt: "Describe the chaos of missing a flight and how you handle it." },
  { id: 12, category: "travel", title: "The Mountain Hike", words: ["summit", "switchback", "blister", "altitude", "trailhead", "breathless", "ridge", "descent", "vista"], prompt: "Write about a hike that pushes you further than you expect." },
  { id: 13, category: "travel", title: "Souvenir Market", words: ["haggling", "vendor", "trinket", "currency", "woven", "spices", "bargain", "foreign", "bustling"], prompt: "Describe shopping for souvenirs in a bustling foreign market." },

  { id: 14, category: "nature", title: "First Snow", words: ["flurries", "frost", "mittens", "sled", "hush", "glistening", "footprints", "chimney", "hibernate"], prompt: "Write about the first snowfall of the year and how it changes the day." },
  { id: 15, category: "nature", title: "Garden in Bloom", words: ["blossom", "trowel", "compost", "pollinator", "trellis", "fragrant", "weeds", "harvest", "sprout"], prompt: "Describe tending a garden as it comes into bloom." },
  { id: 16, category: "nature", title: "Thunderstorm Rolling In", words: ["thunderclap", "gust", "downpour", "lightning", "shelter", "soggy", "gutter", "rumble", "electric"], prompt: "Write about a thunderstorm that catches everyone off guard." },
  { id: 17, category: "nature", title: "Autumn Walk", words: ["crisp", "foliage", "rustling", "acorn", "amber", "crunch", "breeze", "bonfire", "sweater"], prompt: "Describe a walk through the neighborhood on a crisp autumn afternoon." },
  { id: 18, category: "nature", title: "Desert at Dawn", words: ["mirage", "dune", "scorching", "cactus", "mesa", "shimmer", "canyon", "sparse", "sunrise"], prompt: "Write about crossing a desert landscape just as the sun comes up." },
  { id: 19, category: "nature", title: "Tide Pools at the Beach", words: ["anemone", "barnacle", "receding", "shoreline", "salty", "crab", "kelp", "foam", "briny"], prompt: "Describe exploring tide pools at low tide along a rocky shoreline." },

  { id: 20, category: "relationships", title: "Reconnecting with an Old Friend", words: ["nostalgia", "awkward", "reminisced", "unchanged", "distance", "laughter", "hesitant", "warmth", "coincidence"], prompt: "Write about running into an old friend you haven't seen in years." },
  { id: 21, category: "relationships", title: "Sunday Dinner with the Family", words: ["simmering", "mismatched", "bicker", "leftovers", "tradition", "boisterous", "gravy", "dishes", "toast"], prompt: "Describe a noisy, chaotic Sunday dinner with your family." },
  { id: 22, category: "relationships", title: "The Hard Conversation", words: ["uncertainty", "lump", "honesty", "stillness", "trembling", "relief", "apology", "vulnerable", "understanding"], prompt: "Write about finally having a conversation you'd been avoiding." },
  { id: 23, category: "relationships", title: "Becoming a Sibling Again", words: ["nursery", "sleepless", "swaddled", "lullaby", "jealousy", "tiny", "weary", "bond", "adjustment"], prompt: "Describe what it's like welcoming a new baby into the family." },
  { id: 24, category: "relationships", title: "A New Neighbor", words: ["introduction", "casserole", "curious", "fence", "borrowed", "shy", "friendly", "unexpected", "welcome"], prompt: "Write about meeting a new neighbor for the first time." },
  { id: 25, category: "relationships", title: "A Broken Promise", words: ["betrayal", "excuse", "disappointment", "trust", "confront", "forgive", "quiet", "resentment", "closure"], prompt: "Describe what happens after someone breaks an important promise to you." },

  { id: 26, category: "imagination", title: "A City a Hundred Years From Now", words: ["hologram", "skyline", "autonomous", "solar", "transit", "towering", "algorithm", "gleaming", "vertical"], prompt: "Imagine a city a hundred years from now and describe a single day living in it." },
  { id: 27, category: "imagination", title: "The Last Library on Earth", words: ["archive", "ancient", "dim", "shelves", "forbidden", "guardian", "whisper", "preserve", "secret"], prompt: "Imagine the last library left on Earth and who still guards it." },
  { id: 28, category: "imagination", title: "If Animals Could Talk", words: ["translator", "opinionated", "sarcastic", "confess", "gossip", "perspective", "bewildered", "hilarious", "revelation"], prompt: "Imagine animals could suddenly talk and write about the first conversation someone has with their pet." },
  { id: 29, category: "imagination", title: "A Letter to Your Future Self", words: ["reflection", "promise", "uncertain", "hopeful", "wonder", "regret", "milestone", "advice", "growth"], prompt: "Write a letter to yourself ten years from now." },
  { id: 30, category: "imagination", title: "Time Travel Mishap", words: ["paradox", "vortex", "anachronism", "warp", "baffled", "coordinates", "glitch", "reroute", "instant"], prompt: "Imagine a time machine malfunctions mid-jump and write about what happens next." },
  { id: 31, category: "imagination", title: "Underwater City", words: ["submerged", "bioluminescent", "current", "airlock", "coral", "pressurized", "drifting", "luminous", "dome"], prompt: "Imagine a city built beneath the ocean and describe daily life there." },

  { id: 32, category: "work", title: "First Day at a New Job", words: ["badge", "orientation", "jittery", "cubicle", "onboarding", "introduce", "overwhelmed", "coworker", "schedule"], prompt: "Write about your first day at a new job." },
  { id: 33, category: "work", title: "The Big Presentation", words: ["slides", "rehearsed", "stammered", "audience", "podium", "applause", "confidence", "deadline", "feedback"], prompt: "Describe giving a big presentation that didn't go quite as planned." },
  { id: 34, category: "work", title: "Studying for the Exam", words: ["flashcards", "cram", "highlighter", "syllabus", "midterm", "caffeine", "procrastinate", "formula", "anxious"], prompt: "Write about pulling an all-nighter to study for a big exam." },
  { id: 35, category: "work", title: "Learning to Code", words: ["syntax", "debugging", "function", "error", "breakthrough", "tutorial", "loop", "persistence", "satisfying"], prompt: "Describe the experience of learning to code for the first time." },
  { id: 36, category: "work", title: "The Job Interview", words: ["resume", "handshake", "panel", "composed", "qualifications", "uneasy", "offer", "negotiate", "rapport"], prompt: "Write about walking into a job interview that mattered a lot to you." },
  { id: 37, category: "work", title: "A Mentor's Advice", words: ["guidance", "humility", "patience", "wisdom", "mistake", "clarity", "gratitude", "pivotal", "encouragement"], prompt: "Describe a piece of advice from a mentor that changed how you think." },

  { id: 38, category: "science", title: "The Science Fair Project", words: ["hypothesis", "beaker", "experiment", "variable", "combustion", "observation", "eureka", "malfunction", "data"], prompt: "Write about building a science fair project that almost didn't work." },
  { id: 39, category: "science", title: "Stargazing", words: ["telescope", "nebula", "galaxy", "infinite", "eclipse", "twinkling", "observatory", "awe", "cosmos"], prompt: "Describe a night spent stargazing through a telescope." },
  { id: 40, category: "science", title: "The Fossil Dig", words: ["excavation", "sediment", "prehistoric", "brush", "fragment", "paleontologist", "layer", "extinct", "discovery"], prompt: "Write about uncovering a fossil on an archaeological dig." },
  { id: 41, category: "science", title: "A Trip to the Aquarium", words: ["tank", "jellyfish", "translucent", "tide", "exhibit", "predator", "mesmerized", "glass", "ripple"], prompt: "Describe a visit to an aquarium that left you amazed." },
  { id: 42, category: "science", title: "The Volcano Documentary", words: ["magma", "eruption", "seismic", "ash", "dormant", "crater", "molten", "tremor", "evacuate"], prompt: "Write about watching a volcano documentary and what stayed with you." },
  { id: 43, category: "science", title: "A Lesson on the Human Brain", words: ["neuron", "synapse", "memory", "cognition", "reflex", "electrical", "pathway", "fascinating", "complexity"], prompt: "Describe what you learned in a class about how the human brain works." },

  { id: 44, category: "celebrations", title: "Graduation Day", words: ["cap", "gown", "diploma", "proud", "sentimental", "cheering", "tassel", "threshold", "bittersweet"], prompt: "Write about the day you graduated and how it felt to cross that stage." },
  { id: 45, category: "celebrations", title: "The Surprise Party", words: ["confetti", "balloon", "hushed", "reveal", "gasp", "decorations", "sneaking", "candles", "overjoyed"], prompt: "Describe planning or attending a surprise party that almost got ruined." },
  { id: 46, category: "celebrations", title: "A Wedding to Remember", words: ["vows", "bouquet", "speech", "ceremony", "giddy", "reception", "embrace", "tearful", "celebration"], prompt: "Write about a wedding you'll never forget, whether it was yours or someone else's." },
  { id: 47, category: "celebrations", title: "New Year's Resolution", words: ["countdown", "fireworks", "resolve", "intention", "midnight", "sparkle", "ambitious", "renewal", "anticipation"], prompt: "Describe the resolution you made this year and whether you've kept it." },
  { id: 48, category: "celebrations", title: "The Retirement Party", words: ["decades", "legacy", "farewell", "plaque", "stories", "colleagues", "tribute", "chapter", "appreciation"], prompt: "Write about a retirement party for someone who shaped your career." },
  { id: 49, category: "celebrations", title: "Welcoming a New Pet", words: ["adoption", "leash", "skittish", "affection", "routine", "playful", "rescue", "timid", "companion"], prompt: "Describe the first week of bringing home a new pet." },
  { id: 50, category: "celebrations", title: "An Unexpected Award", words: ["nomination", "ovation", "disbelief", "spotlight", "acceptance", "humbled", "recognition", "trophy", "speechless"], prompt: "Write about winning an award you never expected to receive." },
];
