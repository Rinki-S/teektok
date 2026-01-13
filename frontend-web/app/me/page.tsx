export const metadata = {
  title: "我的 - Teektok",
};

export default function MePage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 items-start justify-center overflow-hidden bg-sidebar p-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">我的</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          这里是“我的”页面路由（/me）。你可以在这里放个人资料、作品列表、收藏、设置等内容。
        </p>

        <div className="mt-6 rounded-xl border border-neutral-800 bg-background/40 p-4">
          <div className="text-sm text-muted-foreground">占位内容</div>
          <ul className="mt-3 list-disc pl-5 text-sm">
            <li>个人信息卡片</li>
            <li>我发布的视频</li>
            <li>收藏/喜欢</li>
            <li>账号设置</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
