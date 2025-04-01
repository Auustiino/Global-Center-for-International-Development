import { 
  users, calls, userLanguages, scheduledCalls,
  User, InsertUser, UpdateUser, 
  UserLanguage, InsertUserLanguage, UpdateUserLanguage,
  Call, InsertCall, UserResponse, CallResponse,
  ScheduledCall, InsertScheduledCall, UpdateScheduledCall, ScheduledCallResponse
} from "@shared/schema";
import { db } from "./db";
import { eq, or, desc, and, gte, lte } from "drizzle-orm";

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
  
  // Scheduled call operations
  getScheduledCalls(userId: number): Promise<ScheduledCallResponse[]>;
  getScheduledCallById(id: number): Promise<ScheduledCall | undefined>;
  getScheduledCallsByDate(userId: number, date: Date): Promise<ScheduledCallResponse[]>;
  createScheduledCall(scheduledCall: InsertScheduledCall): Promise<ScheduledCall>;
  updateScheduledCall(id: number, data: UpdateScheduledCall): Promise<ScheduledCall | undefined>;
  deleteScheduledCall(id: number): Promise<boolean>;
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
          twitterUrl: initiator.twitterUrl,
          facebookUrl: initiator.facebookUrl,
          instagramUrl: initiator.instagramUrl,
          linkedinUrl: initiator.linkedinUrl,
          githubUrl: initiator.githubUrl,
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
          twitterUrl: receiver.twitterUrl,
          facebookUrl: receiver.facebookUrl,
          instagramUrl: receiver.instagramUrl,
          linkedinUrl: receiver.linkedinUrl,
          githubUrl: receiver.githubUrl,
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

  // Scheduled call operations
  async getScheduledCalls(userId: number): Promise<ScheduledCallResponse[]> {
    const userScheduledCalls = await db
      .select()
      .from(scheduledCalls)
      .where(or(eq(scheduledCalls.initiatorId, userId), eq(scheduledCalls.receiverId, userId)))
      .orderBy(desc(scheduledCalls.scheduledTime));

    return Promise.all(userScheduledCalls.map(async (scheduledCall) => {
      const [initiator] = await db.select().from(users).where(eq(users.id, scheduledCall.initiatorId));
      const [receiver] = await db.select().from(users).where(eq(users.id, scheduledCall.receiverId));

      return {
        ...scheduledCall,
        scheduledTime: scheduledCall.scheduledTime.toISOString(),
        createdAt: scheduledCall.createdAt.toISOString(),
        initiator: initiator ? {
          id: initiator.id,
          username: initiator.username,
          displayName: initiator.displayName,
          email: initiator.email,
          bio: initiator.bio,
          profilePicture: initiator.profilePicture,
          nativeLanguage: initiator.nativeLanguage,
          twitterUrl: initiator.twitterUrl,
          facebookUrl: initiator.facebookUrl,
          instagramUrl: initiator.instagramUrl,
          linkedinUrl: initiator.linkedinUrl,
          githubUrl: initiator.githubUrl,
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
          twitterUrl: receiver.twitterUrl,
          facebookUrl: receiver.facebookUrl,
          instagramUrl: receiver.instagramUrl,
          linkedinUrl: receiver.linkedinUrl,
          githubUrl: receiver.githubUrl,
          createdAt: receiver.createdAt.toISOString()
        } : undefined
      };
    }));
  }

  async getScheduledCallById(id: number): Promise<ScheduledCall | undefined> {
    const [scheduledCall] = await db.select().from(scheduledCalls).where(eq(scheduledCalls.id, id));
    return scheduledCall;
  }

  async getScheduledCallsByDate(userId: number, date: Date): Promise<ScheduledCallResponse[]> {
    // Create start and end date for the provided date (entire day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const userScheduledCalls = await db
      .select()
      .from(scheduledCalls)
      .where(
        and(
          or(eq(scheduledCalls.initiatorId, userId), eq(scheduledCalls.receiverId, userId)),
          gte(scheduledCalls.scheduledTime, startDate),
          lte(scheduledCalls.scheduledTime, endDate)
        )
      )
      .orderBy(scheduledCalls.scheduledTime);

    return Promise.all(userScheduledCalls.map(async (scheduledCall) => {
      const [initiator] = await db.select().from(users).where(eq(users.id, scheduledCall.initiatorId));
      const [receiver] = await db.select().from(users).where(eq(users.id, scheduledCall.receiverId));

      return {
        ...scheduledCall,
        scheduledTime: scheduledCall.scheduledTime.toISOString(),
        createdAt: scheduledCall.createdAt.toISOString(),
        initiator: initiator ? {
          id: initiator.id,
          username: initiator.username,
          displayName: initiator.displayName,
          email: initiator.email,
          bio: initiator.bio,
          profilePicture: initiator.profilePicture,
          nativeLanguage: initiator.nativeLanguage,
          twitterUrl: initiator.twitterUrl,
          facebookUrl: initiator.facebookUrl,
          instagramUrl: initiator.instagramUrl,
          linkedinUrl: initiator.linkedinUrl,
          githubUrl: initiator.githubUrl,
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
          twitterUrl: receiver.twitterUrl,
          facebookUrl: receiver.facebookUrl,
          instagramUrl: receiver.instagramUrl,
          linkedinUrl: receiver.linkedinUrl,
          githubUrl: receiver.githubUrl,
          createdAt: receiver.createdAt.toISOString()
        } : undefined
      };
    }));
  }

  async createScheduledCall(insertScheduledCall: InsertScheduledCall): Promise<ScheduledCall> {
    const [scheduledCall] = await db
      .insert(scheduledCalls)
      .values(insertScheduledCall)
      .returning();
    return scheduledCall;
  }

  async updateScheduledCall(id: number, data: UpdateScheduledCall): Promise<ScheduledCall | undefined> {
    const [updatedScheduledCall] = await db
      .update(scheduledCalls)
      .set(data)
      .where(eq(scheduledCalls.id, id))
      .returning();
    return updatedScheduledCall;
  }

  async deleteScheduledCall(id: number): Promise<boolean> {
    const result = await db.delete(scheduledCalls).where(eq(scheduledCalls.id, id));
    return !!result;
  }
}

export const storage = new DatabaseStorage();
