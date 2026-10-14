import { db } from "./db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // --- Faculty ---
  const facultyPw = await bcrypt.hash("faculty123", 12);
  const aman = await db.user.upsert({
    where: { email: "aman.faculty@coaching.in" },
    update: {},
    create: {
      email: "aman.faculty@coaching.in",
      phone: "9999900001",
      name: "Aman Verma",
      passwordHash: facultyPw,
      role: "FACULTY",
      avatarText: "AV",
      className: "Physics Faculty",
      batchName: "JEE 2026",
    },
  });
  const pooja = await db.user.upsert({
    where: { email: "pooja.faculty@coaching.in" },
    update: {},
    create: {
      email: "pooja.faculty@coaching.in",
      phone: "9999900002",
      name: "Pooja Sharma",
      passwordHash: facultyPw,
      role: "FACULTY",
      avatarText: "PS",
      className: "Chemistry Faculty",
      batchName: "JEE 2026",
    },
  });
  const rohit = await db.user.upsert({
    where: { email: "rohit.faculty@coaching.in" },
    update: {},
    create: {
      email: "rohit.faculty@coaching.in",
      phone: "9999900003",
      name: "Rohit Kumar",
      passwordHash: facultyPw,
      role: "FACULTY",
      avatarText: "RK",
      className: "Maths Faculty",
      batchName: "JEE 2026",
    },
  });
  const neha = await db.user.upsert({
    where: { email: "neha.faculty@coaching.in" },
    update: {},
    create: {
      email: "neha.faculty@coaching.in",
      phone: "9999900004",
      name: "Neha Singh",
      passwordHash: facultyPw,
      role: "FACULTY",
      avatarText: "NS",
      className: "Biology Faculty",
      batchName: "NEET 2026",
    },
  });

  // --- Demo student (paid) ---
  const studentPw = await bcrypt.hash("student123", 12);
  const aarav = await db.user.upsert({
    where: { email: "aarav@student.com" },
    update: {},
    create: {
      email: "aarav@student.com",
      phone: "9000000001",
      name: "Aarav Sharma",
      passwordHash: studentPw,
      role: "STUDENT",
      rollNo: "JEE26-1247",
      avatarText: "AS",
      className: "Class 12th",
      batchName: "JEE 2026",
      streak: 23,
      attendance: 87,
      avgScore: 78,
      rank: 142,
    },
  });

  // --- Demo student (NOT paid) — to test payment gate ---
  const freeloader = await db.user.upsert({
    where: { email: "free@student.com" },
    update: {},
    create: {
      email: "free@student.com",
      phone: "9000000002",
      name: "New Student",
      passwordHash: studentPw,
      role: "STUDENT",
      rollNo: "NEW-001",
      avatarText: "NS",
      className: "Class 11th",
      batchName: "Foundation",
    },
  });

  // --- Courses ---
  const c1 = await db.course.upsert({
    where: { slug: "jee-2026-full-batch" },
    update: {},
    create: {
      title: "JEE Mains & Advanced 2026 - Full Batch",
      slug: "jee-2026-full-batch",
      description: "Complete PCM coverage for JEE Mains + Advanced with live classes, DPPs, test series, and doubt solving.",
      subject: "PCM Complete",
      facultyId: aman.id,
      facultyName: "Aman Verma",
      facultyAvatar: "AV",
      totalLessons: 480,
      students: 1240,
      rating: 4.8,
      price: 48000, // Rs 480
      badge: "LIVE BATCH",
    },
  });
  const c2 = await db.course.upsert({
    where: { slug: "neet-2026-biology-booster" },
    update: {},
    create: {
      title: "NEET 2026 - Biology Booster",
      slug: "neet-2026-biology-booster",
      description: "Complete Biology for NEET with NCERT line-by-line coverage, diagrams & NEET pattern tests.",
      subject: "Biology",
      facultyId: neha.id,
      facultyName: "Neha Singh",
      facultyAvatar: "NS",
      totalLessons: 220,
      students: 890,
      rating: 4.7,
      price: 35000,
      badge: "POPULAR",
    },
  });
  const c3 = await db.course.upsert({
    where: { slug: "foundation-11-maths-crash" },
    update: {},
    create: {
      title: "Foundation 11th - Mathematics Crash",
      slug: "foundation-11-maths-crash",
      description: "Quick revision batch for Class 11 Maths covering all important chapters for JEE foundation.",
      subject: "Mathematics",
      facultyId: rohit.id,
      facultyName: "Rohit Kumar",
      facultyAvatar: "RK",
      totalLessons: 180,
      students: 540,
      rating: 4.9,
      price: 25000,
    },
  });
  const c4 = await db.course.upsert({
    where: { slug: "class-10-science-foundation" },
    update: {},
    create: {
      title: "Class 10th - Science Foundation",
      slug: "class-10-science-foundation",
      description: "Complete Science for Class 10 CBSE/ICSE with practicals & NTSE prep.",
      subject: "Science",
      facultyId: pooja.id,
      facultyName: "Pooja Sharma",
      facultyAvatar: "PS",
      totalLessons: 150,
      students: 1560,
      rating: 4.6,
      price: 18000,
    },
  });
  const c5 = await db.course.upsert({
    where: { slug: "jee-advanced-organic-chemistry" },
    update: {},
    create: {
      title: "JEE Advanced - Organic Chemistry",
      slug: "jee-advanced-organic-chemistry",
      description: "Deep-dive into Organic Chemistry mechanisms — name reactions, rearrangements, and JEE Advanced PYQs.",
      subject: "Chemistry",
      facultyId: pooja.id,
      facultyName: "Pooja Sharma",
      facultyAvatar: "PS",
      totalLessons: 95,
      students: 420,
      rating: 4.8,
      price: 30000,
    },
  });
  const c6 = await db.course.upsert({
    where: { slug: "crash-modern-physics" },
    update: {},
    create: {
      title: "Crash Course - Modern Physics",
      slug: "crash-modern-physics",
      description: "Quick revision of Modern Physics — photoelectric effect, nuclear physics, semiconductors, dual nature.",
      subject: "Physics",
      facultyId: aman.id,
      facultyName: "Aman Verma",
      facultyAvatar: "AV",
      totalLessons: 32,
      students: 320,
      rating: 4.5,
      price: 12000,
      badge: "NEW",
    },
  });

  // --- Enrollments (Aarav is enrolled in c1, c2, c3, c4, c5) ---
  for (const courseId of [c1.id, c2.id, c3.id, c4.id, c5.id]) {
    const exists = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: aarav.id, courseId } },
    });
    if (!exists) {
      await db.enrollment.create({
        data: {
          userId: aarav.id,
          courseId,
          status: "ACTIVE",
          progress: 30,
          completedLessons: 142,
        },
      });
    }
  }
  // And mark as paid via Payment records
  for (const courseId of [c1.id, c2.id, c3.id, c4.id, c5.id]) {
    const existingPayment = await db.payment.findFirst({
      where: { userId: aarav.id, courseId, status: "PAID" },
    });
    if (!existingPayment) {
      await db.payment.create({
        data: {
          userId: aarav.id,
          courseId,
          amount: 40000,
          status: "PAID",
          provider: "RAZORPAY",
          providerOrderId: `order_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          providerPaymentId: `pay_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          providerSignature: "demo_signature",
          verifiedAt: new Date(),
          receipt: `rcpt_${Date.now()}`,
        },
      });
    }
  }

  // --- Lectures for c1 (JEE batch) ---
  const lectureTitles = [
    { title: "Rotational Motion - Lecture 4", subject: "Physics", facultyName: "Aman Verma", type: "RECORDED", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { title: "Chemical Bonding - Hybridisation Deep Dive", subject: "Chemistry", facultyName: "Pooja Sharma", type: "LIVE", status: "LIVE", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
    { title: "Calculus - Definite Integrals Made Easy", subject: "Mathematics", facultyName: "Rohit Kumar", type: "LIVE", status: "UPCOMING" },
    { title: "Genetics - Mendel's Laws Explained", subject: "Biology", facultyName: "Neha Singh", type: "LIVE", status: "UPCOMING" },
    { title: "DPP Solving Session - Rotational Motion", subject: "Physics", facultyName: "Aman Verma", type: "LIVE", status: "UPCOMING" },
    { title: "Preview Lecture - Free Demo", subject: "Physics", facultyName: "Aman Verma", type: "RECORDED", status: "COMPLETED", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  ];
  for (const l of lectureTitles) {
    const exists = await db.lecture.findFirst({
      where: { courseId: c1.id, title: l.title },
    });
    if (!exists) {
      await db.lecture.create({
        data: {
          courseId: c1.id,
          title: l.title,
          description: l.title,
          subject: l.subject,
          facultyName: l.facultyName,
          type: l.type,
          status: l.status ?? "COMPLETED",
          startTime: l.status === "LIVE" ? new Date() : l.status === "UPCOMING" ? new Date(Date.now() + 3600_000) : new Date(Date.now() - 3600_000),
          duration: 90,
          videoUrl: l.videoUrl ?? null,
          isPreview: l.isPreview ?? false,
          attendees: l.status === "LIVE" ? 856 : 0,
        },
      });
    }
  }

  // --- Study Materials ---
  const mats = [
    { title: "Rotational Motion - Complete Notes PDF", type: "PDF", subject: "Physics", facultyName: "Aman Verma", fileSize: "4.2 MB", fileUrl: "/sample-pdf.pdf", isNew: true },
    { title: "Chemical Bonding - Hybridisation Video Lecture", type: "VIDEO", subject: "Chemistry", facultyName: "Pooja Sharma", duration: "1h 24m", fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", isNew: true },
    { title: "Definite Integrals - DPP Sheet 04", type: "DPP", subject: "Mathematics", facultyName: "Rohit Kumar", fileSize: "1.8 MB", fileUrl: "/sample-pdf.pdf" },
    { title: "Genetics - Mind Map & Quick Notes", type: "NOTE", subject: "Biology", facultyName: "Neha Singh", fileSize: "2.1 MB", fileUrl: "/sample-pdf.pdf" },
    { title: "Modern Physics - PYQ PDF (Free Preview)", type: "PDF", subject: "Physics", facultyName: "Aman Verma", fileSize: "3.5 MB", fileUrl: "/sample-pdf.pdf", isPreview: true },
  ];
  for (const m of mats) {
    const exists = await db.studyMaterial.findFirst({
      where: { courseId: c1.id, title: m.title },
    });
    if (!exists) {
      await db.studyMaterial.create({
        data: {
          courseId: c1.id,
          title: m.title,
          type: m.type,
          subject: m.subject,
          facultyName: m.facultyName,
          fileSize: m.fileSize ?? null,
          duration: m.duration ?? null,
          fileUrl: m.fileUrl ?? null,
          isPreview: m.isPreview ?? false,
          isNew: m.isNew ?? false,
        },
      });
    }
  }

  // --- Tests ---
  const tests = [
    { title: "JEE Mains Mock Test - 12 (Full Syllabus)", subject: "PCM", totalQuestions: 90, duration: 180, marks: 300, difficulty: "Hard" },
    { title: "Rotational Motion - Chapter Test", subject: "Physics", totalQuestions: 30, duration: 60, marks: 120, difficulty: "Medium" },
    { title: "Chemical Bonding - Quick Quiz", subject: "Chemistry", totalQuestions: 20, duration: 30, marks: 80, difficulty: "Easy" },
    { title: "Genetics - NEET Pattern Test", subject: "Biology", totalQuestions: 45, duration: 60, marks: 180, difficulty: "Hard" },
  ];
  for (const t of tests) {
    const exists = await db.test.findFirst({
      where: { courseId: c1.id, title: t.title },
    });
    if (!exists) {
      await db.test.create({
        data: {
          courseId: c1.id,
          title: t.title,
          subject: t.subject,
          totalQuestions: t.totalQuestions,
          duration: t.duration,
          marks: t.marks,
          difficulty: t.difficulty,
          startDate: new Date(Date.now() - 86400_000),
          endDate: new Date(Date.now() + 86400_000),
        },
      });
    }
  }

  // --- Sample doubts ---
  const d1 = await db.doubt.create({
    data: {
      userId: aarav.id,
      subject: "Physics",
      question: "In the question about a cylinder rolling down an incline, why do we consider both translational and rotational kinetic energy separately? Wouldn't friction at the contact point cancel out the rotation contribution?",
      status: "ANSWERED",
      helpfulCount: 14,
    },
  });
  await db.doubtAnswer.create({
    data: {
      doubtId: d1.id,
      userId: aman.id,
      answer: "Great question! When a body rolls without slipping, the contact point is momentarily at rest. Static friction here does NOT do work (no relative displacement at contact point) — instead it converts gravitational PE into both translational KE of the centre of mass AND rotational KE about the centre of mass. Energy is conserved but partitioned. If the body slipped, kinetic friction would dissipate energy as heat. That's why we treat both forms separately.",
    },
  });

  await db.doubt.create({
    data: {
      userId: aarav.id,
      subject: "Biology",
      question: "If a test cross is performed on a heterozygous individual (AaBb) with a double recessive (aabb), what's the expected phenotypic ratio in the offspring? Will it always be 1:1:1:1?",
      status: "PENDING",
    },
  });

  // --- Notifications ---
  const notifs = [
    { title: "Live Class Started", message: "Chemical Bonding - Hybridisation Deep Dive by Pooja Sharma Ma'am is now LIVE", type: "CLASS" },
    { title: "New Study Material", message: "Rotational Motion - Complete Notes PDF uploaded by Aman Verma Sir", type: "MATERIAL" },
    { title: "Test Result Declared", message: "Genetics - NEET Pattern Test results out. You scored 152/180, Rank 78", type: "TEST" },
    { title: "Doubt Answered", message: "Your doubt on Rolling Motion has been answered by Aman Verma Sir", type: "DOUBT" },
    { title: "Fee Reminder", message: "Your next installment of Rs 480 is due on 12 Oct 2026", type: "PAYMENT" },
  ];
  for (const n of notifs) {
    const exists = await db.notification.findFirst({
      where: { userId: aarav.id, title: n.title },
    });
    if (!exists) {
      await db.notification.create({
        data: { userId: aarav.id, ...n },
      });
    }
  }

  console.log("Seed complete!");
  console.log("Demo accounts (password: student123 / faculty123):");
  console.log("  - Aarav (paid student): aarav@student.com");
  console.log("  - Free student: free@student.com");
  console.log("  - Faculty: aman.faculty@coaching.in");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
