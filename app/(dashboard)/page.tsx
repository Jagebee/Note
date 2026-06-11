import Link from 'next/link';

export default function DashboardPage() {
  return (
    <section className="glass-card p-8">
      <h1 className="text-3xl font-bold text-white">欢迎使用考研笔记站</h1>
      <p className="mt-2 text-sm text-mutedText">支持科目管理、标签筛选、错题本与 TipTap 富文本编辑。</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="btn-primary" href="/notes">
          进入笔记管理
        </Link>
        <Link className="btn-secondary" href="/subjects">
          管理科目
        </Link>
      </div>
    </section>
  );
}
