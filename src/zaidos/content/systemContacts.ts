import { site } from './site';
import { socials } from './socials';

/** Memoji avatars — same set as the original macOS demo contacts. */
export const memoji = {
  red: '/icons/PngItem_4082636.png',
  amber: '/icons/PngItem_4409921.png',
  sky: '/icons/PngItem_4608119.png',
  green: '/icons/PngItem_5031003.png',
  teal: '/icons/PngItem_6304991.png',
  orange: '/icons/PngItem_6452863.png',
} as const;

export const defaultMemoji = memoji.amber;

const linkedin = socials.find((s) => s.id === 'linkedin')!;

/** Bump when seed contacts change so localStorage picks up new defaults. */
export const contactsSeedVersion = 'zaid-v2';

/** Legacy mock contact ids — cleared from localStorage when detected. */
export const legacyContactIds = [
  'antonio', 'magico', 'graham', 'jay', 'sarah', 'ryan', 'aga', 'mayuri',
  'chris', 'guillermo', 'rigo', 'brian', 'liz',
] as const;

/**
 * Contacts app — Muhammad Zaid only.
 */
export const systemContacts = [
  {
    id: 'zaid',
    firstName: 'Muhammad',
    lastName: 'Zaid Yaseen',
    avatar: memoji.amber,
    avatarBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    gradient: 'from-[#30d158]/80 to-[#116928]/80',
    phone: '',
    email: 'hello@zaidx.me',
    workEmail: site.contactEmail,
    address: 'Gujranwala, Punjab, Pakistan',
    birthday: '',
    notes: `${site.roleLine}. Portfolio: ${site.siteUrl}`,
  },
] as const;

/** Phone app recents — Pakistani names with memoji avatars. */
export const phoneRecents = [
  {
    id: 'zaid',
    name: 'Muhammad Zaid Yaseen',
    avatar: memoji.amber,
    avatarBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    device: 'iPhone',
    type: 'mobile',
    time: '9:30 AM',
    dateLabel: 'Today',
    isOutgoing: true,
    email: 'hello@zaidx.me',
    history: [
      { type: 'Outgoing Call', time: 'Today - 9:30 AM', duration: '2 mins 14 secs' },
      { type: 'Incoming Call', time: 'Yesterday - 4:15 PM', duration: '5 mins 40 secs' },
    ],
  },
  {
    id: 'hassan',
    name: 'Hassan Ali',
    avatar: memoji.red,
    avatarBg: 'bg-red-100 dark:bg-red-950/60',
    device: 'mobile',
    type: 'mobile',
    time: 'Yesterday',
    dateLabel: 'Yesterday',
    isOutgoing: false,
    email: 'hassan.ali@gmail.com',
    history: [
      { type: 'Incoming Call', time: 'Yesterday - 1:45 PM', duration: '10 mins 15 secs' },
    ],
  },
  {
    id: 'fatima',
    name: 'Fatima Khan',
    avatar: memoji.sky,
    avatarBg: 'bg-sky-100 dark:bg-sky-950/60',
    device: 'mobile',
    type: 'mobile',
    time: 'Yesterday',
    dateLabel: 'Yesterday',
    isOutgoing: false,
    email: 'fatima.khan@outlook.com',
    history: [
      { type: 'Missed Call', time: 'Yesterday - 5:20 PM', duration: 'Missed' },
      { type: 'Incoming Call', time: '3/28/25 - 10:15 AM', duration: '1 min 5 secs' },
    ],
  },
  {
    id: 'usman',
    name: 'Usman Malik',
    avatar: memoji.green,
    avatarBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    device: 'mobile',
    type: 'mobile',
    time: '3/30/25',
    dateLabel: '3/30/25',
    isOutgoing: false,
    email: 'usman.malik@icloud.com',
    history: [
      { type: 'Incoming Call', time: '3/30/25 - 2:00 PM', duration: '45 seconds' },
    ],
  },
  {
    id: 'ayesha',
    name: 'Ayesha Raza',
    avatar: memoji.teal,
    avatarBg: 'bg-purple-100 dark:bg-purple-950/60',
    device: 'mobile',
    type: 'mobile',
    time: '3/30/25',
    dateLabel: '3/30/25',
    isOutgoing: false,
    email: 'ayesha.raza@yahoo.com',
    history: [
      { type: 'Incoming Call', time: '3/30/25 - 9:15 AM', duration: '1 min 22 secs' },
    ],
  },
  {
    id: 'bilal',
    name: 'Bilal Ahmed',
    avatar: memoji.orange,
    avatarBg: 'bg-orange-200 dark:bg-orange-950/60',
    device: 'iPhone',
    type: 'mobile',
    time: '3/29/25',
    dateLabel: '3/29/25',
    isOutgoing: false,
    email: 'bilal.ahmed@proton.me',
    history: [
      { type: 'Incoming Call', time: '3/29/25 - 6:40 PM', duration: '5 mins 8 secs' },
    ],
  },
] as const;

/** Phone app favourites grid. */
export const phoneFavourites = [
  {
    id: 'zaid',
    name: 'Zaid',
    avatar: memoji.amber,
    bgClass: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconType: 'phone',
  },
  {
    id: 'hassan',
    name: 'Hassan',
    avatar: memoji.red,
    bgClass: 'bg-red-100 dark:bg-red-950/60',
    iconType: 'message',
  },
  {
    id: 'fatima',
    name: 'Fatima',
    avatar: memoji.sky,
    bgClass: 'bg-sky-100 dark:bg-sky-950/60',
    iconType: 'message',
  },
  {
    id: 'usman',
    name: 'Usman',
    avatar: memoji.green,
    bgClass: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconType: 'video',
  },
] as const;

