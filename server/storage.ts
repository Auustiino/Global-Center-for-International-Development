import { 
  users, calls, userLanguages, 
  User, InsertUser, UpdateUser, 
  UserLanguage, InsertUserLanguage, UpdateUserLanguage,
  Call, InsertCall, UserResponse, CallResponse
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUserWithLanguages(id: number): Promise<UserResponse | undefined>;

  // UserLanguage operations
  getUserLanguages(userId: number): Promise<UserLanguage[]>;
  addUserLanguage(language: InsertUserLanguage): Promise<UserLanguage>;
  updateUserLanguage(id: number, language: UpdateUserLanguage): Promise<UserLanguage | undefined>;
  deleteUserLanguage(id: number): Promise<boolean>;

  // Call operations
  getCalls(userId: number): Promise<CallResponse[]>;
  getCallById(id: number): Promise<Call | undefined>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: number, endTime: Date, duration: number): Promise<Call | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userLanguages: Map<number, UserLanguage>;
  private calls: Map<number, Call>;
  private currentUserId: number;
  private currentUserLanguageId: number;
  private currentCallId: number;

  constructor() {
    this.users = new Map();
    this.userLanguages = new Map();
    this.calls = new Map();
    this.currentUserId = 1;
    this.currentUserLanguageId = 1;
    this.currentCallId = 1;

    // Add sample user for testing
    this.createUser({
      username: "johndoe",
      password: "password123",
      displayName: "John Doe",
      email: "john@example.com",
      bio: "Language enthusiast and software developer",
      profilePicture: null,
      nativeLanguage: "en"
    });

    // Add sample user languages
    this.addUserLanguage({
      userId: 1,
      language: "es",
      proficiency: "basic"
    });

    this.addUserLanguage({
      userId: 1,
      language: "fr",
      proficiency: "beginner"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUserWithLanguages(id: number): Promise<UserResponse | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const languages = await this.getUserLanguages(id);
    
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      languages: languages
    };
  }

  // UserLanguage operations
  async getUserLanguages(userId: number): Promise<UserLanguage[]> {
    return Array.from(this.userLanguages.values()).filter(
      (language) => language.userId === userId
    );
  }

  async addUserLanguage(insertLanguage: InsertUserLanguage): Promise<UserLanguage> {
    const id = this.currentUserLanguageId++;
    const language: UserLanguage = { ...insertLanguage, id };
    this.userLanguages.set(id, language);
    return language;
  }

  async updateUserLanguage(id: number, languageData: UpdateUserLanguage): Promise<UserLanguage | undefined> {
    const language = this.userLanguages.get(id);
    if (!language) return undefined;

    const updatedLanguage = { ...language, ...languageData };
    this.userLanguages.set(id, updatedLanguage);
    return updatedLanguage;
  }

  async deleteUserLanguage(id: number): Promise<boolean> {
    return this.userLanguages.delete(id);
  }

  // Call operations
  async getCalls(userId: number): Promise<CallResponse[]> {
    const userCalls = Array.from(this.calls.values()).filter(
      (call) => call.initiatorId === userId || call.receiverId === userId
    );

    return Promise.all(userCalls.map(async (call) => {
      const initiator = await this.getUser(call.initiatorId);
      const receiver = await this.getUser(call.receiverId);

      return {
        ...call,
        startTime: call.startTime.toISOString(),
        endTime: call.endTime ? call.endTime.toISOString() : null,
        initiator: initiator ? {
          id: initiator.id,
          username: initiator.username,
          displayName: initiator.displayName,
          email: initiator.email,
          bio: initiator.bio,
          profilePicture: initiator.profilePicture,
          nativeLanguage: initiator.nativeLanguage,
          createdAt: initiator.createdAt.toISOString()
        } : undefined,
        receiver: receiver ? {
          id: receiver.id,
          username: receiver.username,
          displayName: receiver.displayName,
          email: receiver.email,
          bio: receiver.bio,
          profilePicture: receiver.profilePicture,
          nativeLanguage: receiver.nativeLanguage,
          createdAt: receiver.createdAt.toISOString()
        } : undefined
      };
    }));
  }

  async getCallById(id: number): Promise<Call | undefined> {
    return this.calls.get(id);
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const id = this.currentCallId++;
    const call: Call = { 
      ...insertCall, 
      id, 
      startTime: new Date(),
      endTime: null,
      duration: null
    };
    this.calls.set(id, call);
    return call;
  }

  async updateCall(id: number, endTime: Date, duration: number): Promise<Call | undefined> {
    const call = this.calls.get(id);
    if (!call) return undefined;

    const updatedCall = { 
      ...call, 
      endTime,
      duration 
    };
    this.calls.set(id, updatedCall);
    return updatedCall;
  }
}

export const storage = new MemStorage();
