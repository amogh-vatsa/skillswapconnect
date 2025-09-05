import { storage } from "./storage";
import { nanoid } from "nanoid";

export async function seedDemoData() {
  try {
    console.log("🌱 Seeding demo data to match original Replit app...");
    
    // Create the demo user "AMOGH VATSA" like in the original
    const demoUserId = nanoid();
    const demoUser = await storage.upsertUser({
      id: demoUserId,
      email: "amogh@skillswap.demo",
      firstName: "AMOGH",
      lastName: "VATSA", 
      profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=amogh",
      bio: "Passionate web developer and tech enthusiast",
      title: "Full Stack Developer",
      isVerified: false
    });

    // Create the "web dev" skill like in the original
    await storage.createSkill({
      id: nanoid(),
      userId: demoUserId,
      title: "web dev",
      description: "I can teach web dev",
      category: "Technology",
      tags: ["web dev", "Technology"],
      level: "Intermediate",
      seeking: "Looking to learn mobile development and UI/UX design",
      isActive: true
    });

    // Create a few more demo skills for variety
    const user2Id = nanoid();
    await storage.upsertUser({
      id: user2Id,
      email: "sarah@skillswap.demo",
      firstName: "Sarah",
      lastName: "Johnson",
      profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      bio: "Digital marketing expert with 5+ years experience",
      title: "Marketing Specialist", 
      isVerified: false
    });

    await storage.createSkill({
      id: nanoid(),
      userId: user2Id,
      title: "Digital Marketing",
      description: "I can teach digital marketing strategies, SEO, and social media marketing",
      category: "Business",
      tags: ["marketing", "seo", "social media"],
      level: "Advanced",
      seeking: "Want to learn data analysis and graphic design",
      isActive: true
    });

    const user3Id = nanoid();
    await storage.upsertUser({
      id: user3Id,
      email: "mike@skillswap.demo", 
      firstName: "Mike",
      lastName: "Chen",
      profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      bio: "Professional guitarist and music producer",
      title: "Music Producer",
      isVerified: false
    });

    await storage.createSkill({
      id: nanoid(),
      userId: user3Id,
      title: "Guitar Lessons", 
      description: "I can teach acoustic and electric guitar, from beginner to advanced",
      category: "Music",
      tags: ["guitar", "music", "lessons"],
      level: "Advanced",
      seeking: "Interested in learning piano and music theory",
      isActive: true
    });

    console.log("✅ Demo data seeded successfully!");
    console.log(`   - Created user: ${demoUser.firstName} ${demoUser.lastName}`);
    console.log("   - Created demo skills for discover page");
    
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
  }
}
