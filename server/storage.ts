import { 
  users, calls, userLanguages, 
  User, InsertUser, UpdateUser, 
  UserLanguage, InsertUserLanguage, UpdateUserLanguage,
  Call, InsertCall, UserResponse, CallResponse
} from "@shared/schema";
import { db } from "./db";
import { eq, or, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result; // Convert to boolean
  }

  async getUserWithLanguages(id: number): Promise<UserResponse | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    return db.select().from(userLanguages).where(eq(userLanguages.userId, userId));
  }

  async addUserLanguage(insertLanguage: InsertUserLanguage): Promise<UserLanguage> {
    const [language] = await db.insert(userLanguages).values(insertLanguage).returning();
    return language;
  }

  async updateUserLanguage(id: number, languageData: UpdateUserLanguage): Promise<UserLanguage | undefined> {
    const [updatedLanguage] = await db
      .update(userLanguages)
      .set(languageData)
      .where(eq(userLanguages.id, id))
      .returning();
    return updatedLanguage;
  }

  async deleteUserLanguage(id: number): Promise<boolean> {
    const result = await db.delete(userLanguages).where(eq(userLanguages.id, id));
    return !!result; // Convert to boolean
  }

  // Call operations
  async getCalls(userId: number): Promise<CallResponse[]> {
    const userCalls = await db
      .select()
      .from(calls)
      .where(or(eq(calls.initiatorId, userId), eq(calls.receiverId, userId)))
      .orderBy(desc(calls.startTime));

    return Promise.all(userCalls.map(async (call) => {
      const [initiator] = await db.select().from(users).where(eq(users.id, call.initiatorId));
      const [receiver] = await db.select().from(users).where(eq(users.id, call.receiverId));

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
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call;
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const [call] = await db.insert(calls).values(insertCall).returning();
    return call;
  }

  async updateCall(id: number, endTime: Date, duration: number): Promise<Call | undefined> {
    const [updatedCall] = await db
      .update(calls)
      .set({ endTime, duration })
      .where(eq(calls.id, id))
      .returning();
    return updatedCall;
  }
}

export const storage = new DatabaseStorage();
