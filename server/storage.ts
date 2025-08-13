import { exercises, responses, settings, sessions, materials, type Exercise, type InsertExercise, type Response, type InsertResponse, type Settings, type InsertSettings, type Session, type InsertSession, type Material, type InsertMaterial } from "@shared/schema";
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

export interface IStorage {
  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExercisesBySection(sectionId: number): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  createExercises(exercises: InsertExercise[]): Promise<Exercise[]>;
  
  // Responses
  getResponse(exerciseId: number): Promise<Response | undefined>;
  createOrUpdateResponse(response: InsertResponse): Promise<Response>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // Sessions
  getCurrentSession(): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session>;

  // Materials
  getMaterials(): Promise<Material[]>;
  markMaterialSeen(id: number): Promise<Material | undefined>;
}

export class MemStorage implements IStorage {
  protected exercises: Map<number, Exercise> = new Map();
  protected responses: Map<number, Response> = new Map();
  protected settings: Settings | undefined;
  protected sessions: Map<number, Session> = new Map();
  protected materials: Map<number, Material> = new Map();
  protected currentId = { exercises: 1, responses: 1, settings: 1, sessions: 1, materials: 1 };
  async clearExercises(): Promise<void> {
    this.exercises.clear();
    this.currentId.exercises = 1;
  }
  constructor() {
    // Initialize default settings
    this.settings = {
      id: 1,
      pomodoroMinutes: 25,
      maxTimeMinutes: 10,
      groqApiKey: null,
      currentSection: 1,
      currentExercise: 0,
    };

    // Default materials
    const defaultMaterial: InsertMaterial = {
      subject: 'Matemáticas',
      title: 'Guía de estudio',
      pdf: '/materials/sample.pdf',
      type: 'teoria',
      seen: false,
    };
    const material: Material = { ...defaultMaterial, id: this.currentId.materials++ };
    this.materials.set(material.id, material);
  }

  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).sort((a, b) => a.order - b.order);
  }

  async getExercisesBySection(sectionId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(ex => ex.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.currentId.exercises++;
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async createExercises(insertExercises: InsertExercise[]): Promise<Exercise[]> {
    const results: Exercise[] = [];
    for (const insertExercise of insertExercises) {
      results.push(await this.createExercise(insertExercise));
    }
    return results;
  }

  async getResponse(exerciseId: number): Promise<Response | undefined> {
    return Array.from(this.responses.values()).find(r => r.exerciseId === exerciseId);
  }

  async createOrUpdateResponse(insertResponse: InsertResponse): Promise<Response> {
    const existing = await this.getResponse(insertResponse.exerciseId);
    
    if (existing) {
      const updated: Response = {
        ...existing,
        content: insertResponse.content,
        difficulty: insertResponse.difficulty ?? existing.difficulty,
        updatedAt: new Date(),
      };
      this.responses.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentId.responses++;
      const response: Response = {
        ...insertResponse,
        id,
        difficulty: insertResponse.difficulty ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.responses.set(id, response);
      return response;
    }
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(updateSettings: Partial<InsertSettings>): Promise<Settings> {
    if (this.settings) {
      this.settings = { ...this.settings, ...updateSettings };
    } else {
      const id = this.currentId.settings++;
      this.settings = {
        id,
        pomodoroMinutes: 25,
        maxTimeMinutes: 10,
        groqApiKey: null,
        currentSection: 1,
        currentExercise: 0,
        ...updateSettings,
      };
    }
    return this.settings;
  }

  async getCurrentSession(): Promise<Session | undefined> {
    const sessions = Array.from(this.sessions.values()).filter(s => !s.endTime);
    return sessions[sessions.length - 1];
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentId.sessions++;
    const session: Session = {
      ...insertSession,
      id,
      startTime: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, updateSession: Partial<InsertSession>): Promise<Session> {
    const existing = this.sessions.get(id);
    if (!existing) {
      throw new Error(`Session with id ${id} not found`);
    }
    const updated: Session = { ...existing, ...updateSession };
    this.sessions.set(id, updated);
    return updated;
  }

  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async markMaterialSeen(id: number): Promise<Material | undefined> {
    const material = this.materials.get(id);
    if (material) {
      material.seen = true;
      this.materials.set(id, material);
    }
    return material;
  }
}

class FileStorage extends MemStorage {
  private dataDir: string;
  private paths: { responses: string; settings: string; exercises: string; sessions: string; materials: string };

  constructor(dir = path.resolve('/gestor/system/ejes')) {
    super();
    this.dataDir = dir;
    fs.mkdirSync(this.dataDir, { recursive: true });
    this.paths = {
      responses: path.join(this.dataDir, 'responses.json'),
      settings: path.join(this.dataDir, 'settings.json'),
      exercises: path.join(this.dataDir, 'exercises.json'),
      sessions: path.join(this.dataDir, 'sessions.json'),
      materials: path.join(this.dataDir, 'materials.json'),
    };
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.paths.exercises)) {
        const arr: Exercise[] = JSON.parse(fs.readFileSync(this.paths.exercises, 'utf-8'));
        arr.forEach(ex => this.exercises.set(ex.id, ex));
        this.currentId.exercises = arr.reduce((m, ex) => Math.max(m, ex.id), 0) + 1;
      }
      if (fs.existsSync(this.paths.responses)) {
        const arr: any[] = JSON.parse(fs.readFileSync(this.paths.responses, 'utf-8'));
        arr.forEach(r => {
          r.createdAt = r.createdAt ? new Date(r.createdAt) : new Date();
          r.updatedAt = r.updatedAt ? new Date(r.updatedAt) : new Date();
          this.responses.set(r.id, r);
        });
        this.currentId.responses = arr.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      }
      if (fs.existsSync(this.paths.settings)) {
        this.settings = JSON.parse(fs.readFileSync(this.paths.settings, 'utf-8')) as Settings;
      }
      if (fs.existsSync(this.paths.sessions)) {
        const arr: any[] = JSON.parse(fs.readFileSync(this.paths.sessions, 'utf-8'));
        arr.forEach(s => {
          s.startTime = s.startTime ? new Date(s.startTime) : new Date();
          s.endTime = s.endTime ? new Date(s.endTime) : undefined;
          this.sessions.set(s.id, s);
        });
        this.currentId.sessions = arr.reduce((m, s) => Math.max(m, s.id), 0) + 1;
      }
      if (fs.existsSync(this.paths.materials)) {
        const arr: Material[] = JSON.parse(fs.readFileSync(this.paths.materials, 'utf-8'));
        arr.forEach(m => this.materials.set(m.id, m));
        this.currentId.materials = arr.reduce((m, m2) => Math.max(m, m2.id), 0) + 1;
      }
      if (this.materials.size === 0) {
        const defaultMaterial: InsertMaterial = {
          subject: 'Matemáticas',
          title: 'Guía de estudio',
          pdf: '/materials/sample.pdf',
          type: 'teoria',
          seen: false,
        };
        const material: Material = { ...defaultMaterial, id: this.currentId.materials++ };
        this.materials.set(material.id, material);
        this.saveMaterials();
      }
    } catch (err) {
      console.error('Failed to load storage from disk', err);
    }
  }

  private async saveExercises() {
    await fsp.writeFile(this.paths.exercises, JSON.stringify(Array.from(this.exercises.values()), null, 2));
  }

  private async saveResponses() {
    await fsp.writeFile(this.paths.responses, JSON.stringify(Array.from(this.responses.values()), null, 2));
  }

  private async saveSettings() {
    if (this.settings) {
      await fsp.writeFile(this.paths.settings, JSON.stringify(this.settings, null, 2));
    }
  }

  private async saveSessions() {
    await fsp.writeFile(this.paths.sessions, JSON.stringify(Array.from(this.sessions.values()), null, 2));
  }

  private async saveMaterials() {
    await fsp.writeFile(this.paths.materials, JSON.stringify(Array.from(this.materials.values()), null, 2));
  }

  async clearExercises(): Promise<void> {
    await super.clearExercises();
    await this.saveExercises();
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const ex = await super.createExercise(insertExercise);
    await this.saveExercises();
    return ex;
  }

  async createExercises(insertExercises: InsertExercise[]): Promise<Exercise[]> {
    const res = await super.createExercises(insertExercises);
    await this.saveExercises();
    return res;
  }

  async createOrUpdateResponse(insertResponse: InsertResponse): Promise<Response> {
    const res = await super.createOrUpdateResponse(insertResponse);
    await this.saveResponses();
    return res;
  }

  async updateSettings(updateSettings: Partial<InsertSettings>): Promise<Settings> {
    const s = await super.updateSettings(updateSettings);
    await this.saveSettings();
    return s;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const s = await super.createSession(insertSession);
    await this.saveSessions();
    return s;
  }

  async updateSession(id: number, updateSession: Partial<InsertSession>): Promise<Session> {
    const s = await super.updateSession(id, updateSession);
    await this.saveSessions();
    return s;
  }

  async markMaterialSeen(id: number): Promise<Material | undefined> {
    const m = await super.markMaterialSeen(id);
    await this.saveMaterials();
    return m;
  }
}

const dataDir = process.env.VERCEL ? '/tmp/ejes' : '/gestor/system/ejes';

export const storage: IStorage = (() => {
  try {
    return new FileStorage(dataDir);
  } catch (err) {
    console.warn('Falling back to in-memory storage:', err);
    return new MemStorage();
  }
})();
