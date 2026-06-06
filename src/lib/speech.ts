/**
 * 百度 AI 语音识别集成
 *
 * 使用百度短语音识别 REST API — 支持 mp3/wav/m4a/pcm
 * 每天 5 万次免费调用，HTTP 协议，Vercel Serverless 友好
 *
 * 接入文档：https://ai.baidu.com/tech/speech/asr
 */

const BAIDU_ASR_URL = "https://vop.baidu.com/server_api";
const BAIDU_TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";

// access_token 缓存（有效期 30 天，缓存 24 小时避免频繁请求）
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * 获取百度 AI access_token
 * 使用 API Key + Secret Key 换取
 */
export async function getBaiduAccessToken(): Promise<string> {
  // 缓存有效则直接返回
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const apiKey = process.env.BAIDU_AI_API_KEY;
  const secretKey = process.env.BAIDU_AI_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error(
      "百度语音识别未配置。请在环境变量中设置 BAIDU_AI_API_KEY 和 BAIDU_AI_SECRET_KEY。\n" +
        "获取方式：https://console.bce.baidu.com/ai → 语音技术 → 短语音识别 → 创建应用"
    );
  }

  const url = `${BAIDU_TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`获取百度 access_token 失败: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`百度鉴权失败: ${JSON.stringify(data)}`);
  }

  // 缓存 24 小时（实际有效期 30 天）
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  return cachedToken.token;
}

/**
 * 音频格式映射：文件扩展名 → 百度 API 格式参数
 */
function detectFormat(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    mp3: "mp3",
    wav: "wav",
    m4a: "m4a",
    mp4: "m4a",
    pcm: "pcm",
    amr: "amr",
    webm: "webm",
    ogg: "ogg",
  };
  return map[ext] || "mp3"; // 默认尝试 mp3
}

/**
 * 使用百度短语音识别将音频转写为文本
 *
 * 支持格式：mp3, wav, m4a, pcm, amr
 * 音频限制：60 秒以内，大小 < 10MB
 * 采样率：16000Hz 最佳
 *
 * @param audioBuffer 音频文件的原始 Buffer
 * @param filename 原始文件名（用于判断格式）
 * @returns 转写文本
 */
export async function transcribeWithBaidu(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const token = await getBaiduAccessToken();
  const format = detectFormat(filename);
  const speech = audioBuffer.toString("base64");

  const body = {
    format,
    rate: 16000,
    channel: 1,
    cuid: `insightflow_${Date.now()}`,
    token,
    speech,
    len: audioBuffer.length,
  };

  const res = await fetch(BAIDU_ASR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.err_no !== 0) {
    const errorMessages: Record<number, string> = {
      3300: "语音识别失败，请检查音频格式或重新录制",
      3301: "音频质量太差，请确保环境安静后重新录制",
      3302: "音频鉴权失败，请检查 API Key 配置",
      3303: "音频服务器问题，请稍后重试",
      3304: "用户请求超限（超过每日 5 万次免费额度）",
      3305: "服务器繁忙，请稍后重试",
    };
    const msg = errorMessages[data.err_no] || data.err_msg || `错误码: ${data.err_no}`;
    throw new Error(`百度语音识别失败: ${msg}`);
  }

  if (!data.result || data.result.length === 0) {
    return "";
  }

  // result 是一个字符串数组，拼接为完整文本
  return data.result.join("");
}
