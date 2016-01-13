

interface FeedbackEntry {
    code: number;
    description: string;
    name: string;
}

export interface Feedback {
    all: FeedbackEntry[];
    current: FeedbackEntry;
}
