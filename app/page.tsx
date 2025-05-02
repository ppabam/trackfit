"use client";

import { useState, useMemo, useEffect } from "react";
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
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (glitch) {
      document.body.classList.add("glitch-mode");
    } else {
      document.body.classList.remove("glitch-mode");
    }
  }, [glitch]);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(today);
  const allDatesForTarget = useMemo(() => {
    const startDate = parseISO(TARGET_CONFIG.dietStartDate);
    const endDate = parseISO(TARGET_CONFIG.dietEndDate);
    const dateArray: string[] = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dateArray.push(format(currentDate, "yyyy-MM-dd"));
      currentDate = addDays(currentDate, 1);
    }
    return dateArray;
  }, []);

  const getTargetWeightForDate = (selectedDate: string): number => {
    const targetData = generateDietTargetData(allDatesForTarget);
    const targetEntry = targetData.find((entry) => entry.date === selectedDate);
    return targetEntry?.dietTarget ?? TARGET_CONFIG.dietStartWeight;
  };

  const [weight, setWeight] = useState<number>(getTargetWeightForDate(date));
  const [data, setData] = useState<UserEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [dbHistory, setDbHistory] = useState<UserEntry[]>([]);

  const weightDifference = useMemo(() => {
    const targetWeight = getTargetWeightForDate(date);
    const diff = parseFloat((weight - targetWeight).toFixed(1));
    if (diff > 0) {
      return `(+ ${diff} kg)`;
    } else if (diff < 0) {
      return `(- ${Math.abs(diff)} kg)`;
    } else {
      return "(0 kg)";
    }
  }, [weight, date, getTargetWeightForDate]);

  useEffect(() => {
    // 모바일 환경에서 주소창 숨기기
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
    }
  }, []);

  const [userModifiedWeight, setUserModifiedWeight] = useState(false);

  useEffect(() => {
    setUserModifiedWeight(false); // 날짜 변경 시 초기화
  }, [date]);

  // 날짜가 바뀌면 목표 체중으로 초기화 (단, 수동 조작 안 했을 때만)
  useEffect(() => {
    if (!userModifiedWeight) {
      setWeight(getTargetWeightForDate(date));
    }
  }, [date, userModifiedWeight, getTargetWeightForDate]);

  // 슬라이더 수동 조작 감지
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserModifiedWeight(true);
    setWeight(parseFloat(e.target.value));
  };

  // DB에서 기록 불러오기
  const loadWeightHistory = async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const response = await fetch("/api/weights");
      if (response.ok) {
        const result: UserEntry[] = await response.json();
        setDbHistory(result);
      } else {
        const message = await response.text();
        setError(`Failed to load history: ${message}`);
      }
    } catch (e: any) {
      setError(`Failed to load history: ${e.message}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadWeightHistory(); // 컴포넌트 마운트 시 데이터 불러오기
  }, []);

  // 기록 후 상태 초기화 및 DB 저장
  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      const response = await fetch("/api/weights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date, weight }),
      });

      if (response.ok) {
        setData((prev) => [...prev, { date, weight }]);
        setUserModifiedWeight(false); // 제출 후 초기화
        loadWeightHistory(); // 저장 후 데이터 다시 불러오기
      } else {
        const message = await response.text();
        setError(`Failed to save weight: ${message}`);
      }
    } catch (e: any) {
      setError(`Failed to save weight: ${e.message}`);
    }
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
    const userDates = dbHistory.map((d) => d.date); // db에서 불러온 데이터 사용
    return Array.from(new Set([...dateArray, ...userDates])).sort();
  }, [dbHistory]); // dbHistory가 변경될 때마다 재생성

  const dietTargetData = useMemo(
    () => generateDietTargetData(allDates),
    [allDates]
  );

  const mergedData = useMemo(() => {
    return allDates.map((date) => {
      const userEntry = dbHistory.find((d) => d.date === date); // db에서 불러온 데이터 사용
      const targetEntry = dietTargetData.find((d) => d.date === date);
      return {
        date,
        weight: userEntry?.weight ?? null,
        dietTarget: targetEntry?.dietTarget ?? null,
      };
    });
  }, [allDates, dbHistory, dietTargetData]); // dbHistory가 변경될 때마다 재생성

  return (
    <div className="flex flex-col font-sans h-screen">
      <main className="flex flex-col flex-grow p-6 sm:p-12 w-full mx-auto">
        <h1 className="text-xl font-semibold text-center ">📉 체중 관리</h1>

        {loadingHistory ? (
          <p className="text-center text-gray-500">Loading weight history...</p>
        ) : mergedData.length > 0 ? (
          <div className="flex-grow h-0 min-h-[300px]">
            {" "}
            {/* 변경된 부분 */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mergedData}
                margin={{ top: 20, right: 0, left: -25, bottom: 0 }}
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
        ) : (
          <p className="text-center text-gray-500">No weight data available.</p>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 mt-4 pb-4 h-auto"
        >
          {" "}
          {/* 변경된 부분 */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
              }}
              className="border border-gray-300 p-2 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
              몸무게:{" "}
              <strong className="text-blue-600">
                {weight.toFixed(1)} kg {weightDifference}
              </strong>
            </span>
            <input
              type="range"
              min="75"
              max="100"
              step="0.1"
              value={weight}
              onChange={handleWeightChange}
              className="w-full accent-blue-500"
            />
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit">기록하기</Button>
        </form>

        <style>{`
          body.glitch-mode {
            animation: glitch-bg 0.3s infinite alternate;
            filter: contrast(150%) hue-rotate(45deg);
          }

          @keyframes glitch-bg {
            0% {
              transform: translate(0, 0) skew(0deg, 0deg);
            }
            20% {
              transform: translate(-5px, 3px) skew(2deg, -2deg);
            }
            40% {
              transform: translate(5px, -3px) skew(-2deg, 2deg);
            }
            60% {
              transform: translate(-3px, 5px) skew(3deg, -3deg);
            }
            80% {
              transform: translate(3px, -5px) skew(-3deg, 3deg);
            }
            100% {
              transform: translate(0, 0) skew(0deg, 0deg);
            }
          }
        `}</style>
        <div className="text-center mt-1 text-xs text-gray-400 cursor-pointer select-none">
          <span
            onClick={() => {
              setGlitch((prev) => !prev);
            }}
          >
            🐣 Impossible Mission Force
          </span>
          {glitch && (
            <div className="mt-2 text-sm text-red-500 animate-ping">
              💥 5초후 폭팔합니다.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
