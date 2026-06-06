import Link from "next/link";

const features = [
  {
    icon: "🎯",
    title: "用户目标识别",
    desc: "自动提取 JTBD，理解用户真正想要完成的任务",
  },
  {
    icon: "💔",
    title: "痛点优先级排序",
    desc: "按频率 × 情绪强度自动排序，不再凭印象做决策",
  },
  {
    icon: "📍",
    title: "使用场景还原",
    desc: "触发条件、使用环境、发生频率一目了然",
  },
  {
    icon: "📊",
    title: "需求优先级矩阵",
    desc: "四象限矩阵（紧急/重要），辅助排期决策",
  },
  {
    icon: "📝",
    title: "用户故事生成",
    desc: '自动生成 "As a... I want... So that..." 格式',
  },
  {
    icon: "🔍",
    title: "待验证假设",
    desc: "AI 标注需要进一步验证的说法及建议验证方式",
  },
];

const steps = [
  {
    num: "01",
    title: "上传访谈内容",
    desc: "上传录音文件（AI 自动转写）或直接粘贴访谈文本",
  },
  {
    num: "02",
    title: "AI 深度分析",
    desc: "GPT-4o 按 PM 分析框架提取 8 个维度的结构化洞察",
  },
  {
    num: "03",
    title: "获取分析报告",
    desc: "可视化报告，可直接用于产品决策和团队分享",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center gap-6">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              AI 驱动 · 面向中国 PM
            </span>

            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              从用户访谈录音到
              <span className="text-primary"> PM 洞察报告</span>
              ，只需 3 分钟
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
              上传访谈录音或粘贴文本，AI 自动转写、分析、生成结构化的用户洞察报告。
              告别"凭印象回忆"的分析方式，让每一次用户访谈都有据可依。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                href="/analyze"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-foreground px-8 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                开始分析
                <span className="text-base">→</span>
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-8 text-sm font-medium transition-colors hover:bg-muted"
              >
                了解更多
              </Link>
            </div>

            {/* 数据标签 */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">10x</span>
                效率提升
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">8</span>
                大分析维度
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">3 分钟</span>
                出报告
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">90%+</span>
                转写准确率
              </div>
            </div>
          </div>
        </div>

        {/* 底部渐变 */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section id="features" className="border-t py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              8 大分析维度，覆盖 PM 全场景
            </h2>
            <p className="mt-3 text-muted-foreground">
              不只是总结——AI 按照产品经理的思维框架组织输出
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold sm:text-3xl">三步完成分析</h2>
            <p className="mt-3 text-muted-foreground">
              简单到你的产品团队每个人都能用
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center text-center gap-3">
                <span className="text-4xl font-bold text-muted-foreground/30">
                  {s.num}
                </span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl mb-4">
            准备好让你的用户访谈更有价值了吗？
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            免费开始使用。上传你的第一段访谈录音，3 分钟后拿到第一份 AI 分析报告。
          </p>
          <Link
            href="/analyze"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-foreground px-10 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            免费开始分析 →
          </Link>
        </div>
      </section>
    </div>
  );
}
