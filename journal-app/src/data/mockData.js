export const entries = [
  {
    id: 1,
    date: '2026-04-21',
    title: 'A quiet Monday',
    content: "Woke up to the sound of rain tapping against the window. There's something deeply comforting about a grey morning when you have nowhere to be. Made a proper cup of coffee — not the quick espresso shot I usually grab — but a slow pour-over that filled the kitchen with warmth.\n\nSpent the first hour just reading. No phone, no notifications. Just me and the book I've been putting off for months. I forgot what it felt like to be fully present in a story.\n\nSometimes the best days are the ones with the least in them.",
    mood: '😌',
    moodLabel: 'Peaceful',
    moodScore: 4,
    tags: ['morning', 'slow living', 'gratitude'],
    readTime: '2 min',
    wordCount: 112,
    color: '#9D8FFF',
  },
  {
    id: 2,
    date: '2026-04-19',
    title: 'Creative block & breakthrough',
    content: "Hit a wall today. Sat in front of my sketchbook for two hours and produced absolute nothing. The blank page just stared back at me, judging. I almost gave up around noon.\n\nThen I went for a walk. No destination, no podcast — just movement and noise of the city. Saw a child drawing on the pavement with chalk. Giant swirling suns, stick figures holding hands.\n\nCame back home and filled five pages without stopping.",
    mood: '✨',
    moodLabel: 'Inspired',
    moodScore: 5,
    tags: ['creativity', 'art', 'breakthrough'],
    readTime: '2 min',
    wordCount: 97,
    color: '#FFB563',
  },
  {
    id: 3,
    date: '2026-04-17',
    title: 'Hard conversation',
    content: "Had the talk with Alex today. We've both been dancing around it for weeks. It went better than I feared but harder than I hoped. There were long silences I didn't try to fill, which felt like growth.\n\nI'm learning that love sometimes looks like honesty even when honesty is uncomfortable. We didn't resolve everything but we said the real things.",
    mood: '💙',
    moodLabel: 'Reflective',
    moodScore: 3,
    tags: ['relationships', 'growth', 'honesty'],
    readTime: '1 min',
    wordCount: 74,
    color: '#5EC5FF',
  },
  {
    id: 4,
    date: '2026-04-15',
    title: 'First run in weeks',
    content: "Dragged myself out of bed at 6:30. Didn't feel like it — frankly never does. But twenty minutes in, something shifted. The music dropped to a bridge and my legs found a rhythm they remembered from somewhere.\n\nFinished 5k. Nothing impressive but everything felt earned. Stretching on the doorstep watching the street wake up around me. Coffee tasted unbelievable afterward.",
    mood: '⚡',
    moodLabel: 'Energized',
    moodScore: 5,
    tags: ['health', 'running', 'morning'],
    readTime: '1 min',
    wordCount: 82,
    color: '#5EFFD1',
  },
  {
    id: 5,
    date: '2026-04-13',
    title: 'Overwhelmed',
    content: "Everything piled up today. The kind of day where tasks multiply faster than I can finish them and by evening I'd finished nothing properly. Anxiety sat like a stone in my chest all afternoon.\n\nBut I made a list. Just writing things down helped. And then I did one thing. Just one. And then another. Tomorrow will be better.",
    mood: '😔',
    moodLabel: 'Low',
    moodScore: 2,
    tags: ['anxiety', 'overwhelm', 'coping'],
    readTime: '1 min',
    wordCount: 68,
    color: '#FF7EB3',
  },
  {
    id: 6,
    date: '2026-04-11',
    title: 'Perfect dinner party',
    content: "Four people. Eight hours. The kind of evening you don't want to end so you order more wine and start talking about things that matter. Philosophy, childhood memories, wildest dreams, deepest fears.\n\nThere's a specific magic to a table of people choosing to be honest with each other. I went home feeling full in a way that had nothing to do with food.",
    mood: '🥂',
    moodLabel: 'Joyful',
    moodScore: 5,
    tags: ['friends', 'connection', 'joy'],
    readTime: '2 min',
    wordCount: 78,
    color: '#FF7EB3',
  },
]

export const moods = [
  { emoji: '😔', label: 'Low', score: 1, color: '#5EC5FF' },
  { emoji: '😕', label: 'Meh', score: 2, color: '#9D8FFF' },
  { emoji: '😌', label: 'Okay', score: 3, color: '#FFB563' },
  { emoji: '😊', label: 'Good', score: 4, color: '#5EFFD1' },
  { emoji: '🤩', label: 'Great', score: 5, color: '#FF7EB3' },
]

export const weeklyMoods = [
  { day: 'Mon', score: 3, emoji: '😌' },
  { day: 'Tue', score: 5, emoji: '🤩' },
  { day: 'Wed', score: 2, emoji: '😕' },
  { day: 'Thu', score: 4, emoji: '😊' },
  { day: 'Fri', score: 5, emoji: '🤩' },
  { day: 'Sat', score: 4, emoji: '😊' },
  { day: 'Sun', score: 3, emoji: '😌' },
]

export const moodHistory = [
  { date: '04/01', score: 3 }, { date: '04/02', score: 4 }, { date: '04/03', score: 5 },
  { date: '04/04', score: 3 }, { date: '04/05', score: 2 }, { date: '04/06', score: 3 },
  { date: '04/07', score: 4 }, { date: '04/08', score: 5 }, { date: '04/09', score: 5 },
  { date: '04/10', score: 4 }, { date: '04/11', score: 5 }, { date: '04/12', score: 3 },
  { date: '04/13', score: 2 }, { date: '04/14', score: 3 }, { date: '04/15', score: 5 },
  { date: '04/16', score: 4 }, { date: '04/17', score: 3 }, { date: '04/18', score: 4 },
  { date: '04/19', score: 5 }, { date: '04/20', score: 4 }, { date: '04/21', score: 4 },
]

export const calendarEntryDates = [1, 4, 7, 9, 11, 13, 15, 17, 19, 21]
export const calendarMoods = {
  1: '#9D8FFF', 4: '#FFB563', 7: '#5EFFD1', 9: '#FF7EB3',
  11: '#9D8FFF', 13: '#5EC5FF', 15: '#5EFFD1', 17: '#FFB563',
  19: '#FF7EB3', 21: '#9D8FFF'
}

export const tags = [
  'gratitude', 'morning', 'relationships', 'health', 'creativity',
  'growth', 'work', 'travel', 'food', 'books', 'friends', 'dreams'
]

export const stats = {
  totalEntries: 47,
  currentStreak: 12,
  longestStreak: 31,
  totalWords: 18420,
  avgMood: 3.8,
  mostUsedTag: 'gratitude',
}
