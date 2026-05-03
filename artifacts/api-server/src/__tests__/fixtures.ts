import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret-key-for-vitest";

export const schoolId = "school-uuid-1";
export const userId = "user-uuid-1";
export const adminId = "admin-uuid-1";
export const postId = "post-uuid-1";
export const commentId = "comment-uuid-1";
export const reportId = "report-uuid-1";

export const mockSchool = {
  id: schoolId,
  name: "Test School",
  joinCode: "ABC123",
  isActive: true,
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

export const mockUser = {
  id: userId,
  schoolId,
  nickname: "HappyBrave",
  passwordHash: "$2b$12$fakehashedpassword",
  role: "student" as const,
  kindnessScore: 0,
  isSuspended: false,
  avatar: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

export const mockAdmin = {
  id: adminId,
  schoolId,
  nickname: "AdminStrong",
  passwordHash: "$2b$12$fakehashedpassword",
  role: "admin" as const,
  kindnessScore: 10,
  isSuspended: false,
  avatar: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

export const mockPost = {
  id: postId,
  schoolId,
  authorId: userId,
  authorNickname: "HappyBrave",
  type: "kindness_act" as const,
  content: "I helped someone today",
  isHidden: false,
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

export const mockComment = {
  id: commentId,
  postId,
  authorId: userId,
  authorNickname: "HappyBrave",
  content: "This is great!",
  isHidden: false,
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

export const mockReport = {
  id: reportId,
  reporterId: userId,
  targetType: "post" as const,
  targetId: postId,
  reason: "spam" as const,
  status: "pending" as const,
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

export function makeToken(
  payload: { userId: string; schoolId: string; nickname: string; role: "student" | "admin" } = {
    userId,
    schoolId,
    nickname: "HappyBrave",
    role: "student",
  }
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export const studentToken = makeToken({ userId, schoolId, nickname: "HappyBrave", role: "student" });
export const adminToken = makeToken({ userId: adminId, schoolId, nickname: "AdminStrong", role: "admin" });
