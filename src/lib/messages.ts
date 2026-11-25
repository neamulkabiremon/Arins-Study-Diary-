import type { MotivationalMessage } from "./types";
import { messageDayIndex } from "./dates";

/**
 * 30 rotating quotes from beloved books — one per day (cycles every month).
 * Short reflection prompts keep Arin moving after the inspiration lands.
 */
export const MOTIVATIONAL_MESSAGES: MotivationalMessage[] = [
  {
    id: 1,
    text: "It is only with the heart that one can see rightly; what is essential is invisible to the eye.",
    action: "Name one reason your hardest subject matters to the life you want.",
    source: "The Little Prince — Antoine de Saint-Exupéry",
  },
  {
    id: 2,
    text: "You have power over your mind — not outside events. Realize this, and you will find strength.",
    action: "Spend five quiet minutes on the Frog before opening anything else.",
    source: "Meditations — Marcus Aurelius",
  },
  {
    id: 3,
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    action: "Protect one focused block today — phone in another room.",
    source: "Will Durant on Aristotle — The Story of Philosophy",
  },
  {
    id: 4,
    text: "The secret of getting ahead is getting started.",
    action: "Open the first page of today’s hardest chapter and underline one line.",
    source: "Mark Twain",
  },
  {
    id: 5,
    text: "Whether you think you can, or you think you can’t — you’re right.",
    action: "Write one sentence that starts with “I can finish…” for today’s Frog.",
    source: "Henry Ford",
  },
  {
    id: 6,
    text: "Do not wait; the time will never be ‘just right.’",
    action: "Begin before you feel ready — two minutes of real work counts.",
    source: "Think and Grow Rich — Napoleon Hill",
  },
  {
    id: 7,
    text: "If you are working on something exciting that you really care about, you don’t have to be pushed. The vision pulls you.",
    action: "Reconnect today’s list to your medical / engineering dream in one line.",
    source: "Steve Jobs",
  },
  {
    id: 8,
    text: "A journey of a thousand miles begins with a single step.",
    action: "Take the tiniest first step on the task you’ve been postponing.",
    source: "Tao Te Ching — Lao Tzu",
  },
  {
    id: 9,
    text: "It always seems impossible until it’s done.",
    action: "Break the Frog into one question you can finish in ten minutes.",
    source: "Nelson Mandela",
  },
  {
    id: 10,
    text: "Success is the sum of small efforts, repeated day in and day out.",
    action: "Complete one small task fully — then tick it with pride.",
    source: "Robert Collier",
  },
  {
    id: 11,
    text: "Eat a live frog first thing in the morning, and nothing worse will happen to you the rest of the day.",
    action: "Touch your Frog task before anything lighter on the list.",
    source: "Eat That Frog! — Brian Tracy",
  },
  {
    id: 12,
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    action: "Set a simple system for tonight: timer on, one subject, no tabs.",
    source: "Atomic Habits — James Clear",
  },
  {
    id: 13,
    text: "Every action you take is a vote for the type of person you wish to become.",
    action: "Cast one vote today: finish a block you promised yourself.",
    source: "Atomic Habits — James Clear",
  },
  {
    id: 14,
    text: "The person who moves a mountain begins by carrying away small stones.",
    action: "Carry one small stone — revise three flashcards or one worked example.",
    source: "Confucius",
  },
  {
    id: 15,
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    action: "Notice one skill you’re building this week — write it in the margin.",
    source: "Zig Ziglar",
  },
  {
    id: 16,
    text: "Deep work is the ability to focus without distraction on a cognitively demanding task.",
    action: "Give yourself one distraction-free stretch for the next study block.",
    source: "Deep Work — Cal Newport",
  },
  {
    id: 17,
    text: "Grit is passion and perseverance for long-term goals.",
    action: "Return to a topic you quit yesterday — five honest minutes only.",
    source: "Grit — Angela Duckworth",
  },
  {
    id: 18,
    text: "Becoming is better than being.",
    action: "Treat today’s mistakes as practice, not proof. Fix one wrong answer.",
    source: "Mindset — Carol S. Dweck",
  },
  {
    id: 19,
    text: "When we are no longer able to change a situation, we are challenged to change ourselves.",
    action: "Change one small condition: clearer desk, water bottle, quieter playlist.",
    source: "Man’s Search for Meaning — Viktor E. Frankl",
  },
  {
    id: 20,
    text: "And, when you want something, all the universe conspires in helping you to achieve it.",
    action: "Want the next hour clearly — then open the notebook and begin.",
    source: "The Alchemist — Paulo Coelho",
  },
  {
    id: 21,
    text: "I am not afraid of storms, for I am learning how to sail my ship.",
    action: "Face one stormy chapter bravely — sail through the first section.",
    source: "Little Women — Louisa May Alcott",
  },
  {
    id: 22,
    text: "It is our choices that show what we truly are, far more than our abilities.",
    action: "Choose the harder useful task for the next twenty-five minutes.",
    source: "Harry Potter and the Chamber of Secrets — J.K. Rowling",
  },
  {
    id: 23,
    text: "There is no substitute for hard work.",
    action: "Skip the perfect setup. Sit down and work for one honest block.",
    source: "Thomas A. Edison",
  },
  {
    id: 24,
    text: "The future belongs to those who believe in the beauty of their dreams.",
    action: "Picture one beautiful day after exams — then earn ten minutes toward it.",
    source: "Eleanor Roosevelt",
  },
  {
    id: 25,
    text: "Start where you are. Use what you have. Do what you can.",
    action: "Use today’s notes as they are — no rewriting the whole world first.",
    source: "Arthur Ashe",
  },
  {
    id: 26,
    text: "Energy and persistence conquer all things.",
    action: "Persist through one messy problem until the method clicks.",
    source: "Benjamin Franklin",
  },
  {
    id: 27,
    text: "The only way to do great work is to love what you do.",
    action: "Find one spark of curiosity in today’s subject and follow it for a page.",
    source: "Steve Jobs",
  },
  {
    id: 28,
    text: "Courage doesn’t always roar. Sometimes courage is the quiet voice at the end of the day saying, ‘I will try again tomorrow.’",
    action: "If yesterday slipped, try again gently — five calm minutes now.",
    source: "Mary Anne Radmacher",
  },
  {
    id: 29,
    text: "Learning never exhausts the mind.",
    action: "Learn one crisp definition out loud — teach it to an empty chair.",
    source: "Leonardo da Vinci",
  },
  {
    id: 30,
    text: "The expert in anything was once a beginner.",
    action: "Beginner’s mind: open the book without judging how far you still have to go.",
    source: "Helen Hayes",
  },
];

export function messageForDate(dateStr: string): MotivationalMessage {
  const index = messageDayIndex(dateStr);
  return MOTIVATIONAL_MESSAGES[index]!;
}
