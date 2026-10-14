import { db } from "./db";

// Seed script — populates ONLY course content metadata (subjects, sample
// batches, lectures with external video links, study material entries,
// tests, sample doubts+answers, sample notifications).
//
// NO hardcoded user accounts or passwords. Faculty and students must
// register themselves via the UI. The first user who signs up with the
// email matching `SUPER_ADMIN_EMAIL` env var (or the very first sign-up
// if the env var is unset) gets promoted to SUPER_ADMIN.
//
// Run with: `bun run src/lib/seed.ts`

async function seed() {
  console.log("Seeding course content (no users/passwords)...");

  // We need a faculty user to attach courses to. Check if there's any
  // existing user; if not, skip course seeding (the first registered
  // user will become SUPER_ADMIN and can create courses via UI).
  const existingUsers = await db.user.count();
  if (existingUsers === 0) {
    console.log("No users found. Skipping course seed.");
    console.log("First sign-up via UI will be promoted to SUPER_ADMIN.");
    console.log("Run this seed script again after creating a faculty user.");
    return;
  }
  // Find any existing faculty or admin user to attach courses to.
  const faculty = await db.user.findFirst({
    where: { role: { in: ["FACULTY", "COACHING_OWNER", "SUPER_ADMIN"] } },
  });
  if (!faculty) {
    console.log("No faculty found. Skipping course seed.");
    console.log("Promote a user to FACULTY/SUPER_ADMIN via UI, then re-run this seed.");
    return;
  }

  // --- Courses (only if not already present) ---
  const courseDefs = [
    { title: "JEE Mains & Advanced 2026 - Full Batch", slug: "jee-2026-full-batch", subject: "PCM Complete", price: 48000, badge: "LIVE BATCH", totalLessons: 480, students: 1240, rating: 4.8 },
    { title: "NEET 2026 - Biology Booster", slug: "neet-2026-biology-booster", subject: "Biology", price: 35000, badge: "POPULAR", totalLessons: 220, students: 890, rating: 4.7 },
    { title: "Foundation 11th - Mathematics Crash", slug: "foundation-11-maths-crash", subject: "Mathematics", price: 25000, totalLessons: 180, students: 540, rating: 4.9 },
    { title: "Class 10th - Science Foundation", slug: "class-10-science-foundation", subject: "Science", price: 18000, totalLessons: 150, students: 1560, rating: 4.6 },
    { title: "JEE Advanced - Organic Chemistry", slug: "jee-advanced-organic-chemistry", subject: "Chemistry", price: 30000, totalLessons: 95, students: 420, rating: 4.8 },
    { title: "Crash Course - Modern Physics", slug: "crash-modern-physics", subject: "Physics", price: 12000, badge: "NEW", totalLessons: 32, students: 320, rating: 4.5 },
  ];
  const courseIds: Record<string, string> = {};
  for (const c of courseDefs) {
    const exists = await db.course.findUnique({ where: { slug: c.slug } });
    if (!exists) {
      const created = await db.course.create({
        data: {
          title: c.title,
          slug: c.slug,
          description: c.title,
          subject: c.subject,
          facultyId: faculty.id,
          facultyName: faculty.name,
          facultyAvatar: faculty.avatarText ?? faculty.name.slice(0, 2).toUpperCase(),
          totalLessons: c.totalLessons,
          students: c.students,
          rating: c.rating,
          price: c.price,
          badge: c.badge ?? null,
          isPublished: true,
        },
      });
      courseIds[c.slug] = created.id;
      console.log(`  + Created course: ${c.title}`);
    } else {
      courseIds[c.slug] = exists.id;
    }
  }

  // --- Lectures for JEE batch (with external sample video URLs) ---
  const jeeCourseId = courseIds["jee-2026-full-batch"];
  if (jeeCourseId) {
    const lectureDefs = [
      { title: "Rotational Motion - Lecture 4", subject: "Physics", type: "RECORDED", status: "COMPLETED", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
      { title: "Chemical Bonding - Hybridisation Deep Dive", subject: "Chemistry", type: "LIVE", status: "LIVE", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { title: "Calculus - Definite Integrals Made Easy", subject: "Mathematics", type: "LIVE", status: "UPCOMING" },
      { title: "Genetics - Mendel's Laws Explained", subject: "Biology", type: "LIVE", status: "UPCOMING" },
      { title: "DPP Solving Session - Rotational Motion", subject: "Physics", type: "LIVE", status: "UPCOMING" },
      { title: "Preview Lecture - Free Demo", subject: "Physics", type: "RECORDED", status: "COMPLETED", isPreview: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    ];
    for (const l of lectureDefs) {
      const exists = await db.lecture.findFirst({ where: { courseId: jeeCourseId, title: l.title } });
      if (!exists) {
        await db.lecture.create({
          data: {
            courseId: jeeCourseId,
            title: l.title,
            description: l.title,
            subject: l.subject,
            facultyName: faculty.name,
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
    console.log(`  + Lectures for JEE batch (${lectureDefs.length})`);

    // --- Study materials ---
    const matDefs = [
      { title: "Rotational Motion - Complete Notes PDF", type: "PDF", subject: "Physics", fileSize: "4.2 MB", fileUrl: "https://example.com/sample.pdf", isNew: true },
      { title: "Chemical Bonding - Hybridisation Video Lecture", type: "VIDEO", subject: "Chemistry", duration: "1h 24m", fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", isNew: true },
      { title: "Definite Integrals - DPP Sheet 04", type: "DPP", subject: "Mathematics", fileSize: "1.8 MB", fileUrl: "https://example.com/sample.pdf" },
      { title: "Genetics - Mind Map & Quick Notes", type: "NOTE", subject: "Biology", fileSize: "2.1 MB", fileUrl: "https://example.com/sample.pdf" },
      { title: "Modern Physics - PYQ PDF (Free Preview)", type: "PDF", subject: "Physics", fileSize: "3.5 MB", fileUrl: "https://example.com/sample.pdf", isPreview: true },
    ];
    for (const m of matDefs) {
      const exists = await db.studyMaterial.findFirst({ where: { courseId: jeeCourseId, title: m.title } });
      if (!exists) {
        await db.studyMaterial.create({
          data: {
            courseId: jeeCourseId,
            title: m.title,
            type: m.type,
            subject: m.subject,
            facultyName: faculty.name,
            fileSize: m.fileSize ?? null,
            duration: m.duration ?? null,
            fileUrl: m.fileUrl ?? null,
            isPreview: m.isPreview ?? false,
            isNew: m.isNew ?? false,
          },
        });
      }
    }
    console.log(`  + Materials (${matDefs.length})`);

    // --- Tests ---
    const testDefs = [
      { title: "JEE Mains Mock Test - 12 (Full Syllabus)", subject: "PCM", totalQuestions: 90, duration: 180, marks: 300, difficulty: "Hard" },
      { title: "Rotational Motion - Chapter Test", subject: "Physics", totalQuestions: 30, duration: 60, marks: 120, difficulty: "Medium" },
      { title: "Chemical Bonding - Quick Quiz", subject: "Chemistry", totalQuestions: 20, duration: 30, marks: 80, difficulty: "Easy" },
      { title: "Genetics - NEET Pattern Test", subject: "Biology", totalQuestions: 45, duration: 60, marks: 180, difficulty: "Hard" },
    ];
    for (const t of testDefs) {
      const exists = await db.test.findFirst({ where: { courseId: jeeCourseId, title: t.title } });
      if (!exists) {
        await db.test.create({
          data: {
            courseId: jeeCourseId,
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
    console.log(`  + Tests (${testDefs.length})`);
  }

  console.log("Seed complete. No users were created.");
  console.log("Sign up via the UI to create users (first user can become SUPER_ADMIN).");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
