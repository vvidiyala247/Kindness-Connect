export type Prompt = {
  emoji: string;
  headline: string;
  body: string;
};

export const DAILY_PROMPTS: Prompt[] = [
  {
    emoji: "🌟",
    headline: "Did someone make you smile today?",
    body: "Even a small kind moment is worth sharing — it might inspire someone else!",
  },
  {
    emoji: "💛",
    headline: "Has anyone been extra kind to you recently?",
    body: "Share a kindness act and spread some good vibes to your school.",
  },
  {
    emoji: "🌈",
    headline: "Something good happened today?",
    body: "Big or small — your story could brighten someone else's day.",
  },
  {
    emoji: "🤝",
    headline: "Did a classmate help you out?",
    body: "Give them a shoutout — anonymously celebrate the kindness around you.",
  },
  {
    emoji: "☀️",
    headline: "What made today a little better?",
    body: "Sharing positivity is contagious. Start a kindness chain in your school!",
  },
  {
    emoji: "💪",
    headline: "Feeling something on your mind?",
    body: "You don't have to go through it alone. Share and let your community lift you up.",
  },
  {
    emoji: "🎉",
    headline: "Did you do something kind today?",
    body: "Even the smallest act of kindness matters. Tell us about it!",
  },
  {
    emoji: "🌸",
    headline: "Notice any kindness in your school today?",
    body: "Someone holding a door, sharing a pencil — small things add up!",
  },
  {
    emoji: "❤️",
    headline: "Someone could use your encouragement right now.",
    body: "Check the feed and leave a kind comment, or share your own story.",
  },
  {
    emoji: "✨",
    headline: "You have a superpower: kindness.",
    body: "Share a moment — your words can make a real difference for a classmate.",
  },
  {
    emoji: "🦁",
    headline: "It takes courage to ask for help.",
    body: "If something is hard right now, sharing it here is a brave first step.",
  },
  {
    emoji: "🌻",
    headline: "Think of one person who made your week better.",
    body: "Share their kindness — let everyone know good people are out there!",
  },
  {
    emoji: "🎈",
    headline: "Did a teacher go out of their way for you?",
    body: "Teachers do amazing things. Celebrate them with a kindness post!",
  },
  {
    emoji: "🙌",
    headline: "Did someone include you when you felt left out?",
    body: "That kind of act deserves to be celebrated. Share it!",
  },
  {
    emoji: "💬",
    headline: "Struggling with something? That's okay.",
    body: "Post anonymously and let your community show up for you.",
  },
  {
    emoji: "🐣",
    headline: "Every kind word plants a seed.",
    body: "What seed will you plant today? Share a kindness act or ask for support.",
  },
  {
    emoji: "🎵",
    headline: "Good vibes are contagious!",
    body: "Share a happy moment from your day — let's fill the feed with kindness.",
  },
  {
    emoji: "🤗",
    headline: "Did someone cheer you up when you were sad?",
    body: "That's a true kindness act. Share the love and let others know!",
  },
  {
    emoji: "🌍",
    headline: "Be the change you want to see.",
    body: "Start with a kind post — one story can inspire your whole school.",
  },
  {
    emoji: "⭐",
    headline: "You matter to this community.",
    body: "Your voice, your story, your kindness — share it. We're all here for it.",
  },
  {
    emoji: "🦋",
    headline: "Sometimes the quietest acts are the kindest.",
    body: "Share a small moment that meant a lot to you today.",
  },
  {
    emoji: "🏅",
    headline: "Give a shoutout to an unsung hero in your school.",
    body: "Someone deserves to be celebrated — and they don't even know it yet!",
  },
  {
    emoji: "🌊",
    headline: "Kindness ripples outward.",
    body: "Share your story and watch how it inspires others to do the same.",
  },
  {
    emoji: "🎯",
    headline: "Challenge: spot one act of kindness today.",
    body: "Look around — then come back and share what you found!",
  },
  {
    emoji: "🧡",
    headline: "Is something bothering you right now?",
    body: "Your school community cares. Post anonymously and you'll see.",
  },
  {
    emoji: "🌟",
    headline: "Did a friend stand up for you?",
    body: "Good friends are worth celebrating. Share that moment with everyone!",
  },
  {
    emoji: "💫",
    headline: "What's one thing you wish people knew you were going through?",
    body: "This is a safe space. Share it — you'll be surprised how many others feel the same.",
  },
  {
    emoji: "🎀",
    headline: "Did someone share something with you today?",
    body: "Sharing is one of the purest acts of kindness. Celebrate it here!",
  },
  {
    emoji: "🦄",
    headline: "Your kindness story could make someone's whole day.",
    body: "Don't keep it to yourself — share it and light someone else up!",
  },
  {
    emoji: "🔥",
    headline: "A community grows when everyone contributes.",
    body: "One post from you today could inspire ten more tomorrow.",
  },
];

export const KINDNESS_ACT_STARTERS: string[] = [
  "Someone held the door open for me and it really made me smile...",
  "A classmate helped me when I didn't understand the work today...",
  "I saw someone pick up rubbish without being asked — that was awesome!",
  "My friend shared their snack with me even though they didn't have much...",
  "Someone included me in their game when I was standing alone...",
  "A teacher stayed after class to help me understand something tricky...",
  "I witnessed two students making up after an argument — so cool to see!",
  "Someone noticed I was sad and asked if I was okay...",
  "A classmate gave me a compliment out of nowhere and it made my day!",
  "I helped someone carry their things when they dropped them...",
  "Someone saved me a seat at lunch today and it meant a lot!",
  "My friend cheered me on during PE even though I was struggling...",
];

export const SUPPORT_STARTERS: string[] = [
  "I've been feeling really left out lately and it's hard...",
  "I'm struggling with a subject at school and feel like I can't keep up...",
  "Someone said something unkind to me and I can't stop thinking about it...",
  "I've been feeling really anxious lately and don't know why...",
  "I'm having a hard time making friends and it's lonely...",
  "I feel like nobody really understands what I'm going through...",
  "I've been really tired and unmotivated and I'm not sure what to do...",
  "I messed up something important and I feel really bad about it...",
  "I feel like I'm not good enough sometimes...",
  "Things at home have been tough and it's affecting me at school...",
  "I'm nervous about something coming up and could use some encouragement...",
  "I feel like I'm always the one being left out of things...",
];

/**
 * Returns today's prompt index based on the current date.
 * Rotates through the full DAILY_PROMPTS array, cycling every N days.
 */
export function getTodayPrompt(): Prompt {
  const now = new Date();
  const dayOfYear =
    Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
        86400000
    );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

/**
 * Returns a localStorage key for today's dismiss state.
 * Key changes every day so the banner reappears on a new day.
 */
export function getTodayDismissKey(): string {
  const now = new Date();
  return `prompt_dismissed_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
}
