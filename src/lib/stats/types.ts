import type { CardRating, SRSState } from '../types';

export interface ReviewLogEntry {
    cardId: number;
    rating: NonNullable<CardRating>;
    prevState: SRSState;
    prevInterval: number;
    newInterval: number;
    ease: number;
    ts: number; // epoch ms
}

export interface HeatmapPoint {
    /** ISO date `YYYY-MM-DD` in local time. */
    date: string;
    reviews: number;
    accuracy: number; // 0..1
}

export interface ForecastPoint {
    date: string;
    dueCount: number;
}

export interface AccuracyPoint {
    date: string;
    accuracy: number;
}

export interface TypeMastery {
    type: string;
    total: number;
    mastered: number; // state === 'review' AND lapses === 0
    reviewing: number; // state === 'review'
    learning: number;
    fresh: number; // state === 'new'
}

export interface StateBreakdown {
    new: number;
    learn: number;
    review: number;
    dueReview: number; // subset of review where dueDate <= now
}

export interface RatingDistribution {
    again: number;
    hard: number;
    good: number;
    easy: number;
}

export interface AnalyticsSnapshot {
    totalCards: number;
    totalReviews: number;
    streakDays: number;
    accuracyAllTime: number;
    states: StateBreakdown;
    byType: TypeMastery[];
    heatmap90d: HeatmapPoint[];
    forecast14d: ForecastPoint[];
    accuracy14d: AccuracyPoint[];
    ratingDistribution30d: RatingDistribution;
}
