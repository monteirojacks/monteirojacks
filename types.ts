
export interface JournalEntry {
  id: string; // e.g., "m1_d1"
  dayNumber: number; // 1 to 365
  dayOfMonth: number; // 1 to 31
  question: string;
  placeholder?: string;
  isMonthlyReview?: boolean; // If true, this is the end-of-month review page
}

export interface MonthConfig {
  id: number;
  name: string;
  theme: string;
  objective: string;
  anchorQuestion: string;
  exerciseTitle: string;
  exerciseSteps: string[];
  days: JournalEntry[];
}

export interface UserAnswer {
  text: string;
  timestamp: number;
  completed: boolean;
  dateString?: string; // User manually entered date
}

export interface PhotoEntry {
  id: string;
  imageData: string; // Base64 compressed string
  caption: string;
  emotion: 'happy' | 'calm' | 'sad' | 'energetic' | 'neutral';
  tags: string[];
  timestamp: number;
  dateString: string; // Formatted date
}

export interface UserData {
  [entryId: string]: UserAnswer;
}

// Stores the AI summary for a specific month
export interface MonthlySummaries {
  [monthId: number]: string;
}

export type ViewState = 
  | 'LOGIN' 
  | 'COVER' 
  | 'PREP_FLOW'      // New: 2025 Preparation Guide
  | 'LOCKED_2026'    // New: Locked screen for 2026 content
  | 'MONTH_INTRO' 
  | 'JOURNAL' 
  | 'SETTINGS' 
  | 'GALLERY';

export interface AppState {
  currentMonthId: number;
  currentEntryIndex: number; // Index within the month's days array
  view: ViewState;
  userName?: string | null;
  prepStep?: number; // Tracks step in PREP_FLOW (1-7)
}
