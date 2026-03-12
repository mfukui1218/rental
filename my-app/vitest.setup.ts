import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("rentalId=test-rental-1"),
  useParams: () => ({ id: "test-rental-1" }),
}));

// Mock CSS modules
vi.mock("*.module.css", () => new Proxy({}, { get: (_, prop) => prop }));
vi.mock("*.css", () => ({}));

// Mock Firebase
const mockAuth = {
  currentUser: { uid: "test-uid", email: "test@example.com" },
  app: { options: { projectId: "test" } },
};

vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: mockAuth,
  storage: {},
  app: {},
  default: {},
}));

vi.mock("firebase/auth", () => ({
  getAuth: () => mockAuth,
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb({
      uid: "test-uid",
      email: "test@example.com",
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: { admin: true } }),
    });
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: { uid: "test-uid", email: "test@example.com" },
  }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: { uid: "new-uid", email: "new@example.com" },
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: "new-doc-id" }),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    id: "test-rental-1",
    data: () => ({
      name: "テスト商品",
      category: "1000円/日",
      description: "テスト説明",
      imageUrl: "",
      blockedDates: ["2026-03-15", "2026-03-16"],
    }),
  }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn((_q, onNext) => {
    onNext({ docs: [] });
    return vi.fn();
  }),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => "mock-timestamp"),
  arrayUnion: vi.fn((...args: any[]) => args),
  Timestamp: { now: vi.fn() },
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn().mockResolvedValue({}),
  getDownloadURL: vi.fn().mockResolvedValue("https://example.com/image.png"),
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

// Mock window.alert / confirm
vi.spyOn(window, "alert").mockImplementation(() => {});
vi.spyOn(window, "confirm").mockImplementation(() => true);
