/** Danh mục chủ đề từ vựng (bảng topics riêng, chuẩn hóa — không còn text tự do trên vocab). */
export interface Topic {
  topicId: string;
  name: string;
}

export interface Vocab {
  wordId: string;
  englishWord: string;
  ipa: string;
  wordType: string;
  vietnameseMeaning: string;
  /** FK tới topics.topicId; null nghĩa là chưa phân loại chủ đề. */
  topicId: string | null;
  /** Tên chủ đề hiển thị (lấy từ JOIN topics), rỗng nếu topicId null. */
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
