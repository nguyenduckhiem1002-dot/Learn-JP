import { ALL_CARDS } from './data';

export type CardType = 'Tính từ な' | 'Tính từ い' | 'Danh từ' | 'Phó từ' | 'Liên từ' | 'Động từ';

export type CardRating = 'again' | 'hard' | 'good' | 'easy' | null;
export type SRSState = 'new' | 'learn' | 'review';

export interface Card {
    id?: number;
    k: string;
    h: string;
    v: string;
    t: string;
    ej: string;
    ev: string;
    tip: string;
    img?: string;
}

export interface SRSData {
    rating: CardRating;
    state: SRSState;
    ease: number;
    interval: number;
    reps: number;
    dueDate?: number;
}

export interface StudySettings {
    dailyNew: number;
    dailyReview: number;
    easeMultiplier: number;
}
