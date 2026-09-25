export interface PlanFeature {
  id: string;
  name: {
    en: string;
    ta: string;
  };
  free: boolean;
  pro: boolean;
  live: boolean;
  status?: 'ready' | 'soon';
}

export const PLAN_FEATURES: PlanFeature[] = [
  // Core Essentials (Free tier)
  {
    id: 'pyq',
    name: {
      en: 'Previous year questions (PYQ)',
      ta: 'முந்தைய ஆண்டு வினாத்தாள்கள் (PYQ)',
    },
    free: true,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'bookback',
    name: {
      en: 'Book-back one-word quiz',
      ta: 'புத்தக ஒரு மதிப்பெண் வினாடிவினா',
    },
    free: true,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'news',
    name: {
      en: 'Student updates & exam alerts',
      ta: 'மாணவர் செய்திகள் & தேர்வு அறிவிப்புகள்',
    },
    free: true,
    pro: true,
    live: true,
    status: 'ready',
  },

  // Pro Tier Features
  {
    id: 'solutions',
    name: {
      en: '🔑 Answer keys + step solutions',
      ta: '🔑 விடைக்குறிப்புகள் + செய்முறை விளக்கங்கள்',
    },
    free: false,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'concept',
    name: {
      en: '🧠 Concept quiz for all chapters',
      ta: '🧠 அனைத்து பாடங்களுக்கான கருத்தியல் தேர்வு',
    },
    free: false,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'ai-battles',
    name: {
      en: '⚡ AI pro quiz speed battles',
      ta: '⚡ AI வேக வினாடிவினா போட்டிகள்',
    },
    free: false,
    pro: true,
    live: true,
    status: 'soon',
  },
  {
    id: 'mock-exams',
    name: {
      en: '📝 Full-length timed mock exams',
      ta: '📝 மாதிரி முழு தேர்வுகள்',
    },
    free: false,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'topper-notes',
    name: {
      en: '📚 Topper notes & last-minute packs',
      ta: '📚 டாப்பர் குறிப்புகள் & கடைசி நேர கையேடுகள்',
    },
    free: false,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'important-ranks',
    name: {
      en: '🏆 Important questions & high-yield ranks',
      ta: '🏆 முக்கியமான வினாக்கள் & அதிக மதிப்பெண் வழிகாட்டல்',
    },
    free: false,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'coins-multiplier',
    name: {
      en: '🪙 2× coins on all tests forever',
      ta: '🪙 அனைத்து தேர்வுகளிலும் 2× நாணயங்கள்',
    },
    free: false,
    pro: true,
    live: true,
    status: 'ready',
  },
  {
    id: 'adaptive-daily',
    name: {
      en: '🎯 Adaptive daily quiz from weak chapters',
      ta: '🎯 பலவீனமான பாடங்களிலிருந்து தினசரி தேர்வு',
    },
    free: false,
    pro: true,
    live: true,
    status: 'soon',
  },
  {
    id: 'mastery-rings',
    name: {
      en: '⭕ Chapter mastery rings & visual tracker',
      ta: '⭕ பாட தேர்ச்சி வளையங்கள் & முன்னேற்ற வரைபடம்',
    },
    free: false,
    pro: true,
    live: true,
    status: 'soon',
  },
  {
    id: 'parent-report',
    name: {
      en: '📊 Detailed performance report card',
      ta: '📊 விரிவான தேர்வு அறிக்கை அட்டை',
    },
    free: false,
    pro: true,
    live: true,
    status: 'soon',
  },

  // Live Tier Features (Pro + Real Teacher)
  {
    id: 'live-classes',
    name: {
      en: '👨‍🏫 Weekly live interactive class per subject',
      ta: '👨‍🏫 பாடத்திற்கு வாராந்திர நேரலை வகுப்புகள்',
    },
    free: false,
    pro: false,
    live: true,
    status: 'ready',
  },
  {
    id: 'recordings',
    name: {
      en: '🎥 Class recordings library on-demand',
      ta: '🎥 நேரலை வகுப்பு பதிவுகள்',
    },
    free: false,
    pro: false,
    live: true,
    status: 'ready',
  },
  {
    id: 'doubt-chat',
    name: {
      en: '💬 24h teacher doubt-clearing chat',
      ta: '💬 24 மணி நேர ஆசிரியர் சந்தேக தீர்வு',
    },
    free: false,
    pro: false,
    live: true,
    status: 'ready',
  },
  {
    id: 'parent-whatsapp',
    name: {
      en: '📲 Parent WhatsApp progress alerts',
      ta: '📲 பெற்றோருக்கு WhatsApp முன்னேற்ற தகவல்',
    },
    free: false,
    pro: false,
    live: true,
    status: 'ready',
  },
  {
    id: 'study-plan',
    name: {
      en: '📋 1-on-1 personalized study plan',
      ta: '📋 தனிப்பயனாக்கப்பட்ட படிப்புத் திட்டம்',
    },
    free: false,
    pro: false,
    live: true,
    status: 'ready',
  },
  {
    id: 'certificate',
    name: {
      en: '📜 Official term completion certificate',
      ta: '📜 அதிகாரப்பூர்வ சான்றிதழ்',
    },
    free: false,
    pro: false,
    live: true,
    status: 'ready',
  },
];