/** Mail app inbox — Pakistani senders, messages to Muhammad Zaid. */
export const mailInbox = [
  {
    id: 1,
    sender: 'GitHub',
    avatar: '/icons/system/github.png',
    subject: 'New star on Applicator',
    date: '8/10/25',
    excerpt: `Hi ${site.handle}, someone starred zaidx-me/applicator-chrome. Your AI job assistant is getting attention...`,
    isUnread: true,
    category: 'primary',
    content: `Hi ${site.handle},\n\nSomeone starred your repository zaidx-me/applicator-chrome.\n\nApplicator analyzes WhatsApp job messages and generates tailored cover letters — nice work!\n\nKeep shipping,\nGitHub`,
  },
  {
    id: 2,
    sender: 'Ayesha Siddiqui',
    avatar: memoji.teal,
    subject: 'Mobile developer opportunity',
    date: '8/8/25',
    excerpt: `Salam Muhammad Zaid, I came across your portfolio at ${site.siteUrl} and was impressed by your React Native work...`,
    isUnread: true,
    category: 'primary',
    content: `Salam Muhammad Zaid,\n\nI came across your portfolio at ${site.siteUrl} and was impressed by your React Native and Shopify experience.\n\nWe have a mobile developer role in Lahore that might be a great fit. Would you be open to a quick call this week?\n\nBest,\nAyesha Siddiqui`,
  },
  {
    id: 3,
    sender: 'Hassan Raza',
    avatar: memoji.red,
    subject: 'Semester project — C++ / SFML',
    date: '8/5/25',
    excerpt: 'AoA Zaid, Saw your GitHub README about freelance SFML games. Are you free for a BSIT semester project?',
    isUnread: false,
    isReplied: true,
    category: 'primary',
    hasMap: true,
    content: `AoA Zaid,\n\nSaw your GitHub README about freelance C++ / SFML games for students. Our group at Punjab University needs help with a semester project.\n\nAre you available this month? We can discuss scope on WhatsApp.\n\nRegards,\nHassan Raza`,
  },
  {
    id: 4,
    sender: 'LinkedIn',
    avatar: '/icons/system/linkedin.png',
    subject: 'You have a new connection request',
    date: '8/2/25',
    excerpt: 'Hi Zaid, Usman Malik from Gujranwala wants to connect after seeing your BSIT + freelance work...',
    isUnread: false,
    category: 'primary',
    content: `Hi Zaid,\n\nUsman Malik from Gujranwala wants to connect on LinkedIn after seeing your BSIT progress and freelance mobile work.\n\nView request: ${linkedin.url}\n\nLinkedIn`,
  },
  {
    id: 5,
    sender: 'Dr. Kamran Hussain',
    avatar: memoji.orange,
    subject: 'BSIT semester schedule update',
    date: '7/28/25',
    excerpt: 'Dear Muhammad Zaid Yaseen, The 5th-semester course registration window opens next Monday...',
    isUnread: false,
    category: 'primary',
    content: `Dear Muhammad Zaid Yaseen,\n\nThe 5th-semester BSIT course registration window opens next Monday at the Gujranwala campus.\n\nPlease confirm your enrollment status on the portal.\n\nDr. Kamran Hussain\nUniversity of the Punjab`,
  },
  {
    id: 6,
    sender: 'Fatima Noor',
    avatar: memoji.sky,
    subject: 'Loved ZaidOS — quick question',
    date: '7/22/25',
    excerpt: 'Hi Zaid, Your portfolio OS demo is brilliant. How did you build the window manager?',
    isUnread: false,
    category: 'primary',
    content: `Hi Zaid,\n\nYour portfolio OS demo at https://os.zaidx.me is brilliant. How did you build the window manager and mobile shell?\n\nI'm a fellow dev from Islamabad — would love to chat sometime.\n\nFatima Noor`,
  },
  {
    id: 7,
    sender: 'Bilal Khan',
    avatar: memoji.green,
    subject: 'Applicator beta feedback',
    date: '7/15/25',
    excerpt: 'Hey Zaid, Tested Applicator on my phone — the cover letter flow is slick. One small bug though...',
    isUnread: false,
    category: 'primary',
    content: `Hey Zaid,\n\nTested Applicator on my phone — the cover letter flow is slick. One small bug when parsing long WhatsApp threads though.\n\nHappy to send screenshots if useful.\n\nCheers,\nBilal Khan`,
  },
  {
    id: 8,
    sender: 'ZaidGPT',
    avatar: '/icons/whitesur/chat.svg',
    subject: 'Chat transcript — portfolio questions',
    date: '7/10/25',
    excerpt: 'Hi Muhammad Zaid, Here is a copy of your ZaidGPT conversation about Applicator and Whatbot...',
    isUnread: false,
    hasAttachment: true,
    category: 'primary',
    content: `Hi Muhammad Zaid,\n\nHere is a copy of your ZaidGPT conversation about Applicator, Whatbot, and your tech stack.\n\nTranscript attached as requested from the Chat app.\n\n— ZaidGPT on ZaidOS`,
  },
] as const;

export const ownerDisplayName = site.owner;
