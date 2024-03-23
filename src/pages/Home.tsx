import { useEffect, useState } from "react";
import FilterOptions from "../components/FilterOptions";
import FocusRateBox from "../components/FocusRateBox";
import MenuOptions from "../components/MenuOptions";
import QuickActionsBox from "../components/QuickActionsBox";
import SummaryBox from "../components/SummaryBox";
import UsageBreakdown from "../components/UsageBreakdown";
import UsageChart from "../components/UsageChart";
import "./Home.scss";
import { SummaryItem } from "../types/SummaryItem";
import { calculateProductivity } from "../utils/CalculateProductivity";
import { TaggedTimeURL } from "../types/TaggedTimeUrl";
import { getTaggedTime } from "../utils/GetTaggedTime";
import HourlySummaryBox from "../components/HourlySummaryBox";
import DailySummaryBox from "../components/DailySummaryBox";

interface HomeProps {
  isFocused: boolean;
  setIsFocused: (isFocused: boolean) => void;
}

export default function Home({ isFocused, setIsFocused }: HomeProps) {
  const [filter, setFilter] = useState("dailyTime");
  const focusMessage = [
    { line1: "Stay focused today!", line2: "Keep trying harder!" },
    { line1: "You're on track!", line2: "Stay in the zone!" },
    { line1: "Keep pushing forward!", line2: "Almost there, keep it up!" },
    { line1: "You're doing great!", line2: "Keep the momentum!" },
    { line1: "Impressive focus!", line2: "Keep going strong!" },
    { line1: "Amazing concentration!", line2: "You're unstoppable!" },
    { line1: "Incredible dedication!", line2: "The sky's the limit!" },
    { line1: "You're a focus master!", line2: "Unstoppable today!" },
    { line1: "Maximum focus achieved!", line2: "Keep it up, champ!" },
    { line1: "You're a focus legend!", line2: "On top of the world!" },
  ];

  const [summary, setSummary] = useState<SummaryItem[]>([
    {
      label: "Total time spent",
      value: "-",
    },
    {
      label: "Productive time spent",
      value: "-",
    },
    {
      label: "Distracted time spent",
      value: "-",
    },
  ]);

  const [websites, setWebsites] = useState<TaggedTimeURL[]>([]);
  const totalTime = websites.reduce((acc, website) => acc + website.time, 0);
  const focusRate =
    totalTime &&
    (websites.reduce(
      (acc, website) => acc + (website.tag === 1 ? website.time : 0),
      0
    ) /
      totalTime) *
      100;
  useEffect(() => {
    const isFocused = focusRate >= 50;
    setIsFocused(isFocused);
  }, [totalTime, websites, setIsFocused, focusRate]);

  useEffect(() => {
    const fetchSummary = async () => {
      const data = await calculateProductivity(filter);
      if (data) setSummary(data);
    };
    const fetchWebsites = async () => {
      const data = await getTaggedTime(filter);
      if (data) {
        data.sort((a, b) => b.time - a.time);
        setWebsites(data);
      }
    };
    fetchSummary();
    fetchWebsites();
  }, [filter]);

  return (
    <div className="home_page">
      <div className="home_page__menu">
        <MenuOptions isFocused={isFocused}></MenuOptions>
      </div>
      <div className="home_page__header">
        <h3>Welcome Back</h3>
        <h1>{focusMessage[Math.floor(Math.min(focusRate, 99) / 10)].line1}</h1>
        <h1>{focusMessage[Math.floor(Math.min(focusRate, 99) / 10)].line2}</h1>
      </div>
      <div className="home_page__boxes">
        <FocusRateBox
          focusRate={focusRate}
          totalTime={summary[0].value}
          time={summary[1].value}
          isFocused={isFocused}
        ></FocusRateBox>
        <QuickActionsBox></QuickActionsBox>
      </div>
      <div className="home_page__usage">
        <FilterOptions setFilter={setFilter}></FilterOptions>
        <div className="home_page__usage__chart">
          <UsageChart type={filter} focusRate={focusRate}></UsageChart>
        </div>
        <SummaryBox filter={filter}></SummaryBox>
        <UsageBreakdown
          websites={websites}
          totalTime={totalTime}
        ></UsageBreakdown>
        <HourlySummaryBox
          focusRate={focusRate}
          totalTime={totalTime}
        ></HourlySummaryBox>
        <DailySummaryBox
          focusRate={focusRate}
          totalTime={totalTime}
        ></DailySummaryBox>
      </div>
    </div>
  );
}
