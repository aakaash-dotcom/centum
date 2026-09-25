import { Medium } from '@/types';

export interface LocalizedString {
  en: string;
  ta: string;
}

let activeLanguage: Medium = 'english';

export function setCurrentLanguage(lang: Medium) {
  activeLanguage = lang === 'tamil' ? 'tamil' : 'english';
}

export function getCurrentLanguage(): Medium {
  return activeLanguage;
}

export const rawTexts = {
  app: {
    name: { en: 'Centum', ta: 'Centum' },
    tagline: { en: '100 or nothing 💯', ta: '100 அல்லது எதுவும் இல்லை 💯' },
  },
  medium: {
    english: { en: 'English', ta: 'English' },
    tamil: { en: 'தமிழ்', ta: 'தமிழ்' },
  },
  classes: {
    c6: { en: '6th', ta: '6th' },
    c7: { en: '7th', ta: '7th' },
    c8: { en: '8th', ta: '8th' },
    c9: { en: '9th', ta: '9th' },
    c10: { en: '10th', ta: '10th' },
    c11: { en: '11th', ta: '11th' },
    c12: { en: '12th', ta: '12th' },
    soonBadge: { en: 'soon 👀', ta: 'விரைவில் 👀' },
    cookingToast: { en: 'chill, cooking this one 👨‍🍳', ta: 'பொறுங்க, ரெடி பண்ணிட்டு இருக்கோம் 👨‍🍳' },
  },
  streams: {
    scienceMaths: { en: 'Science — Maths', ta: 'அறிவியல் — கணிதம்' },
    scienceBio: { en: 'Science — Biology', ta: 'அறிவியல் — உயிரியல்' },
    commerce: { en: 'Commerce', ta: 'வணிகவியல்' },
    arts: { en: 'Arts', ta: 'கலைப்பிரிவு' },
  },
  categories: {
    pyq: { en: 'previous year questions', ta: 'முந்தைய ஆண்டு வினாக்கள்' },
    model: { en: 'model question papers', ta: 'மாதிரி வினாத்தாள்கள்' },
    important: { en: 'study materials', ta: 'படிப்புப் பொருட்கள்' },
    book: { en: 'text books', ta: 'பாடப் புத்தகங்கள்' },
  },
  examTypes: {
    all: { en: 'all exams 📄', ta: 'அனைத்து தேர்வுகள் 📄' },
    annual: { en: 'annual exam', ta: 'ஆண்டுத் தேர்வு' },
    quarterly: { en: 'quarterly', ta: 'காலாண்டுத் தேர்வு' },
    halfyearly: { en: 'half yearly', ta: 'அரையாண்டுத் தேர்வு' },
    revision: { en: 'revision test', ta: 'திருப்புதல் தேர்வு' },
    model: { en: 'model exam', ta: 'மாதிரித் தேர்வு' },
  },
  testTypes: {
    oneword: { en: 'Book-back One-words 📖', ta: 'புத்தக ஒரு மதிப்பெண் 📖' },
    concept: { en: 'Concept Quiz 🧠', ta: 'கருத்தியல் தேர்வு 🧠' },
    daily: { en: 'Quiz of the Day 🎯', ta: 'இன்றைய வினாடிவினா 🎯' },
    proQuiz: { en: 'Pro quiz — daily timed battle', ta: 'Pro வினாடிவினா — வேகப் போட்டி' },
    proPitch: {
      en: 'daily speed battles · timed rank · full leaderboard ⚡',
      ta: 'தினசரி வேகப் போட்டி · நேர தரவரிசை · லீடர்போர்டு ⚡',
    },
    conceptSampleNote: {
      en: 'chapter 1 is free — the rest glows behind Pro ✨',
      ta: 'பாடம் 1 இலவசம் — மற்றவை Pro-வில் கிடைக்கும் ✨',
    },
    ch1FreeSample: { en: 'ch 1 free sample 🎁', ta: 'பாடம் 1 இலவச மாதிரி 🎁' },
    allChapters: { en: 'all chapters', ta: 'அனைத்து பாடங்கள்' },
    startTest: { en: 'Start Test ⚡', ta: 'தேர்வு தொடங்கு ⚡' },
    startConfirmCta: { en: 'start →', ta: 'தொடங்கு →' },
    readyToStart: { en: 'Ready to start? ⚡', ta: 'தயாரா? ⚡' },
  },
  nav: {
    home: { en: 'Home', ta: 'முகப்பு' },
    materials: { en: 'Materials', ta: 'பொருட்கள்' },
    tests: { en: 'Tests', ta: 'தேர்வுகள்' },
    news: { en: 'News', ta: 'செய்திகள்' },
    profile: { en: 'Profile', ta: 'சுயவிவரம்' },
  },
  gate: {
    title: { en: 'Unlock everything ✨', ta: 'அனைத்தையும் திற ✨' },
    subtitle: { en: 'private. no spam calls. promise 🤙', ta: 'பாதுகாப்பானது. ஸ்பேம் கால்கள் இல்லை 🤙' },
    nameLabel: { en: 'Name', ta: 'பெயர்' },
    namePlaceholder: { en: 'your name', ta: 'உங்கள் பெயர்' },
    phoneLabel: { en: 'Mobile number', ta: 'மொபைல் எண்' },
    phonePlaceholder: { en: '10-digit number', ta: '10-இலக்க எண்' },
    passwordLabel: { en: 'Password', ta: 'கடவுச்சொல்' },
    passwordPlaceholder: { en: 'min 6 characters', ta: 'குறைந்தது 6 எழுத்துகள்' },
    standardLabel: { en: 'Standard', ta: 'வகுப்பு' },
    streamLabel: { en: 'Stream', ta: 'பிரிவு' },
    districtLabel: { en: 'District', ta: 'மாவட்டம்' },
    button: { en: 'Unlock everything ✨', ta: 'அனைத்தையும் திற ✨' },
    saving: { en: 'unlocking... 🚀', ta: 'திறக்கிறது... 🚀' },
    termsNotice: {
      en: 'joining = you agree to our terms & privacy ✍️',
      ta: 'இணைவதன் மூலம் விதிமுறைகளை ஏற்கிறீர்கள் ✍️',
    },
    loginSwitch: { en: 'already registered? log in 🔑', ta: 'ஏற்கனவே பதிவு செய்தவரா? உள்நுழைய 🔑' },
    registerSwitch: { en: 'new student? unlock here ✨', ta: 'புதிய மாணவரா? இங்கே திறக்கவும் ✨' },
    loginTitle: { en: 'Welcome back 🔑', ta: 'மீண்டும் வருக 🔑' },
    loginSubtitle: { en: 'log in with your phone & password', ta: 'மொபைல் எண் & கடவுச்சொல் மூலம் உள்நுழைக' },
    loginButton: { en: 'Log In ⚡', ta: 'உள்நுழை ⚡' },
    loggingIn: { en: 'logging in... ⚡', ta: 'உள்நுழைகிறது... ⚡' },
    setPasswordTitle: { en: 'Set your password 🔑', ta: 'கடவுச்சொல்லை அமைக்கவும் 🔑' },
    setPasswordSubtitle: { en: 'one-time setup for your account', ta: 'உங்கள் கணக்கிற்கான ஒருமுறை அமைப்பு' },
    newPasswordLabel: { en: 'New password', ta: 'புதிய கடவுச்சொல்' },
    confirmPasswordLabel: { en: 'Confirm password', ta: 'கடவுச்சொல்லை உறுதிப்படுத்துக' },
    setPasswordButton: { en: 'Save password & log in 🚀', ta: 'கடவுச்சொல் சேமித்து உள்நுழைக 🚀' },
    settingPassword: { en: 'saving password... 🚀', ta: 'கடவுச்சொல் சேமிக்கப்படுகிறது... 🚀' },
    passwordsDontMatch: { en: 'passwords do not match 🤦', ta: 'கடவுச்சொற்கள் பொருந்தவில்லை 🤦' },
    passwordTooShort: { en: 'password needs at least 6 characters 🔒', ta: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் வேண்டும் 🔒' },
    noAccountToast: {
      en: 'no account with this number — register first 🐣',
      ta: 'இந்த எண்ணில் கணக்கு இல்லை — முதலில் பதிவு செய்க 🐣',
    },
    wrongPasswordMsg: { en: 'wrong password 💥', ta: 'தவறான கடவுச்சொல் 💥' },
  },
  home: {
    chooseMedium: { en: 'choose your medium 🔀', ta: 'பயிற்று மொழியைத் தேர்ந்தெடுக்கவும் 🔀' },
    chooseClass: { en: 'choose your class 📚', ta: 'வகுப்பைத் தேர்ந்தெடுக்கவும் 📚' },
    streakActive: { en: 'days streak 🔥', ta: 'நாட்கள் தொடர் 🔥' },
    streakZero: { en: '0 days — restart? 💀', ta: '0 நாட்கள் — மீண்டும் தொடங்குவோமா? 💀' },
    streakSafe: { en: 'streak safe 🔥', ta: 'தொடர் பாதுகாப்பானது 🔥' },
    dailyQuizTitle: { en: 'Quiz of the Day 🎯', ta: 'இன்றைய வினாடிவினா 🎯' },
    dailyLockIn: { en: 'Lock in ⚡', ta: 'தொடங்கு ⚡' },
    dailySolved: { en: 'daily solved ✨', ta: 'இன்று முடிந்தது ✨' },
    leaderboardTitle: { en: 'Leaderboard 🏆', ta: 'லீடர்போர்டு 🏆' },
    windowLabel: { en: 'this week', ta: 'இந்த வாரம்' },
    points: { en: 'pts', ta: 'புள்ளிகள்' },
    testsDone: { en: 'tests', ta: 'தேர்வுகள்' },
    you: { en: 'you', ta: 'நீங்கள்' },
    exploreOtherClasses: { en: 'explore other classes 👀', ta: 'மற்ற வகுப்புகளைப் பார்க்க 👀' },
    backToMyHome: { en: 'back to my dashboard 🏠', ta: 'முகப்புக்குத் திரும்ப 🏠' },
    addPwaChip: { en: '📲 add centum to home screen', ta: '📲 Centum-ஐ முகப்புத் திரையில் சேர்க்க' },
  },
  states: {
    empty: { en: 'nothing here 🐶', ta: 'இங்கு எதுவும் இல்லை 🐶' },
    error: { en: 'the sheet ghosted us 👻 retry', ta: 'தகவல் கிடைக்கவில்லை 👻 மீண்டும் முயல்க' },
    signalGhost: { en: 'signal ghost 👻 retry', ta: 'இணைப்பு துண்டிக்கப்பட்டது 👻 மீண்டும் முயல்க' },
    loading: { en: 'loading... ⚡', ta: 'ஏற்றுகிறது... ⚡' },
    lost: { en: 'lost? home → 🏠', ta: 'முகப்புக்குச் செல்ல → 🏠' },
    demoFootnote: { en: 'demo content', ta: 'மாதிரி உள்ளடக்கம்' },
  },
  papers: {
    open: { en: 'Open', ta: 'திற' },
    view: { en: 'View 👁️', ta: 'பார் 👁️' },
    download: { en: 'Download ⬇', ta: 'பதிவிறக்கு ⬇' },
    previewTitle: { en: 'Paper Preview', ta: 'வினாத்தாள் பார்வை' },
    attribution: { en: 'shared for student study use', ta: 'மாணவர் பயிற்சிக்காக பகிரப்பட்டது' },
    yeThePaper: { en: 'ye the paper 🔥', ta: 'தாள் தயார் 🔥' },
    locked: { en: 'locked 🔒', ta: 'பூட்டப்பட்டது 🔒' },
    materialSoon: { en: 'material lands here soon 📄', ta: 'பொருள் விரைவில் வரும் 📄' },
    papersCount: { en: 'papers 📄', ta: 'வினாத்தாள்கள் 📄' },
    bothMediums: { en: 'both mediums 🔀', ta: 'இரு மொழிகளும் 🔀' },
    subjectFilter: { en: 'subject ▾', ta: 'பாடம் ▾' },
    examFilter: { en: 'exam type ▾', ta: 'தேர்வு வகை ▾' },
    allSubjects: { en: 'all subjects 📚', ta: 'அனைத்து பாடங்கள் 📚' },
  },
  tests: {
    headline: { en: 'Chapter Tests', ta: 'பாட வாரியான தேர்வுகள்' },
    subheadline: { en: 'speed drills & concept revision', ta: 'வேக தேர்வுகள் & கருத்தியல் திருப்புதல்' },
    allChapters: { en: 'all chapters', ta: 'அனைத்து பாடங்கள்' },
    chapterTest: { en: 'Chapter Test', ta: 'பாடத் தேர்வு' },
    pickSubjectPrompt: {
      en: 'pick a subject to see its tests 👇',
      ta: 'தேர்வுகளைப் பார்க்க பாடத்தைத் தேர்ந்தெடுக்கவும் 👇',
    },
    selectSubjectPlaceholder: { en: 'select subject ▾', ta: 'பாடம் தேர்ந்தெடுக்கவும் ▾' },
    proQuizBox: { en: '⚡ pro quiz — AI powered 🔒', ta: '⚡ Pro தேர்வு — AI வேகப் போட்டி 🔒' },
    bookBackLine1: { en: '📖 book-back', ta: '📖 புத்தக வினா' },
    bookBackLine2: { en: 'one-words', ta: 'ஒரு மதிப்பெண்' },
    bookBackOneWords: { en: 'book-back one-words', ta: 'புத்தக ஒரு மதிப்பெண்' },
    conceptQuiz: { en: 'concept quiz', ta: 'கருத்தியல் தேர்வு' },
    proQuizPitch: {
      en: 'daily speed battles · timed rank · full leaderboard ⚡',
      ta: 'தினசரி வேகப் போட்டி · நேர தரவரிசை · லீடர்போர்டு ⚡',
    },
    conceptSampleNote: {
      en: 'chapter 1 is free — the rest glows behind Pro ✨',
      ta: 'பாடம் 1 இலவசம் — மற்றவை Pro-வில் கிடைக்கும் ✨',
    },
    readyToStart: { en: 'ready to start ✨', ta: 'தொடங்கத் தயாரா ✨' },
    startConfirmCta: { en: 'start test →', ta: 'தேர்வு தொடங்கு →' },
    concept: { en: 'concept', ta: 'கருத்தியல்' },
    oneword: { en: 'book-back', ta: 'புத்தக வினா' },
    noChaptersYet: {
      en: 'no chapters uploaded yet for this subject 👨‍🍳',
      ta: 'இந்தப் பாடத்திற்கான தேர்வுகள் விரைவில் வரும் 👨‍🍳',
    },
    timeRemaining: { en: 'time left ⏳', ta: 'மீதமுள்ள நேரம் ⏳' },
    questionProgress: { en: 'q', ta: 'கேள்வி' },
    next: { en: 'Next ⚡', ta: 'அடுத்து ⚡' },
    finish: { en: 'Finish 🏁', ta: 'முடிக்க 🏁' },
    submitting: { en: 'calculating score... 🧮', ta: 'மதிப்பெண் கணக்கிடுகிறது... 🧮' },
    retake: { en: 'Retake 🔁', ta: 'மீண்டும் எடுக்க 🔁' },
    review: { en: 'Review 🔍', ta: 'மறுஆய்வு 🔍' },
    correct: { en: 'spot on 🎯', ta: 'சரியான விடை 🎯' },
    wrong: { en: 'missed it 💥', ta: 'தவறான விடை 💥' },
    yourPick: { en: 'your pick', ta: 'உங்கள் விடை' },
    correctAnswer: { en: 'correct answer', ta: 'சரியான விடை' },
    explanation: { en: 'explanation', ta: 'விளக்கம்' },
    accuracy: { en: 'Accuracy', ta: 'துல்லியம்' },
    timePerQ: { en: 'Time per question ⏱️', ta: 'ஒரு கேள்விக்கான நேரம் ⏱️' },
    score: { en: 'Score', ta: 'மதிப்பெண்' },
    perfectScore: { en: 'centum achieved! 👑💯', ta: 'Centum அடித்தாச்சு! 👑💯' },
    goodScore: { en: 'solid run! 🔥', ta: 'அருமையான முயற்சி! 🔥' },
    practiceMore: { en: 'cook more chapters 👨‍🍳', ta: 'இன்னும் பயிற்சி செய்க 👨‍🍳' },
  },
  news: {
    headline: { en: 'Student News 📰', ta: 'மாணவர் செய்திகள் 📰' },
    subheadline: { en: 'student updates & exam alerts', ta: 'மாணவர் செய்திகள் & தேர்வு அறிவிப்புகள்' },
    source: { en: 'read more ↗', ta: 'மேலும் படிக்க ↗' },
    allMedium: { en: 'All Updates', ta: 'அனைத்து செய்திகள்' },
  },
  membership: {
    cardTitle: { en: 'Centum Pro Membership', ta: 'Centum Pro உறுப்பினர்' },
    cardSubtitle: {
      en: 'Unlock all answer keys, mock exams & 2× coins',
      ta: 'அனைத்து விடைகள், மாதிரி தேர்வுகள் & 2× நாணயங்கள்',
    },
  },
  profile: {
    title: { en: 'Profile 👤', ta: 'சுயவிவரம் 👤' },
    greeting: { en: 'hey', ta: 'வணக்கம்' },
    badgeStudent: { en: 'TN Student', ta: 'TN மாணவர்' },
    statsTests: { en: 'Tests completed', ta: 'முடிந்த தேர்வுகள்' },
    statsAvgScore: { en: 'Average accuracy', ta: 'சராசரி துல்லியம்' },
    switchAccount: { en: 'switch account 🔄', ta: 'கணக்கு மாற 🔄' },
    unlockPrompt: { en: 'Guest Mode', ta: 'விருந்தினர் பயன்முறை' },
    unlockCta: { en: 'Unlock your profile ✨', ta: 'சுயவிவரத்தைத் திறக்கவும் ✨' },
    privacyLink: { en: 'privacy policy 🔒', ta: 'தனியுரிமைக் கொள்கை 🔒' },
    appearance: { en: 'appearance 🌗', ta: 'தோற்றம் 🌗' },
    themeLight: { en: 'light', ta: 'வெளிச்சம்' },
    themeDark: { en: 'dark', ta: 'இருள்' },
    mediumSetting: { en: 'medium 🔀', ta: 'பயிற்று மொழி 🔀' },
    shareCentum: { en: 'share centum 💜', ta: 'Centum-ஐப் பகிர்க 💜' },
    shareLine: { en: 'free TN board papers + tests', ta: 'இலவச TN வினாத்தாள்கள் + தேர்வுகள்' },
    adminLink: { en: 'founder console 🦉', ta: 'நிறுவனர் பக்கம் 🦉' },
    loginLink: { en: 'already registered? log in 🔑', ta: 'ஏற்கனவே பதிவு செய்தவரா? உள்நுழைய 🔑' },
    membershipCta: { en: 'Centum Pro member 💎', ta: 'Centum Pro உறுப்பினர் 💎' },
    myCoins: { en: 'My Coins 🪙', ta: 'என் நாணயங்கள் 🪙' },
  },
  privacy: {
    title: { en: 'Privacy & Policy 🔒', ta: 'தனியுரிமைக் கொள்கை 🔒' },
    back: { en: '← back', ta: '← பின் செல்' },
    promise: { en: 'private. no spam calls. promise 🤙', ta: 'பாதுகாப்பானது. ஸ்பேம் கால்கள் இல்லை 🤙' },
    section1Title: { en: 'Zero Spam Guarantee', ta: 'ஜீரோ ஸ்பேம் உத்தரவாதம்' },
    section1Text: {
      en: 'We only ask your name, mobile, district, and standard to personalize your Centum experience. We will never sell your number or call you with spam.',
      ta: 'உங்கள் Centum அனுபவத்தைத் தனிப்பயனாக்க மட்டுமே உங்கள் பெயர், மொபைல், மாவட்டம் மற்றும் வகுப்பைக் கேட்கிறோம். உங்கள் எண்ணை ஒருபோதும் விற்க மாட்டோம்.',
    },
    section2Title: { en: 'Government Document Fair Use', ta: 'அரசு ஆவணங்கள் பயன்பாடு' },
    section2Text: {
      en: 'All question papers, answer keys, blueprints, and model books are official TN documents shared for educational student use.',
      ta: 'அனைத்து வினாத்தாள்கள் மற்றும் மாதிரி புத்தகங்களும் மாணவர் கல்விப் பயிற்சிக்காக மட்டுமே பகிரப்படுகின்றன.',
    },
  },
  pricing: {
    title: { en: 'Membership 💎', ta: 'உறுப்பினர் திட்டம் 💎' },
    subtitle: { en: 'unlock centum power 🚀', ta: 'Centum முழு சக்தியைத் திறக்கவும் 🚀' },
    free: { en: 'Free', ta: 'Free' },
    pro: { en: 'Pro 👑', ta: 'Pro 👑' },
    live: { en: 'Live 🎥', ta: 'Live 🎥' },
    freePrice: { en: 'Free forever', ta: 'எப்போதும் இலவசம்' },
    proPrice: { en: 'Coming Soon', ta: 'விரைவில்' },
    proPerDay: { en: 'Special Early Offer', ta: 'சிறப்பு ஆரம்பச் சலுகை' },
    livePrice: { en: 'Coming Soon', ta: 'விரைவில்' },
    goPro: { en: 'Go Pro ⚡', ta: 'Pro ஆக மாறுக ⚡' },
    currentPlan: { en: 'Current Plan', ta: 'தற்போதைய திட்டம்' },
    comingSoon: { en: 'coming soon 🚧', ta: 'விரைவில் வருகிறது 🚧' },
    joinWaitlist: { en: 'join waitlist 🐣', ta: 'முன்வரிசையில் இணைய 🐣' },
    joinWaitlistBtn: { en: 'join early-bird waitlist 🐣', ta: 'காத்திருப்போர் பட்டியலில் இணைய 🐣' },
    waitlistSuccess: {
      en: 'you are on the VIP waitlist 🎟️',
      ta: 'நீங்கள் விஐபி காத்திருப்புப் பட்டியலில் உள்ளீர்கள் 🎟️',
    },
    unlockedToast: { en: "you're Pro 💜", ta: 'நீங்கள் Pro உறுப்பினர் 💜' },
    cancelToast: { en: 'chill, stay free for now ✨', ta: 'இப்போதைக்கு இலவசமாகத் தொடருங்கள் ✨' },
    comparisonTitle: { en: 'Full Feature Comparison 📊', ta: 'முழு அம்சங்களின் ஒப்பீடு 📊' },
    comparePlansTitle: { en: 'Compare Plans & Features', ta: 'திட்டங்கள் & வசதிகள் ஒப்பீடு' },
    featureCol: { en: 'Feature', ta: 'அம்சம்' },
    freeBasicsTag: { en: 'the basics, fr', ta: 'அடிப்படை வசதிகள்' },
    proEraTag: { en: 'the main character era ✨', ta: 'முழு பலன் தரும் பருவம் ✨' },
    liveTeacherTag: { en: 'pro + a real teacher 👨‍🏫', ta: 'Pro + நேரலை ஆசிரியர் 👨‍🏫' },
  },
  paywall: {
    title: { en: 'Centum Pro — Coming Soon 🚧', ta: 'Centum Pro — விரைவில் 🚧' },
    comingSoonTitle: { en: 'centum pro — coming soon 🚧', ta: 'centum pro — விரைவில் வருகிறது 🚧' },
    earlyBirdOffer: {
      en: 'join the waitlist for the early-bird offer 🐣',
      ta: 'ஆரம்பச் சலுகையைப் பெற காத்திருப்புப் பட்டியலில் இணையுங்கள் 🐣',
    },
    joinWaitlistEarly: { en: 'join early-bird waitlist 🐣', ta: 'காத்திருப்போர் பட்டியலில் இணைய 🐣' },
    subtitle: {
      en: 'join the waitlist for the early-bird offer 🐣',
      ta: 'ஆரம்பச் சலுகையைப் பெற காத்திருப்புப் பட்டியலில் இணையுங்கள் 🐣',
    },
    pitch1: {
      en: '100% full syllabus coverage & all TN papers 🔥',
      ta: '100% முழு பாடத்திட்டம் & அனைத்து TN வினாத்தாள்கள் 🔥',
    },
    pitch2: {
      en: 'Instant centum solutions & step-by-step guides 🎯',
      ta: 'உடனடி விடைக்குறிப்புகள் & செய்முறை வழிகாட்டிகள் 🎯',
    },
    pitch3: {
      en: 'Unlimited mock tests & rank booster 🚀',
      ta: 'வரம்பற்ற மாதிரி தேர்வுகள் & தரவரிசை பூஸ்டர் 🚀',
    },
    priceDisplay: { en: 'special early-bird discount at launch ✨', ta: 'ஆரம்பச் சிறப்புத் தள்ளுபடி விரைவில் ✨' },
    couponPlaceholder: { en: 'coupon code (e.g. FRIEND20)', ta: 'தள்ளுபடி குறியீடு (எ.கா. FRIEND20)' },
    applyCoupon: { en: 'Apply', ta: 'பயன்படுத்து' },
    appliedDiscount: { en: 'discount applied! ✨', ta: 'தள்ளுபடி பயன்படுத்தப்பட்டது! ✨' },
    invalidCoupon: { en: 'invalid coupon 🤷‍♂️', ta: 'செல்லாத குறியீடு 🤷‍♂️' },
    proBadge: { en: 'Pro 🔒', ta: 'Pro 🔒' },
    joinWaitlistBtn: { en: 'Join Waitlist for Early Offer 🐣', ta: 'முன்வரிசையில் இணையுங்கள் 🐣' },
  },
  refer: {
    title: { en: 'Refer & Earn Coins 🪙', ta: 'நண்பர்களை அழைத்து நாணயங்கள் வெல்க 🪙' },
    subtitle: { en: 'share with friends, stack coins together 💜', ta: 'நண்பர்களை அழைக்கவும், நாணயங்களை அள்ளவும் 💜' },
    codeGenerated: { en: 'Your referral code is ready! 🎯', ta: 'உங்கள் பரிந்துரை குறியீடு தயார்! 🎯' },
    getCodeCta: { en: 'get my code 🎯', ta: 'என் குறியீட்டைப் பெறுக 🎯' },
    generatingCode: { en: 'generating code... ⚡', ta: 'குறியீடு உருவாகிறது... ⚡' },
    shareCta: { en: 'share with friends 🚀', ta: 'நண்பர்களுடன் பகிரவும் 🚀' },
    rewardsTitle: { en: 'How coins work', ta: 'நாணயங்கள் எவ்வாறு செயல்படுகின்றன' },
    friendsJoined: { en: 'Friends invited', ta: 'அழைக்கப்பட்ட நண்பர்கள்' },
    shareTemplate: {
      en: "bro stop scrolling 💀 this app has EVERY tamil nadu PYQ + free quizzes and i'm literally ranking up without trying. join with my code {CODE} and we both get coins 🪙👉 {url}?ref={CODE}",
      ta: "மச்சான் scrolling நிறுத்து 💀 இந்த app-ல எல்லா TN PYQ + free quiz இருக்கு, ஈஸியா rank ஏறலாம். என் code {CODE} போட்டு சேரு, ரெண்டு பேருக்கும் coins கிடைக்கும் 🪙👉 {url}?ref={CODE}",
    },
    shareTextEn: {
      en: "bro stop scrolling 💀 this app has EVERY tamil nadu PYQ + free quizzes and i'm literally ranking up without trying. join with my code {CODE} and we both get coins 🪙👉 {url}?ref={CODE}",
      ta: "bro stop scrolling 💀 this app has EVERY tamil nadu PYQ + free quizzes and i'm literally ranking up without trying. join with my code {CODE} and we both get coins 🪙👉 {url}?ref={CODE}",
    },
    shareTextTa: {
      en: "மச்சான் scrolling நிறுத்து 💀 இந்த app-ல எல்லா TN PYQ + free quiz இருக்கு, ஈஸியா rank ஏறலாம். என் code {CODE} போட்டு சேரு, ரெண்டு பேருக்கும் coins கிடைக்கும் 🪙👉 {url}?ref={CODE}",
      ta: "மச்சான் scrolling நிறுத்து 💀 இந்த app-ல எல்லா TN PYQ + free quiz இருக்கு, ஈஸியா rank ஏறலாம். என் code {CODE} போட்டு சேரு, ரெண்டு பேருக்கும் coins கிடைக்கும் 🪙👉 {url}?ref={CODE}",
    },
    rewardJoinRule: { en: '+20 🪙 when they join', ta: 'நண்பர் இணையும் போது +20 🪙' },
    rewardQualifyRule: {
      en: '+80 🪙 when they finish 3 quizzes on 2 days',
      ta: '2 நாட்களில் 3 தேர்வுகள் முடிக்கும் போது +80 🪙',
    },
    copyCode: { en: 'Copy Code 📋', ta: 'குறியீட்டை நகலெடு 📋' },
    copied: { en: 'pasted ✅', ta: 'நகலெடுக்கப்பட்டது ✅' },
    shareDirect: { en: 'Share with friends 🚀', ta: 'நண்பர்களுக்குப் பகிர்க 🚀' },
    friendsReferred: { en: 'Friends Joined', ta: 'இணைந்த நண்பர்கள்' },
    qualifiedFriends: { en: 'Qualified Friends', ta: 'தேர்வெழுதிய நண்பர்கள்' },
    totalCoinsEarned: { en: 'Referral Coins Earned', ta: 'வென்ற நாணயங்கள்' },
    noReferralsYet: {
      en: 'no friends joined yet — share your link and start stacking! 🚀',
      ta: 'இன்னும் நண்பர்கள் இணையவில்லை — இணைப்பை பகிர்ந்து நாணயங்களை வெல்லுங்கள்! 🚀',
    },
    statusJoined: { en: 'joined 🐣', ta: 'இணைந்தார் 🐣' },
    statusQualified: { en: 'qualified 🔥', ta: 'தேர்வெழுதினார் 🔥' },
  },
  coins: {
    title: { en: 'Centum Coins 🪙', ta: 'Centum நாணயங்கள் 🪙' },
    subtitle: {
      en: 'earn coins, unlock styles, get pro discounts 💜',
      ta: 'நாணயங்களை வெல்லுங்கள், ஸ்டைல்களைத் திறங்கள், Pro சலுகைகள் பெறுங்கள் 💜',
    },
    balanceLabel: { en: 'Coin Balance', ta: 'நாணய இருப்பு' },
    explainer: {
      en: '10 coins = ₹1 in discounts at launch · coins can cut up to 50% off centum pro 🤑',
      ta: '10 நாணயங்கள் = ₹1 தள்ளுபடி · centum pro-வில் 50% வரை தள்ளுபடி பெறலாம் 🤑',
    },
    earnCardTitle: { en: 'How to earn coins 🎯', ta: 'நாணயங்கள் வெல்வது எப்படி 🎯' },
    balance: { en: 'Coin Balance', ta: 'நாணய இருப்பு' },
    howToEarn: { en: 'How to earn coins 🎯', ta: 'நாணயங்களை வெல்வது எப்படி 🎯' },
    earnDaily: { en: 'Daily quiz answer', ta: 'தினசரி வினாடிவினா' },
    earnTest: { en: 'Finish a chapter test', ta: 'பாடத் தேர்வு முடித்தல்' },
    earnPerfect: { en: '100% perfect score bonus', ta: 'முழு மதிப்பெண் போனஸ்' },
    earnStreak7: { en: '7-day streak milestone', ta: '7-நாள் தொடர் சாதனை' },
    earnStreak30: { en: '30-day streak milestone', ta: '30-நாள் தொடர் சாதனை' },
    earnFriendJoin: { en: 'Friend joins with your code', ta: 'நண்பர் இணையும் போது' },
    earnFriendQualify: { en: 'Friend completes 3 quizzes', ta: 'நண்பர் 3 தேர்வு முடித்தால்' },
    proBonusCard: {
      en: 'Pro members earn 2× coins forever 👑',
      ta: 'Pro உறுப்பினர்களுக்கு எப்போதும் 2× நாணயங்கள் 👑',
    },
    discountMath: {
      en: 'coins can cut up to 50% off Centum Pro 🤑',
      ta: 'நாணயங்கள் மூலம் Centum Pro-வில் 50% வரை தள்ளுபடி பெறலாம் 🤑',
    },
    avatarStore: { en: 'Avatar Frame Store 🎨', ta: 'அவதார் பிரேம்கள் அங்காடி 🎨' },
    storeTitle: { en: 'Avatar Frame Store 🎨', ta: 'அவதார் பிரேம்கள் அங்காடி 🎨' },
    owned: { en: 'Owned', ta: 'உங்களிடம் உள்ளது' },
    equipped: { en: 'Equipped ✨', ta: 'பயன்பாட்டில் உள்ளது ✨' },
    avatarEquipped: { en: 'Equipped ✨', ta: 'பயன்பாட்டில் உள்ளது ✨' },
    equipBtn: { en: 'Equip', ta: 'பயன்படுத்து' },
    avatarEquip: { en: 'Equip', ta: 'பயன்படுத்து' },
    buyBtn: { en: 'Buy for', ta: 'வாங்க' },
    saveMore: { en: 'save {count} more 🪙', ta: 'இன்னும் {count} 🪙 வேண்டும்' },
    recentActivity: { en: 'Recent Activity 📜', ta: 'சமீபத்திய நடவடிக்கைகள் 📜' },
    noActivity: { en: 'no coin activity yet — take a quiz to earn! ⚡', ta: 'இன்னும் நடவடிக்கைகள் இல்லை — தேர்வெழுதி வெல்லுங்கள்! ⚡' },
    emptyRecent: { en: 'no coin activity yet — take a quiz to earn! ⚡', ta: 'இன்னும் நடவடிக்கைகள் இல்லை — தேர்வெழுதி வெல்லுங்கள்! ⚡' },
    reasonDaily: { en: 'Daily Quiz', ta: 'தினசரி தேர்வு' },
    reasonDailyQuiz: { en: 'Daily Quiz', ta: 'தினசரி தேர்வு' },
    reasonTest: { en: 'Chapter Test', ta: 'பாடத் தேர்வு' },
    reasonTestComplete: { en: 'Chapter Test', ta: 'பாடத் தேர்வு' },
    reasonPerfect: { en: 'Perfect Score 🎯', ta: 'முழு மதிப்பெண் 🎯' },
    reasonTestPerfect: { en: 'Perfect Score 🎯', ta: 'முழு மதிப்பெண் 🎯' },
    reasonStreak: { en: 'Streak Reward 🔥', ta: 'தொடர் பரிசு 🔥' },
    reasonStreak7: { en: '7-Day Streak 🔥', ta: '7-நாள் தொடர் 🔥' },
    reasonStreak30: { en: '30-Day Streak 👑', ta: '30-நாள் தொடர் 👑' },
    reasonReferral: { en: 'Referral Bonus 👥', ta: 'பரிந்துரை போனஸ் 👥' },
    reasonWelcome: { en: 'Welcome Bonus 🎁', ta: 'வரவேற்பு போனஸ் 🎁' },
    reasonAvatar: { en: 'Avatar Frame 🎨', ta: 'அவதார் பிரேம் 🎨' },
  },
  viewer: {
    funLines: [
      { en: 'warming up the paper 🥵', ta: 'தாள் தயாராகிறது 🥵' },
      { en: 'bribing the pdf gods 🙏', ta: 'PDF தெய்வங்களை வேண்டுகிறோம் 🙏' },
      { en: 'almost there, breathe 😮💨', ta: 'கிட்டத்தட்ட வந்தாச்சு, மூச்சு விடுங்க 😮💨' },
      { en: 'this one had 100 written all over it 📝', ta: 'இதில் 100 வாங்குவது உறுதி 📝' },
    ],
    back: { en: 'Back', ta: 'பின் செல்' },
    downloading: { en: 'downloading... ⬇', ta: 'பதிவிறக்குகிறது... ⬇' },
  },
  pwa: {
    addHomeChip: { en: '📲 add centum to home screen', ta: '📲 Centum-ஐ முகப்புத் திரையில் சேர்க்க' },
    iosTitle: { en: 'Add Centum to Home Screen 📲', ta: 'Centum-ஐ முகப்புத் திரையில் சேர்க்க 📲' },
    iosSubtitle: { en: 'fast fullscreen access in 3 quick steps', ta: '3 எளிய படிகளில் முழுத்திரை வசதி' },
    step1: { en: 'Tap the Share icon at the bottom of Safari', ta: 'Safari-ன் கீழே உள்ள Share ஐகானைத் தட்டவும்' },
    step2: { en: 'Scroll down and tap "Add to Home Screen"', ta: 'கீழே சென்று "Add to Home Screen" தேர்ந்தெடுக்கவும்' },
    step3: { en: 'Tap "Add" in the top right corner — done! ✨', ta: 'மேல் வலது மூலையில் உள்ள "Add" கொடுக்கவும் — முடிந்தது! ✨' },
    gotIt: { en: 'Got it! 👍', ta: 'புரிந்தது! 👍' },
  },
  admin: {
    title: { en: 'Founder Console 🦉', ta: 'நிறுவனர் பக்கம் 🦉' },
    authTitle: { en: 'Founder Access 🦉', ta: 'நிறுவனர் அனுமதி 🦉' },
    authSubtitle: { en: 'authorized access only', ta: 'அங்கீகரிக்கப்பட்ட அனுமதி மட்டுமே' },
    phoneLabel: { en: 'Admin mobile', ta: 'நிர்வாகி மொபைல்' },
    phonePlaceholder: { en: '10-digit mobile number', ta: '10-இலக்க மொபைல் எண்' },
    passwordLabel: { en: 'Admin password', ta: 'நிர்வாகி கடவுச்சொல்' },
    passwordPlaceholder: { en: 'password', ta: 'கடவுச்சொல்' },
    loginBtn: { en: 'Enter Console ⚡', ta: 'உள்நுழைக ⚡' },
    loggingIn: { en: 'verifying credentials... ⚡', ta: 'சரிபார்க்கிறது... ⚡' },
    notFounder: { en: 'this way is for the founder 🦉', ta: 'இது நிறுவனருக்கான பாதை 🦉' },
    logout: { en: 'exit 🚪', ta: 'வெளியேறு 🚪' },
    tabStats: { en: 'Stats 📊', ta: 'புள்ளிவிவரம் 📊' },
    tabStudents: { en: 'Students 👥', ta: 'மாணவர்கள் 👥' },
    tabContent: { en: 'Add Content ➕', ta: 'உள்ளடக்கம் சேர் ➕' },
    settingsTitle: { en: 'Admin Settings ⚙️', ta: 'நிர்வாக அமைப்புகள் ⚙️' },
    changePassword: { en: 'change password 🔑', ta: 'கடவுச்சொல் மாற்று 🔑' },
    oldPasswordLabel: { en: 'Current password', ta: 'தற்போதைய கடவுச்சொல்' },
    newPasswordLabel: { en: 'New password', ta: 'புதிய கடவுச்சொல்' },
    savePasswordBtn: { en: 'Update password 🔐', ta: 'கடவுச்சொல்லைப் புதுப்பி 🔐' },
    passwordUpdated: { en: 'admin password updated ✨', ta: 'கடவுச்சொல் புதுப்பிக்கப்பட்டது ✨' },
    statsStudents: { en: 'Students Total', ta: 'மொத்த மாணவர்கள்' },
    statsPro: { en: 'Centum Pro', ta: 'Centum Pro' },
    statsLive: { en: 'Centum Live', ta: 'Centum Live' },
    statsTests: { en: 'Tests Taken', ta: 'எழுதப்பட்ட தேர்வுகள்' },
    statsRevenue: { en: 'Total Revenue', ta: 'மொத்த வருவாய்' },
    statsRevenueMonth: { en: 'Revenue (This Month)', ta: 'இந்த மாத வருவாய்' },
    statsPayments: { en: 'Payments', ta: 'பணம் செலுத்தியவை' },
    statsCoupons: { en: 'Coupons Used', ta: 'பயன்படுத்திய கூப்பன்கள்' },
    filterAll: { en: 'All', ta: 'அனைத்தும்' },
    filterFree: { en: 'Free', ta: 'இலவசம்' },
    filterPro: { en: 'Pro', ta: 'Pro' },
    filterLive: { en: 'Live', ta: 'Live' },
    addContentTitle: { en: 'Upload Material 📄', ta: 'பொருள் பதிவேற்றம் 📄' },
    selectTab: { en: 'Select Section', ta: 'பிரிவைத் தேர்ந்தெடு' },
    publishBtn: { en: 'Publish Content 🚀', ta: 'பதிவிடு 🚀' },
    publishing: { en: 'publishing... ⏳', ta: 'பதிவிடுகிறது... ⏳' },
    contentAdded: { en: 'content published to sheet ✨', ta: 'தாள் வெளியிடப்பட்டது ✨' },
    emptyStudents: { en: 'no students found 🍃', ta: 'மாணவர்கள் எவரும் இல்லை 🍃' },
  },
};

type DeepResolved<T> = {
  [K in keyof T]: T[K] extends { en: string; ta: string }
    ? string
    : T[K] extends Array<{ en: string; ta: string }>
    ? string[]
    : T[K] extends object
    ? DeepResolved<T[K]>
    : T[K];
};

export function getTexts(medium: Medium = 'english'): DeepResolved<typeof rawTexts> {
  const langKey: 'en' | 'ta' = medium === 'tamil' ? 'ta' : 'en';

  function resolveNode(node: unknown): unknown {
    if (node === null || node === undefined) return node;
    if (typeof node === 'object') {
      if ('en' in node && 'ta' in node && typeof (node as Record<string, unknown>).en === 'string') {
        const item = node as { en: string; ta: string };
        return item[langKey] || item.en;
      }
      if (Array.isArray(node)) {
        return node.map((child) => resolveNode(child));
      }
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) {
        result[k] = resolveNode(v);
      }
      return result;
    }
    return node;
  }

  return resolveNode(rawTexts) as DeepResolved<typeof rawTexts>;
}

