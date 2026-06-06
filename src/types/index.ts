// InsightFlow 核心类型定义

/** 分析来源类型 */
export type SourceType = 'text' | 'audio';

/** 报告状态 */
export type ReportStatus = 'processing' | 'completed' | 'error';

/** 情绪类型 */
export type EmotionType = 'positive' | 'negative' | 'neutral' | 'mixed';

/** 需求优先级维度 */
export interface PriorityDimension {
  urgency: number;       // 紧急度 1-5
  importance: number;    // 重要度 1-5
  userValue: number;     // 用户价值 1-5
  businessValue: number; // 商业价值 1-5
}

/** 用户目标 (JTBD) */
export interface UserGoal {
  goal: string;
  context: string;
  desiredOutcome: string;
  frequency: string;     // 高频/中频/低频
}

/** 痛点 */
export interface PainPoint {
  painPoint: string;
  frequency: number;     // 提及次数
  emotionalIntensity: number; // 情绪强度 1-5
  severity: 'critical' | 'major' | 'minor';
  userQuote: string;     // 用户原话
}

/** 使用场景 */
export interface Scenario {
  scenario: string;
  trigger: string;       // 触发条件
  environment: string;   // 使用环境
  frequency: string;     // 发生频率
}

/** 现有解决方案 */
export interface CurrentSolution {
  solution: string;
  dissatisfaction: string;
  whyNotGoodEnough: string;
}

/** 情绪拐点 */
export interface EmotionalTurn {
  timestamp: string;     // 对话中的大致时间点
  emotion: EmotionType;
  topic: string;         // 什么话题触发了情绪变化
  description: string;
  userQuote: string;
}

/** 用户故事 */
export interface UserStory {
  role: string;          // 用户角色
  want: string;          // 想要什么
  soThat: string;        // 以便实现什么价值
  priority: 'P0' | 'P1' | 'P2';
}

/** 待验证假设 */
export interface Hypothesis {
  hypothesis: string;
  evidence: string;      // 支持该假设的证据
  confidence: 'high' | 'medium' | 'low';
  validationMethod: string; // 建议验证方式
}

/** AI 分析结果（完整结构） */
export interface AnalysisResult {
  summary: string;              // 一句话总结
  userGoals: UserGoal[];
  painPoints: PainPoint[];
  scenarios: Scenario[];
  currentSolutions: CurrentSolution[];
  emotionalTurns: EmotionalTurn[];
  priorityMatrix: {
    urgentImportant: string[];     // 紧急且重要
    urgentNotImportant: string[];  // 紧急不重要
    notUrgentImportant: string[];  // 不紧急但重要
    notUrgentNotImportant: string[]; // 不紧急不重要
  };
  userStories: UserStory[];
  hypotheses: Hypothesis[];
  keyTakeaways: string[];        // 关键结论
  nextSteps: string[];           // 建议后续行动
}

/** 报告数据库记录 */
export interface Report {
  id: string;
  user_id?: string;
  title: string;
  source_type: SourceType;
  transcript: string | null;
  audio_url: string | null;
  analysis_json: AnalysisResult | null;
  status: ReportStatus;
  created_at: string;
}

/** API 请求类型 */
export interface AnalyzeRequest {
  text: string;
  title: string;
}

export interface TranscribeResponse {
  text: string;
  duration: number; // 音频时长（秒）
}

export interface AnalyzeResponse {
  reportId: string;
  analysis: AnalysisResult;
}
