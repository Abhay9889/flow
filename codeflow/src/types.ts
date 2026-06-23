export interface ComplexityInfo {
  time: string;
  space: string;
  explanation: string;
}

export interface FunctionMetadata {
  name: string;
  calls: string[];
  lineRange: string;
  purpose: string;
}

export interface FlowStep {
  step: number;
  title: string;
  description: string;
  relatedCodeSnippet: string;
  role: 'input' | 'init' | 'loop' | 'condition' | 'process' | 'output' | 'error' | string;
}

export interface DependencyMetadata {
  name: string;
  type: 'internal' | 'external' | string;
  purpose: string;
}

export interface ProgramMetrics {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme' | string;
  cognitiveLoad: number; // 0-100 scale
  potentialBottlenecks: string[];
  suggestions: string[];
}

export interface CodeFlowAnalysis {
  summary: string;
  complexity: ComplexityInfo;
  functions: FunctionMetadata[];
  flowSteps: FlowStep[];
  dependencies: DependencyMetadata[];
  metrics: ProgramMetrics;
  errors?: CodeError[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// Auth types
export interface User {
  id?: number;
  email: string;
  preferredLanguage: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  preferredLanguage: string;
  message?: string;
}

export interface CodeError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

// ===== NEW TYPES FOR ENHANCED ANALYSIS =====

export interface ASTNode {
  type: string;
  name: string;
  children: ASTNode[];
  lineRange: string;
  description: string;
}

export interface ASTAnalysis {
  rootNode: ASTNode;
  totalNodes: number;
  maxDepth: number;
  nodeTypes: { type: string; count: number }[];
  summary: string;
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  line: number;
  description: string;
  recommendation: string;
  cweId?: string;
}

export interface SecurityAnalysis {
  overallScore: number; // 0-100
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Secure';
  vulnerabilities: SecurityVulnerability[];
  summary: string;
  bestPractices: string[];
}

export interface AIDetectionResult {
  overallScore: number; // 0-100 (100 = definitely AI, 0 = definitely human)
  verdict: 'Likely AI' | 'Possibly AI' | 'Mixed' | 'Possibly Human' | 'Likely Human';
  indicators: { indicator: string; confidence: string; explanation: string }[];
  summary: string;
  patterns: string[];
}

export interface CodeSuggestion {
  id: number;
  title: string;
  category: 'performance' | 'readability' | 'security' | 'architecture' | 'style' | 'best-practice';
  priority: 'high' | 'medium' | 'low';
  description: string;
  currentCode: string;
  suggestedCode: string;
  impact: string;
}

export interface SuggestionsAnalysis {
  suggestions: CodeSuggestion[];
  overallQuality: number; // 0-100
  summary: string;
  quickWins: string[];
}

export interface ExecutionStep {
  step: number;
  line: number;
  action: string;
  variables: { name: string; value: string }[];
  output: string;
  explanation: string;
}

export interface ExecutionTrace {
  steps: ExecutionStep[];
  finalOutput: string;
  totalSteps: number;
  summary: string;
}

export interface TutorExplanation {
  conceptName: string;
  difficulty: string;
  explanation: string;
  keyTakeaways: string[];
  codePatterns: { pattern: string; description: string }[];
  practiceQuestions: { question: string; hint: string }[];
  relatedTopics: string[];
}
