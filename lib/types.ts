export interface Vocab {
  wordId: string;
  englishWord: string;
  ipa: string;
  wordType: string;
  vietnameseMeaning: string;
  topic: string;
  imageUrl: string;
}

export interface UserStats {
  userName: string;
  totalLearned: number;
  dueForReview: number;
  accuracy: number;
  totalAvailable: number;
  progressPercentage: number;
  box1Count: number;
  box2Count: number;
  box3Count: number;
}

export interface ImportResult {
  imported: number;
  updated: number;
  unchanged: number;
  errors: number;
}

export interface SubmitResult {
  success: boolean;
  message: string;
  newBoxLevel: number;
}

export interface UnsplashImage {
  thumb: string;
  regular: string;
}
