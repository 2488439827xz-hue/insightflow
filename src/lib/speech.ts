/**
 * 百度 AI 长语音识别集成
 *
 * 使用百度长语音识别 REST API — 支持 mp3/wav/m4a/pcm
 * 最长 5 小时音频，每天 5 万次免费调用
 *
 * 异步流程：创建任务 → 轮询结果
 * Vercel Serverless 有 10 秒超时，所以拆成两个接口：
 *   1. createTranscribeTask — 上传音频，返回 taskId
 *   2. queryTranscribeTask — 轮询结果，返回文本或状态
 *
 * 接入文档：https://ai.baidu.com/ai-doc/SPEECH/Vk38lxr1q
 */

const BAIDU_TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
const BAIDU_ASR_CREATE_URL = "https://aip.baidubce.com/rpc/2.0/aasr/v1/create";
const BAIDU_ASR_QUERY_URL = "https://aip.baidubce.com/rpc/2.0/aasr/v1/query";

// access_token 缓存（有效期 30 天，本地缓存 24 小时）
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * 获取百度 AI access_token
 */
export async function getBaiduAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const apiKey = process.env.BAIDU_AI_API_KEY;
  const secretKey = process.env.BAIDU_AI_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error(
      "百度语音识别未配置。请在环境变量中设置 BAIDU_AI_API_KEY 和 BAIDU_AI_SECRET_KEY。\n" +
        "获取方式：https://console.bce.baidu.com/ai → 语音技术 → 长语音识别 → 创建应用"
    );
  }

  const url = `${BAIDU_TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`获取百度 access_token 失败: HTTP ${res.status}`);

  const data = await res.json();
  if (!data.access_token) throw new Error(`百度鉴权失败: ${JSON.stringify(data)}`);

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  return cachedToken.token;
}

/**
 * 音频格式映射
 */
function detectFormat(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    mp3: "mp3", wav: "wav", m4a: "m4a",
    mp4: "m4a", pcm: "pcm", amr: "amr",
    webm: "webm", ogg: "ogg",
  };
  return map[ext] || "mp3";
}

/**
 * 创建百度长语音识别任务
 *
 * @param audioBuffer 音频文件的原始 Buffer
 * @param filename 原始文件名（用于判断格式）
 * @returns { taskId, estimatedSeconds } — taskId 用于后续轮询
 */
export async function createTranscribeTask(
  audioBuffer: Buffer,
  filename: string
): Promise<{ taskId: string; estimatedSeconds: number }> {
  const token = await getBaiduAccessToken();
  const format = detectFormat(filename);
  const speech = audioBuffer.toString("base64");
  const audioLength = audioBuffer.length;

  // 估算识别时长（经验值：1MB mp3 ≈ 1分钟语音）
  const estimatedSeconds = Math.ceil(audioLength / 17000); // 16kbps ≈ 17KB/s

  const body = {
    format,
    rate: 16000,
    channel: 1,
    cuid: `insightflow_${Date.now()}`,
    token,
    speech,
    len: audioLength,
  };

  // 创建识别任务
  const res = await fetch(BAIDU_ASR_CREATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.err_no !== 0) {
    const errors: Record<number, string> = {
      3300: "输入参数不正确",
      3301: "音频质量过差",
      3302: "鉴权失败",
      3303: "音频服务器问题",
      3304: "日请求超限（超过每日 5 万次免费额度）",
      3305: "服务器繁忙",
      3307: "音频格式不支持",
      3308: "音频过长（超过 5 小时）",
    };
    const msg = errors[data.err_no] || data.err_msg || `错误码: ${data.err_no}`;
    throw new Error(`百度长语音识别失败: ${msg}`);
  }

  const taskId = data.task_id;
  if (!taskId) throw new Error("百度未返回任务 ID");

  return { taskId, estimatedSeconds };
}

/**
 * 查询百度长语音识别任务结果
 *
 * @param taskId 任务 ID（从 createTranscribeTask 获取）
 * @returns { status: "processing" | "completed" | "failed", text?: string }
 */
export async function queryTranscribeTask(
  taskId: string
): Promise<{ status: "processing" | "completed" | "failed"; text: string; error?: string }> {
  const token = await getBaiduAccessToken();

  const res = await fetch(BAIDU_ASR_QUERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, task_ids: [taskId] }),
  });

  const data = await res.json();

  if (data.err_no !== 0) {
    return { status: "failed", text: "", error: data.err_msg || `错误码: ${data.err_no}` };
  }

  const result = data.results_info?.[0];
  if (!result) return { status: "failed", text: "", error: "未找到任务结果" };

  if (result.status === "Running") {
    return { status: "processing", text: "" };
  }

  if (result.status === "Success") {
    return {
      status: "completed",
      text: result.result?.join("") || "",
    };
  }

  return {
    status: "failed",
    text: "",
    error: `转写失败 (status: ${result.status})`,
  };
}
