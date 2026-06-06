"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Target,
  HeartCrack,
  MapPin,
  Lightbulb,
  LineChart,
  StickyNote,
  HelpCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import type { AnalysisResult, Report as ReportType, UserGoal, PainPoint, Scenario, CurrentSolution, EmotionalTurn, UserStory, Hypothesis } from "@/types";

// ============================================================
// 子组件：各分析维度
// ============================================================

/** 用户目标卡片 */
function UserGoalCard({ goal }: { goal: UserGoal }) {
  return (
    <div className="rounded-lg border p-4 space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{goal.goal}</h4>
        <Badge variant="secondary" className="text-xs">
          {goal.frequency}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">背景：</span>{goal.context}
      </p>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">期望结果：</span>{goal.desiredOutcome}
      </p>
    </div>
  );
}

/** 痛点卡片 */
function PainPointCard({ pain, index }: { pain: PainPoint; index: number }) {
  const severityColors: Record<string, string> = {
    critical: "border-red-200 bg-red-50/50 dark:bg-red-950/20",
    major: "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20",
    minor: "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20",
  };
  const severityLabels: Record<string, string> = {
    critical: "核心痛点",
    major: "主要痛点",
    minor: "次要痛点",
  };

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${severityColors[pain.severity] || ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            {index + 1}
          </span>
          <h4 className="font-medium">{pain.painPoint}</h4>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {severityLabels[pain.severity]}
        </Badge>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>提及 {pain.frequency} 次</span>
        <span>情绪强度 {"⭐".repeat(pain.emotionalIntensity)}</span>
        <span>得分 {(pain.frequency * pain.emotionalIntensity).toFixed(0)}</span>
      </div>
      {pain.userQuote && (
        <blockquote className="border-l-2 border-muted pl-3 text-sm italic text-muted-foreground">
          &ldquo;{pain.userQuote}&rdquo;
        </blockquote>
      )}
    </div>
  );
}

/** 优先级矩阵 */
function PriorityMatrix({ matrix }: { matrix: AnalysisResult["priorityMatrix"] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 紧急且重要 */}
      <div className="rounded-lg border-2 border-red-200 bg-red-50/30 dark:bg-red-950/10 p-4">
        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
          🔴 紧急且重要 — 立即做
        </h4>
        <ul className="space-y-1">
          {matrix.urgentImportant?.map((item, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {item}
            </li>
          ))}
          {(!matrix.urgentImportant || matrix.urgentImportant.length === 0) && (
            <li className="text-sm text-muted-foreground">暂无</li>
          )}
        </ul>
      </div>

      {/* 紧急不重要 */}
      <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50/30 dark:bg-yellow-950/10 p-4">
        <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
          🟡 紧急但不重要 — 快速处理
        </h4>
        <ul className="space-y-1">
          {matrix.urgentNotImportant?.map((item, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
              {item}
            </li>
          ))}
          {(!matrix.urgentNotImportant || matrix.urgentNotImportant.length === 0) && (
            <li className="text-sm text-muted-foreground">暂无</li>
          )}
        </ul>
      </div>

      {/* 不紧急但重要 */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50/30 dark:bg-blue-950/10 p-4">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
          🔵 不紧急但重要 — 战略规划
        </h4>
        <ul className="space-y-1">
          {matrix.notUrgentImportant?.map((item, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              {item}
            </li>
          ))}
          {(!matrix.notUrgentImportant || matrix.notUrgentImportant.length === 0) && (
            <li className="text-sm text-muted-foreground">暂无</li>
          )}
        </ul>
      </div>

      {/* 不紧急不重要 */}
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50/30 dark:bg-gray-800/20 p-4">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
          ⚪ 不紧急不重要 — 暂缓
        </h4>
        <ul className="space-y-1">
          {matrix.notUrgentNotImportant?.map((item, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              {item}
            </li>
          ))}
          {(!matrix.notUrgentNotImportant || matrix.notUrgentNotImportant.length === 0) && (
            <li className="text-sm text-muted-foreground">暂无</li>
          )}
        </ul>
      </div>
    </div>
  );
}

