"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Mic, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { AnalysisResult } from "@/types";

type Step = "input" | "transcribing" | "analyzing" | "done" | "error";

export default function AnalyzePage() {
  const router = useRouter();

  // 表单状态
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  // 流程状态
  const [step, setStep] = useState<Step>("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState("");

  // 结果
  const [result, setResult] = useState<{
    reportId: string;
    analysis: AnalysisResult;
    transcript: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件拖拽
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type.startsWith("audio/") || droppedFile.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
        setFile(droppedFile);
        if (!title) setTitle(droppedFile.name.replace(/\.[^.]+$/, ""));
      } else {
        setErrorMsg("请上传音频文件（mp3, wav, m4a, webm, ogg）");
      }
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
  };

  // 主流程：提交分析
  const handleSubmit = async () => {
    setErrorMsg("");
    setProgress("");

    // 校验标题
    if (!title.trim()) {
      setErrorMsg("请输入报告标题");
      return;
    }

    try {
      let transcriptText = text;

      // Step 1: 如果有音频文件，先转写（百度长语音：提交 → 轮询）
      if (activeTab === "upload" && file) {
        setStep("transcribing");
        setProgress("正在上传音频，创建转写任务...");

        const formData = new FormData();
        formData.append("file", file);

        // 1) 创建转写任务
        const createRes = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.error || "创建转写任务失败");
        }

        const { taskId, estimatedSeconds } = await createRes.json();
        setProgress(`转写中（预估 ${Math.ceil(estimatedSeconds / 60)} 分钟）...`);

        // 2) 轮询直到完成
        const pollStart = Date.now();
        const maxWaitMs = 10 * 60 * 1000; // 最多等 10 分钟
        let pollCount = 0;

        while (Date.now() - pollStart < maxWaitMs) {
          await new Promise((r) => setTimeout(r, 2000)); // 每 2 秒查一次
          pollCount++;

          const pollRes = await fetch(`/api/transcribe?taskId=${encodeURIComponent(taskId)}`);
          if (!pollRes.ok) {
            const err = await pollRes.json();
            throw new Error(err.error || "查询转写结果失败");
          }

          const pollData = await pollRes.json();

          if (pollData.status === "completed") {
            transcriptText = pollData.text;
            setProgress(
              `转写完成（${pollData.text.length} 字，耗时 ${((Date.now() - pollStart) / 1000).toFixed(0)}s）`
            );
            break;
          }

          if (pollData.status === "failed") {
            throw new Error(pollData.error || "转写失败");
          }

          // 还在处理中，更新进度
          if (pollCount % 5 === 0) {
            setProgress(
              `转写中...（已等待 ${((Date.now() - pollStart) / 1000).toFixed(0)}s / 预估 ${estimatedSeconds}s）`
            );
          }
        }

        if (!transcriptText) {
          throw new Error("转写超时（超过 10 分钟），请重试或使用「粘贴文本」方式");
        }
      }

      // 校验文本
      if (!transcriptText || transcriptText.trim().length < 50) {
        throw new Error(
          activeTab === "upload"
            ? "转写文本太短，请确认音频内容清晰且包含足够对话"
            : "文本太短（至少 50 字），请提供更完整的访谈内容"
        );
      }

      // Step 2: AI 分析
      setStep("analyzing");
      setProgress("正在 AI 深度分析...");

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcriptText, title }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "分析失败");
      }

      const analyzeData = await analyzeRes.json();

      // Step 3: 保存到 localStorage（无需 Supabase 也能用）
      setResult({
        reportId: analyzeData.reportId,
        analysis: analyzeData.analysis,
        transcript: transcriptText,
      });

      // 存到 localStorage
      try {
        const stored = localStorage.getItem("insightflow_reports");
        const reports = stored ? JSON.parse(stored) : [];
        reports.unshift({
          id: analyzeData.reportId,
          title,
          source_type: activeTab === "upload" ? "audio" : "text",
          transcript: transcriptText,
          analysis_json: analyzeData.analysis,
          status: "completed",
          created_at: new Date().toISOString(),
        });
        // 只保留最近 20 条
        localStorage.setItem("insightflow_reports", JSON.stringify(reports.slice(0, 20)));
      } catch {
        // localStorage 可能不可用
      }

      setStep("done");
      setProgress("分析完成！");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "发生未知错误";
      setErrorMsg(message);
      setStep("error");
    }
  };

  // 查看报告
  const handleViewReport = () => {
    if (result) {
      // 通过 URL 参数传递数据（简单方案）
      sessionStorage.setItem(`report_${result.reportId}`, JSON.stringify(result));
      router.push(`/report/${result.reportId}`);
    }
  };

  const handleReset = () => {
    setStep("input");
    setErrorMsg("");
    setProgress("");
    setResult(null);
    setText("");
    setFile(null);
    setActiveTab("upload");
  };

  // Loading 界面
  if (step === "transcribing" || step === "analyzing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-muted animate-spin border-t-foreground" />
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {step === "transcribing" ? "正在转写音频" : "正在 AI 分析"}
            </h2>
            <p className="text-sm text-muted-foreground">{progress}</p>
          </div>
          {step === "analyzing" && (
            <div className="w-full max-w-xs space-y-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-foreground animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground">
                DeepSeek 正在按 8 个维度提取洞察，预计还需 30-60 秒...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 错误界面
  if (step === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Card>
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold mb-2">分析失败</h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                重新开始
              </Button>
              <Button onClick={handleSubmit}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 完成界面
  if (step === "done" && result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Card>
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold mb-2">分析完成！</h2>
              <p className="text-sm text-muted-foreground">
                报告「{title}」已生成，包含 8 个维度的结构化洞察
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                分析新的访谈
              </Button>
              <Button onClick={handleViewReport}>查看报告 →</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 主输入界面
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">开始分析</h1>
        <p className="text-muted-foreground text-sm">
          上传用户访谈录音或粘贴文本，AI 将自动生成结构化分析报告
        </p>
      </div>

      {/* 标题输入 */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">
          报告标题 <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="例如：外卖用户支付环节访谈 #3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* 内容输入 Tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Mic className="h-4 w-4" />
            上传录音
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2">
            <FileText className="h-4 w-4" />
            粘贴文本
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          {!file ? (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors hover:border-muted-foreground/50 hover:bg-muted/30"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">拖拽音频文件到此处，或点击选择</p>
                <p className="text-sm text-muted-foreground mt-1">
                  支持 mp3, wav, m4a, webm, ogg · 最大 500MB · 最长 5 小时
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Mic className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
              >
                移除
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <Textarea
            placeholder={`请粘贴用户访谈的文字记录...

支持格式：
- 主持人：你平时怎么处理这个问题？
- 用户：我一般会先打开XX，然后...

- 或者直接粘贴整段访谈文本

建议至少 200 字以获得更好的分析效果`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {text.length} 字 {text.length > 0 && text.length < 50 && "（建议至少 50 字）"}
          </p>
        </TabsContent>
      </Tabs>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* 提交按钮 */}
      <Button
        className="w-full h-12 text-base"
        disabled={
          !title.trim() ||
          (activeTab === "upload" && !file) ||
          (activeTab === "text" && text.trim().length < 50)
        }
        onClick={handleSubmit}
      >
        开始分析
      </Button>

      <p className="text-xs text-center text-muted-foreground mt-3">
        分析过程约需 1-3 分钟，具体取决于文本长度
      </p>
    </div>
  );
}
