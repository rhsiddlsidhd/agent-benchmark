import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface PostsTrendPoint {
  period: string;
  count: number;
}

interface PostsTrendChartProps {
  data: PostsTrendPoint[];
}

/** PostsTrendPoint[] 그대로 소비하는 바 차트 — period(월 단위)=x축, count(게시글 수)=y축. */
export function PostsTrendChart({ data }: PostsTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" fill="var(--accent)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
