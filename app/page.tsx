"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { addDays, format, parseISO, differenceInDays } from "date-fns";
import Image from "next/image";
import Link from "next/link";

type UserEntry = {
  date: string;
  weight: number;
};

type MergedEntry = {
  date: string;
  weight: number | null;
  dietTarget: number | null;
};

const Button = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    {...props}
  >
    {children}
  </button>
);

// 목표선 설정
const TARGET_CONFIG = {
  dietStartDate: "2025-04-21",
  dietEndDate: "2025-07-29",
  dietStartWeight: 98,
  dietEndWeight: 80,
};

const generateDietTargetData = (allDates: string[]): MergedEntry[] => {
  const { dietStartDate, dietEndDate, dietStartWeight, dietEndWeight } =
    TARGET_CONFIG;
  const start = parseISO(dietStartDate);
  const end = parseISO(dietEndDate);
  const totalDays = differenceInDays(end, start);

  return allDates.map((dateStr) => {
    const currentDate = parseISO(dateStr);
    if (currentDate < start || currentDate > end) {
      return { date: dateStr, weight: null, dietTarget: null };
    }

    const daysPassed = differenceInDays(currentDate, start);
    const weight =
      dietStartWeight -
      ((dietStartWeight - dietEndWeight) * daysPassed) / totalDays;
    return {
      date: dateStr,
      weight: null,
      dietTarget: parseFloat(weight.toFixed(1)),
    };
  });
};

export default function Home() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [weight, setWeight] = useState<number>(90);
  const [data, setData] = useState<UserEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("날짜를 입력해주세요.");
      return;
    }
    if (weight < 75 || weight > 100) {
      setError("체중은 75~100kg 사이여야 합니다.");
      return;
    }
    setError(null);
    setData((prev) => [...prev, { date, weight }]);
  };

  const allDates = useMemo(() => {
    const startDate = parseISO(TARGET_CONFIG.dietStartDate);
    const endDate = parseISO(TARGET_CONFIG.dietEndDate);
    const dateArray: string[] = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dateArray.push(format(currentDate, "yyyy-MM-dd"));
      currentDate = addDays(currentDate, 1);
    }
    const userDates = data.map((d) => d.date);
    return Array.from(new Set([...dateArray, ...userDates])).sort();
  }, [data]);

  const dietTargetData = useMemo(
    () => generateDietTargetData(allDates),
    [allDates]
  );

  const mergedData = useMemo(() => {
    return allDates.map((date) => {
      const userEntry = data.find((d) => d.date === date);
      const targetEntry = dietTargetData.find((d) => d.date === date);
      return {
        date,
        weight: userEntry?.weight ?? null,
        dietTarget: targetEntry?.dietTarget ?? null,
      };
    });
  }, [allDates, data, dietTargetData]);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className="flex flex-col gap-8 p-6 sm:p-12 flex-grow max-w-xl w-full mx-auto">
        <h1 className="text-xl font-semibold text-center">📉 체중 관리</h1>

        {mergedData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mergedData}
                margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(parseISO(date), "M-dd")}
                  tick={{ fontSize: 9 }}
                  angle={-45}
                />
                <YAxis
                  unit="kg"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="dietTarget"
                  stroke="#e45858"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  dot={false}
                  name="목표선"
                  connectNulls={false} // 이 부분을 false로 유지
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot
                  name="달성"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 p-2 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
              몸무게:{" "}
              <strong className="text-blue-600">{weight.toFixed(1)} kg</strong>
            </span>
            <input
              type="range"
              min="75"
              max="100"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit">기록하기</Button>
        </form>
      </main>

      <footer className="w-full p-6 bg-gray-50 border-t flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700">
        <Link href="/space" className="flex items-center gap-2 hover:underline">
          <Image src="/space.svg" alt="Space" width={24} height={24} />
          Space
        </Link>
        <Link href="/chart" className="flex items-center gap-2 hover:underline">
          <Image src="/chart3.svg" alt="Chart" width={24} height={24} />
          Chart →
        </Link>
      </footer>
    </div>
  );
}
