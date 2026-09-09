export type CardType =
    | 'Danh từ'
    | 'Động từ'
    | 'Tính từ'
    | 'Phó từ'
    | 'Giới từ'
    | 'Liên từ';

export const CARD_TYPES: readonly CardType[] = [
    'Danh từ',
    'Động từ',
    'Tính từ',
    'Phó từ',
    'Giới từ',
    'Liên từ',
] as const;

export type CardRating = 'again' | 'hard' | 'good' | 'easy' | null;
export type SRSState = 'new' | 'learn' | 'review';

export interface Card {
    id?: number;
    /** German word (e.g. "der Tisch", "schön"). */
    k: string;
    /** Pronunciation guide or phonetic hint. */
    h: string;
    /** Vietnamese meaning. */
    v: string;
    /** Part-of-speech label, see {@link CardType}. */
    t: string;
    /** Optional German example sentence. */
    ej: string;
    /** Optional Vietnamese translation of `ej`. */
    ev: string;
    /** Optional mnemonic / etymology tip. */
    tip: string;
    /** Optional image URL. */
    img?: string;
}

export interface SRSData {
    rating: CardRating;
    state: SRSState;
    ease: number;
    /** Interval until the next review (minutes). */
    interval: number;
    /** Total number of reviews. */
    reps: number;
    /** Number of times the card has lapsed (was due, then rated `again`). */
    lapses?: number;
    /** Epoch ms when the card next becomes due. */
    dueDate?: number;
}

export interface StudySettings {
    dailyNew: number;
    dailyReview: number;
    easeMultiplier: number;
}
