// Mock data for Online Coaching App

export type SectionId =
  | "dashboard"
  | "courses"
  | "live"
  | "study"
  | "tests"
  | "doubts"
  | "profile";

export type Course = {
  id: string;
  title: string;
  subject: string;
  faculty: string;
  facultyAvatar: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  students: number;
  rating: number;
  nextClass?: string;
  nextClassTime?: string;
  badge?: string;
};

export type LiveClass = {
  id: string;
  title: string;
  faculty: string;
  subject: string;
  startTime: string;
  endTime: string;
  date: string;
  status: "live" | "upcoming" | "completed";
  attendees: number;
  thumbnail: string;
};

export type StudyMaterial = {
  id: string;
  title: string;
  type: "pdf" | "video" | "note" | "dpp";
  subject: string;
  faculty: string;
  size?: string;
  duration?: string;
  uploadedAt: string;
  isNew?: boolean;
  isPreview?: boolean;
  thumbnail: string;
  courseId?: string;
};

export type TestSeries = {
  id: string;
  title: string;
  subject: string;
  totalQuestions: number;
  duration: number; // minutes
  marks: number;
  status: "available" | "attempted" | "in-progress" | "expired";
  score?: number;
  rank?: number;
  totalAttempts?: number;
  startDate: string;
  endDate: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

export type Doubt = {
  id: string;
  question: string;
  subject: string;
  askedAt: string;
  studentName: string;
  studentAvatar: string;
  status: "answered" | "pending";
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  helpfulCount?: number;
  attachments?: string[];
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "class" | "test" | "material" | "doubt" | "payment";
  isRead: boolean;
};

export type TodayClass = {
  id: string;
  time: string;
  subject: string;
  faculty: string;
  topic: string;
  status: "live" | "upcoming" | "completed";
};

// Today's timetable
export const todayClasses: TodayClass[] = [
  { id: "t1", time: "08:00 AM", subject: "Physics", faculty: "Aman Verma", topic: "Rotational Motion - Lecture 4", status: "completed" },
  { id: "t2", time: "10:00 AM", subject: "Chemistry", faculty: "Pooja Sharma", topic: "Chemical Bonding - Hybridisation", status: "live" },
  { id: "t3", time: "12:00 PM", subject: "Mathematics", faculty: "Rohit Kumar", topic: "Calculus - Definite Integrals", status: "upcoming" },
  { id: "t4", time: "02:00 PM", subject: "Biology", faculty: "Neha Singh", topic: "Genetics - Mendel's Laws", status: "upcoming" },
  { id: "t5", time: "04:00 PM", subject: "Physics", faculty: "Aman Verma", topic: "DPP Solving Session", status: "upcoming" },
];

// Courses list
export const courses: Course[] = [
  {
    id: "c1",
    title: "JEE Mains & Advanced 2026 - Full Batch",
    subject: "PCM Complete",
    faculty: "Aman Verma",
    facultyAvatar: "AV",
    thumbnail: "physics",
    totalLessons: 480,
    completedLessons: 142,
    progress: 30,
    students: 1240,
    rating: 4.8,
    nextClass: "Today",
    nextClassTime: "10:00 AM",
    badge: "LIVE BATCH",
  },
  {
    id: "c2",
    title: "NEET 2026 - Biology Booster",
    subject: "Biology",
    faculty: "Neha Singh",
    facultyAvatar: "NS",
    thumbnail: "biology",
    totalLessons: 220,
    completedLessons: 78,
    progress: 35,
    students: 890,
    rating: 4.7,
    nextClass: "Today",
    nextClassTime: "02:00 PM",
    badge: "POPULAR",
  },
  {
    id: "c3",
    title: "Foundation 11th - Mathematics Crash",
    subject: "Mathematics",
    faculty: "Rohit Kumar",
    facultyAvatar: "RK",
    thumbnail: "math",
    totalLessons: 180,
    completedLessons: 105,
    progress: 58,
    students: 540,
    rating: 4.9,
    nextClass: "Tomorrow",
    nextClassTime: "08:00 AM",
  },
  {
    id: "c4",
    title: "Class 10th - Science Foundation",
    subject: "Science",
    faculty: "Pooja Sharma",
    facultyAvatar: "PS",
    thumbnail: "science",
    totalLessons: 150,
    completedLessons: 92,
    progress: 61,
    students: 1560,
    rating: 4.6,
    nextClass: "Today",
    nextClassTime: "06:00 PM",
  },
  {
    id: "c5",
    title: "JEE Advanced - Organic Chemistry",
    subject: "Chemistry",
    faculty: "Pooja Sharma",
    facultyAvatar: "PS",
    thumbnail: "chemistry",
    totalLessons: 95,
    completedLessons: 38,
    progress: 40,
    students: 420,
    rating: 4.8,
  },
  {
    id: "c6",
    title: "Crash Course - Modern Physics",
    subject: "Physics",
    faculty: "Aman Verma",
    facultyAvatar: "AV",
    thumbnail: "physics",
    totalLessons: 32,
    completedLessons: 12,
    progress: 37,
    students: 320,
    rating: 4.5,
    badge: "NEW",
  },
];

// Live classes
export const liveClasses: LiveClass[] = [
  {
    id: "l1",
    title: "Chemical Bonding - Hybridisation Deep Dive",
    faculty: "Pooja Sharma",
    subject: "Chemistry",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    date: "Today",
    status: "live",
    attendees: 856,
    thumbnail: "chemistry",
  },
  {
    id: "l2",
    title: "Calculus - Definite Integrals Made Easy",
    faculty: "Rohit Kumar",
    subject: "Mathematics",
    startTime: "12:00 PM",
    endTime: "01:30 PM",
    date: "Today",
    status: "upcoming",
    attendees: 0,
    thumbnail: "math",
  },
  {
    id: "l3",
    title: "Genetics - Mendel's Laws Explained",
    faculty: "Neha Singh",
    subject: "Biology",
    startTime: "02:00 PM",
    endTime: "03:30 PM",
    date: "Today",
    status: "upcoming",
    attendees: 0,
    thumbnail: "biology",
  },
  {
    id: "l4",
    title: "Rotational Motion - DPP Solving Session",
    faculty: "Aman Verma",
    subject: "Physics",
    startTime: "04:00 PM",
    endTime: "05:30 PM",
    date: "Today",
    status: "upcoming",
    attendees: 0,
    thumbnail: "physics",
  },
  {
    id: "l5",
    title: "Organic Chemistry - Reaction Mechanism",
    faculty: "Pooja Sharma",
    subject: "Chemistry",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    date: "Tomorrow",
    status: "upcoming",
    attendees: 0,
    thumbnail: "chemistry",
  },
];

// Study material
export const studyMaterials: StudyMaterial[] = [
  {
    id: "s1",
    title: "Rotational Motion - Complete Notes PDF",
    type: "pdf",
    subject: "Physics",
    faculty: "Aman Verma",
    size: "4.2 MB",
    uploadedAt: "2 hours ago",
    isNew: true,
    thumbnail: "physics",
  },
  {
    id: "s2",
    title: "Chemical Bonding - Hybridisation Video Lecture",
    type: "video",
    subject: "Chemistry",
    faculty: "Pooja Sharma",
    duration: "1h 24m",
    uploadedAt: "5 hours ago",
    isNew: true,
    thumbnail: "chemistry",
  },
  {
    id: "s3",
    title: "Definite Integrals - DPP Sheet 04",
    type: "dpp",
    subject: "Mathematics",
    faculty: "Rohit Kumar",
    size: "1.8 MB",
    uploadedAt: "Yesterday",
    thumbnail: "math",
  },
  {
    id: "s4",
    title: "Genetics - Mind Map & Quick Notes",
    type: "note",
    subject: "Biology",
    faculty: "Neha Singh",
    size: "2.1 MB",
    uploadedAt: "Yesterday",
    thumbnail: "biology",
  },
  {
    id: "s5",
    title: "Modern Physics - Previous Year Questions",
    type: "pdf",
    subject: "Physics",
    faculty: "Aman Verma",
    size: "3.5 MB",
    uploadedAt: "2 days ago",
    thumbnail: "physics",
  },
  {
    id: "s6",
    title: "Organic Chemistry - Reaction Map Video",
    type: "video",
    subject: "Chemistry",
    faculty: "Pooja Sharma",
    duration: "58m",
    uploadedAt: "3 days ago",
    thumbnail: "chemistry",
  },
  {
    id: "s7",
    title: "Calculus - Formula Sheet & Tricks",
    type: "note",
    subject: "Mathematics",
    faculty: "Rohit Kumar",
    size: "880 KB",
    uploadedAt: "3 days ago",
    thumbnail: "math",
  },
  {
    id: "s8",
    title: "Genetics - Practice Problems DPP",
    type: "dpp",
    subject: "Biology",
    faculty: "Neha Singh",
    size: "1.4 MB",
    uploadedAt: "4 days ago",
    thumbnail: "biology",
  },
];

// Test series
export const testSeries: TestSeries[] = [
  {
    id: "ts1",
    title: "JEE Mains Mock Test - 12 (Full Syllabus)",
    subject: "PCM",
    totalQuestions: 90,
    duration: 180,
    marks: 300,
    status: "available",
    startDate: "Today",
    endDate: "Tomorrow 11:59 PM",
    difficulty: "Hard",
  },
  {
    id: "ts2",
    title: "Rotational Motion - Chapter Test",
    subject: "Physics",
    totalQuestions: 30,
    duration: 60,
    marks: 120,
    status: "attempted",
    score: 96,
    rank: 142,
    totalAttempts: 1240,
    startDate: "Yesterday",
    endDate: "Yesterday 11:59 PM",
    difficulty: "Medium",
  },
  {
    id: "ts3",
    title: "Chemical Bonding - Quick Quiz",
    subject: "Chemistry",
    totalQuestions: 20,
    duration: 30,
    marks: 80,
    status: "available",
    startDate: "Today",
    endDate: "Tomorrow 11:59 PM",
    difficulty: "Easy",
  },
  {
    id: "ts4",
    title: "Definite Integrals - Concept Test",
    subject: "Mathematics",
    totalQuestions: 25,
    duration: 45,
    marks: 100,
    status: "in-progress",
    startDate: "Today",
    endDate: "Tomorrow 11:59 PM",
    difficulty: "Medium",
  },
  {
    id: "ts5",
    title: "Genetics - NEET Pattern Test",
    subject: "Biology",
    totalQuestions: 45,
    duration: 60,
    marks: 180,
    status: "attempted",
    score: 152,
    rank: 78,
    totalAttempts: 580,
    startDate: "2 days ago",
    endDate: "Yesterday 11:59 PM",
    difficulty: "Hard",
  },
  {
    id: "ts6",
    title: "Organic Chemistry - Mega Test",
    subject: "Chemistry",
    totalQuestions: 50,
    duration: 90,
    marks: 200,
    status: "expired",
    startDate: "5 days ago",
    endDate: "3 days ago 11:59 PM",
    difficulty: "Hard",
  },
];

// Doubts
export const doubts: Doubt[] = [
  {
    id: "d1",
    question: "In the question about a cylinder rolling down an incline, why do we consider both translational and rotational kinetic energy separately? Wouldn't friction at the contact point cancel out the rotation contribution?",
    subject: "Physics",
    askedAt: "2 hours ago",
    studentName: "Aarav Patel",
    studentAvatar: "AP",
    status: "answered",
    answer: "Great question! When a body rolls without slipping, the contact point is momentarily at rest. Static friction here does NOT do work (no relative displacement at contact point) — instead it converts gravitational PE into both translational KE of the centre of mass AND rotational KE about the centre of mass. Energy is conserved but partitioned. If the body slipped, kinetic friction would dissipate energy as heat. That's why we treat both forms separately.",
    answeredBy: "Aman Verma Sir",
    answeredAt: "1 hour ago",
    helpfulCount: 14,
  },
  {
    id: "d2",
    question: "How do we determine the hybridisation of an atom that has lone pairs? For example, in NH3 nitrogen has 5 valence electrons but the hybridisation is sp3 — why not sp2?",
    subject: "Chemistry",
    askedAt: "5 hours ago",
    studentName: "Priya Gupta",
    studentAvatar: "PG",
    status: "answered",
    answer: "Count the steric number = (number of bonded atoms) + (number of lone pairs). For NH3: 3 bonded H + 1 lone pair = 4 steric number → sp3 hybridisation. Lone pairs occupy hybrid orbitals too! sp2 would mean steric number 3, which only happens when there's no lone pair on the central atom (like BF3).",
    answeredBy: "Pooja Sharma Ma'am",
    answeredAt: "4 hours ago",
    helpfulCount: 23,
  },
  {
    id: "d3",
    question: "When evaluating definite integrals, why does the property ∫(a to b) f(x)dx = ∫(a to b) f(a+b-x)dx work? Is there a geometric intuition?",
    subject: "Mathematics",
    askedAt: "Yesterday",
    studentName: "Ishaan Reddy",
    studentAvatar: "IR",
    status: "answered",
    answer: "Yes! Geometrically, the substitution x → (a+b-x) reflects the interval [a,b] about its midpoint. The area under the curve is invariant under this reflection — what was on the left moves to the right and vice versa. So the integral stays the same. Very useful for integrals like ∫(0 to π/2) sinx/(sinx + cosx) dx where the swapped form is easier to combine.",
    answeredBy: "Rohit Kumar Sir",
    answeredAt: "Yesterday",
    helpfulCount: 31,
  },
  {
    id: "d4",
    question: "If a test cross is performed on a heterozygous individual (AaBb) with a double recessive (aabb), what's the expected phenotypic ratio in the offspring? Will it always be 1:1:1:1?",
    subject: "Biology",
    askedAt: "Yesterday",
    studentName: "Sneha Iyer",
    studentAvatar: "SI",
    status: "pending",
    attachments: ["genetics-diagram.png"],
  },
  {
    id: "d5",
    question: "Why is the moment of inertia of a solid sphere (2/5)MR² while for a hollow sphere it's (2/3)MR²? Intuitively the hollow one has more mass away from the axis, but how do we derive it without using triple integrals?",
    subject: "Physics",
    askedAt: "2 days ago",
    studentName: "Karan Mehta",
    studentAvatar: "KM",
    status: "pending",
  },
];

// Notifications
export const notifications: Notification[] = [
  { id: "n1", title: "Live Class Started", message: "Chemical Bonding - Hybridisation Deep Dive by Pooja Sharma Ma'am is now LIVE", time: "5 min ago", type: "class", isRead: false },
  { id: "n2", title: "New Study Material", message: "Rotational Motion - Complete Notes PDF uploaded by Aman Verma Sir", time: "2 hours ago", type: "material", isRead: false },
  { id: "n3", title: "Test Result Declared", message: "Genetics - NEET Pattern Test results out. You scored 152/180, Rank 78", time: "5 hours ago", type: "test", isRead: false },
  { id: "n4", title: "Doubt Answered", message: "Your doubt on Rolling Motion has been answered by Aman Verma Sir", time: "1 hour ago", type: "doubt", isRead: true },
  { id: "n5", title: "Fee Reminder", message: "Your next installment of ₹8,000 is due on 12 Oct 2026", time: "Yesterday", type: "payment", isRead: true },
];

// Subject color theming
export const subjectColors: Record<string, { bg: string; text: string; accent: string }> = {
  Physics: { bg: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", accent: "bg-rose-500" },
  Chemistry: { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", accent: "bg-emerald-500" },
  Mathematics: { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", accent: "bg-amber-500" },
  Biology: { bg: "bg-teal-100 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", accent: "bg-teal-500" },
  Science: { bg: "bg-violet-100 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", accent: "bg-violet-500" },
  PCM: { bg: "bg-fuchsia-100 dark:bg-fuchsia-950/40", text: "text-fuchsia-700 dark:text-fuchsia-300", accent: "bg-fuchsia-500" },
};

// User profile
export const userProfile = {
  name: "Aarav Sharma",
  avatar: "AS",
  className: "Class 12th - JEE 2026 Batch",
  batch: "JEE Mains & Advanced 2026 - Full Batch",
  rollNo: "JEE26-1247",
  joinedOn: "Apr 2026",
  attendance: 87,
  avgScore: 78,
  rank: 142,
  testsAttempted: 24,
  doubtsAsked: 18,
  doubtsAnswered: 12,
  streak: 23,
  feeStatus: {
    total: 48000,
    paid: 40000,
    pending: 8000,
    dueDate: "12 Oct 2026",
    installments: [
      { id: "i1", amount: 16000, label: "Admission Fee", date: "12 Apr 2026", status: "paid" },
      { id: "i2", amount: 24000, label: "1st Installment", date: "15 Jun 2026", status: "paid" },
      { id: "i3", amount: 8000, label: "2nd Installment", date: "12 Oct 2026", status: "due" },
    ],
  },
  achievements: [
    { id: "a1", title: "Top 10% in Physics", icon: "🏆", date: "Sep 2026" },
    { id: "a2", title: "23-Day Streak", icon: "🔥", date: "Ongoing" },
    { id: "a3", title: "Doubt Solver", icon: "💡", date: "Aug 2026" },
    { id: "a4", title: "Test Champion", icon: "🎯", date: "Jul 2026" },
  ],
};

// Stats for dashboard
export const dashboardStats = {
  streak: 23,
  todayClasses: 5,
  liveNow: 1,
  pendingTests: 2,
  pendingDoubts: 2,
  newMaterial: 3,
  weeklyStudy: 38, // hours
  weeklyGoal: 50, // hours
  weeklyTrend: [22, 28, 35, 41, 38, 45, 38], // Mon-Sun hours
  subjectWise: [
    { subject: "Physics", hours: 12, color: "bg-rose-500" },
    { subject: "Chemistry", hours: 9, color: "bg-emerald-500" },
    { subject: "Maths", hours: 11, color: "bg-amber-500" },
    { subject: "Biology", hours: 6, color: "bg-teal-500" },
  ],
};

// Recent activity feed
export const recentActivity = [
  { id: "a1", type: "test", icon: "📝", text: "Attempted <b>Rotational Motion - Chapter Test</b> and scored <b>96/120</b>", time: "Yesterday" },
  { id: "a2", type: "class", icon: "🎥", text: "Attended live class <b>Chemical Bonding - Lecture 03</b> by Pooja Ma'am", time: "Yesterday" },
  { id: "a3", type: "material", icon: "📚", text: "Downloaded <b>Modern Physics PYQ PDF</b>", time: "2 days ago" },
  { id: "a4", type: "doubt", icon: "💬", text: "Your doubt on <b>Genetics Test Cross</b> is awaiting faculty response", time: "2 days ago" },
  { id: "a5", type: "test", icon: "🏆", text: "Ranked <b>#78</b> in <b>Genetics - NEET Pattern Test</b>", time: "3 days ago" },
];

// Helper to render subject icon based on thumbnail key
export const thumbnailColors: Record<string, string> = {
  physics: "from-rose-500 to-rose-700",
  chemistry: "from-emerald-500 to-emerald-700",
  math: "from-amber-500 to-amber-700",
  biology: "from-teal-500 to-teal-700",
  science: "from-violet-500 to-violet-700",
};