export function t(path: string, medium?: Medium): string {
  const langKey = (medium || activeLanguage) === 'tamil' ? 'ta' : 'en';
  const parts = path.split('.');
  let curr: unknown = rawTexts;

  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = (curr as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }

  if (curr && typeof curr === 'object' && 'en' in curr && 'ta' in curr) {
    const loc = curr as { en: string; ta: string };
    return loc[langKey] || loc.en;
  }

  if (typeof curr === 'string') return curr;
  return path;
}

// Dynamic transparent proxy: whenever `texts.x.y` is accessed, it automatically
// resolves using the currently active language set by `setCurrentLanguage`!
function createProxy(target: unknown): unknown {
  if (typeof target !== 'object' || target === null) {
    return target;
  }

  // If this target is a leaf node { en, ta }
  if ('en' in target && 'ta' in target && typeof (target as Record<string, unknown>).en === 'string') {
    const leaf = target as { en: string; ta: string };
    const langKey = activeLanguage === 'tamil' ? 'ta' : 'en';
    return leaf[langKey] || leaf.en;
  }

  if (Array.isArray(target)) {
    return target.map((item) => createProxy(item));
  }

  return new Proxy(target, {
    get(obj: Record<string, unknown>, prop: string | symbol) {
      if (prop === 'toString' || prop === Symbol.toPrimitive) {
        return () => '';
      }
      if (typeof prop === 'string' && prop in obj) {
        return createProxy(obj[prop]);
      }
      return undefined;
    },
  });
}

export const texts = createProxy(rawTexts) as DeepResolved<typeof rawTexts>;