/** 用户故事卡片 */
function UserStoryCard({ story }: { story: UserStory }) {
  const priorityColors: Record<string, string> = {
    P0: "border-l-red-500",
    P1: "border-l-yellow-500",
    P2: "border-l-blue-500",
  };

  return (
    <div className={`border-l-4 ${priorityColors[story.priority] || "border-l-gray-300"} rounded-lg border p-4 space-y-1.5 bg-card`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          作为 <span className="text-primary font-semibold">{story.role}</span>
        </p>
        <Badge variant="outline" className="text-xs">{story.priority}</Badge>
      </div>
      <p className="text-sm">
        我想要 <span className="font-medium">{story.want}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        以便 <span className="italic">{story.soThat}</span>
      </p>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<{
    reportId: string;
    analysis: AnalysisResult;
    transcript: string;
  } | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    // 从 sessionStorage 加载报告数据
    const cached = sessionStorage.getItem(`report_${id}`);
    if (cached) {
      try {
        setReport(JSON.parse(cached));
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, [id]);

  // 加载中
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // 报告不存在
  if (!report) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Card>
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold mb-2">报告不存在</h2>
              <p className="text-sm text-muted-foreground">
                该报告可能已被清除，或链接无效
              </p>
            </div>
            <Button onClick={() => router.push("/analyze")}>
              创建新分析 →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { analysis } = report;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/analyze"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-1.5" />
          打印/导出
        </Button>
      </div>

      {/* 报告标题 */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          分析完成
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          用户访谈分析报告
        </h1>
        {analysis.summary && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        )}
      </div>

      <Separator className="mb-8" />

      {/* 1. 用户目标 (JTBD) */}
      {analysis.userGoals && analysis.userGoals.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">用户目标 (JTBD)</h2>
          </div>
          <div className="space-y-3">
            {analysis.userGoals.map((goal, i) => (
              <UserGoalCard key={i} goal={goal} />
            ))}
          </div>
        </section>
      )}

      {/* 2. 核心痛点 */}
      {analysis.painPoints && analysis.painPoints.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <HeartCrack className="h-5 w-5 text-destructive" />
            <h2 className="text-xl font-semibold">核心痛点</h2>
          </div>
          <div className="space-y-3">
            {analysis.painPoints.map((pain, i) => (
              <PainPointCard key={i} pain={pain} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* 3. 使用场景 */}
      {analysis.scenarios && analysis.scenarios.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">使用场景</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.scenarios.map((s, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-1.5">
                <h4 className="font-medium">{s.scenario}</h4>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">触发：</span>{s.trigger}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">环境：</span>{s.environment}
                </p>
                <Badge variant="secondary" className="text-xs">{s.frequency}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. 现有解决方案 */}
      {analysis.currentSolutions && analysis.currentSolutions.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">现有解决方案与不足</h2>
          </div>
          <div className="space-y-3">
            {analysis.currentSolutions.map((cs, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-1.5">
                <h4 className="font-medium">{cs.solution}</h4>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-destructive">不满意：</span>{cs.dissatisfaction}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">为什么不够好：</span>{cs.whyNotGoodEnough}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. 情绪拐点 */}
      {analysis.emotionalTurns && analysis.emotionalTurns.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">情绪拐点</h2>
          </div>
          <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {analysis.emotionalTurns.map((turn, i) => {
              const emotionColors: Record<string, string> = {
                positive: "bg-green-500",
                negative: "bg-red-500",
                mixed: "bg-yellow-500",
                neutral: "bg-gray-400",
              };
              const emotionLabels: Record<string, string> = {
                positive: "😊 正面",
                negative: "😤 负面",
                mixed: "🤔 混合",
                neutral: "😐 中性",
              };

              return (
                <div key={i} className="relative pl-10">
                  <span
                    className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${emotionColors[turn.emotion] || "bg-gray-400"}`}
                  />
                  <div className="rounded-lg border p-4 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {emotionLabels[turn.emotion]}
                      </Badge>
                      <span className="text-sm font-medium">{turn.topic}</span>
                      <span className="text-xs text-muted-foreground">{turn.timestamp}</span>
                    </div>
                    <p className="text-sm">{turn.description}</p>
                    {turn.userQuote && (
                      <blockquote className="border-l-2 border-muted pl-3 text-sm italic text-muted-foreground">
                        &ldquo;{turn.userQuote}&rdquo;
                      </blockquote>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. 需求优先级矩阵 */}
      {analysis.priorityMatrix && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <h2 className="text-xl font-semibold">需求优先级矩阵</h2>
          </div>
          <PriorityMatrix matrix={analysis.priorityMatrix} />
        </section>
      )}

      {/* 7. 用户故事卡片 */}
      {analysis.userStories && analysis.userStories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">用户故事</h2>
          </div>
          <div className="space-y-3">
            {analysis.userStories.map((story, i) => (
              <UserStoryCard key={i} story={story} />
            ))}
          </div>
        </section>
      )}

      {/* 8. 待验证假设 */}
      {analysis.hypotheses && analysis.hypotheses.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">待验证假设</h2>
          </div>
          <div className="space-y-3">
            {analysis.hypotheses.map((h, i) => {
              const confidenceColors: Record<string, string> = {
                high: "border-green-300",
                medium: "border-yellow-300",
                low: "border-red-300",
              };
              const confidenceLabels: Record<string, string> = {
                high: "高置信度",
                medium: "中置信度",
                low: "低置信度",
              };

              return (
                <div
                  key={i}
                  className={`rounded-lg border-l-4 ${confidenceColors[h.confidence] || "border-gray-300"} border p-4 space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{h.hypothesis}</h4>
                    <Badge variant="outline" className="text-xs">
                      {confidenceLabels[h.confidence]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">证据：</span>{h.evidence}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">验证方式：</span>{h.validationMethod}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 关键结论 */}
      {analysis.keyTakeaways && analysis.keyTakeaways.length > 0 && (
        <section className="mb-10 rounded-lg bg-muted/50 p-6">
          <h2 className="text-lg font-semibold mb-3">💡 关键结论</h2>
          <ul className="space-y-2">
            {analysis.keyTakeaways.map((take, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 font-bold text-primary">{i + 1}.</span>
                {take}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 建议后续行动 */}
      {analysis.nextSteps && analysis.nextSteps.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">📋 建议后续行动</h2>
          <div className="space-y-2">
            {analysis.nextSteps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                  {i + 1}
                </span>
                <p className="text-sm pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 原始访谈文本（折叠） */}
      <Separator className="mb-6" />
      <div className="mb-8">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTranscript ? "收起" : "查看"}原始访谈文本 →
        </button>
        {showTranscript && (
          <div className="mt-3 rounded-lg bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-96 overflow-y-auto">
            {report.transcript}
          </div>
        )}
      </div>

      {/* 底部 CTA */}
      <div className="text-center py-8">
        <Link href="/analyze">
          <Button size="lg">分析新的访谈 →</Button>
        </Link>
      </div>
    </div>
  );
}
