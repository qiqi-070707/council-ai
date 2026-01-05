export enum AgentRole {
  CPO = 'Chief Product Officer',
  DESIGN = 'Senior Industrial Designer',
  TECH = 'Technical Director',
  UX = 'UX Researcher',
  MARKET = 'Market Researcher'
}

export interface DesignConstraints {
  purpose: string;
  brandTone: string;
  targetAudience: string;
  pricePoint: string;
  mode: 'quick' | 'deep';
}

export interface DebateMessage {
  role: AgentRole;
  content: string;
}

export interface DesignEvaluation {
  technicalFeasibility: number;
  marketCompetitiveness: number;
  aesthetics: number;
  usability: number;
  innovation: number;
}

export interface DesignSolution {
  imageUrl: string;
  title: string;
  consensusSummary: string;
  evaluation: DesignEvaluation;
  highlights: string[];
}

export interface DesignResult {
  solutions: DesignSolution[];
  debateHistory: DebateMessage[];
}