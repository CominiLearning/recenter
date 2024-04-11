import { useEffect, useState } from "react";
import "./Home.scss";
import { SummaryItem } from "../types/SummaryItem";
import { calculateProductivity } from "../utils/queryStorage/CalculateProductivity";
import { TaggedTimeURL } from "../types/TaggedTimeUrl";
import { getTaggedTime } from "../utils/queryStorage/GetTaggedTime";
import FilterOptions from "../components/FilterOptions";
import FocusRateBox from "../components/FocusRateBox";
import MenuOptions from "../components/MenuOptions";
import QuickActionsBox from "../components/QuickActionsBox";
import SummaryBox from "../components/SummaryBox";
import UsageBreakdown from "../components/UsageBreakdown";
import UsageChart from "../components/UsageChart";
import HourlySummaryBox from "../components/HourlySummaryBox";
import DailySummaryBox from "../components/DailySummaryBox";
import SuperFocusMode from "../components/SuperFocusMode";
import ExtensionDisabledCover from "../components/ExtensionDisabledCover";
import { focusMessage } from "../utils/CONSTANTS/texts";

interface HomeProps {
  isFocused: boolean;
  setIsFocused: (isFocused: boolean) => void;
}

export default function Home({ isFocused, setIsFocused }: HomeProps) {
  const [filter, setFilter] = useState("dailyTime");
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

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
    chrome.storage.local.get("isDisabled", (data) => {
      if (typeof data.isDisabled === "boolean") {
        setIsDisabled(data.isDisabled);
      }
    });
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
    chrome.storage.local.set({ lastTimeSummary: new Date().getTime() }); // don't show summary for another hour if user interacted with the extension
    fetchSummary();
    fetchWebsites();
  }, [filter]);

  return (
    <div className="home_page">
      {isDisabled && <ExtensionDisabledCover setIsDisabled={setIsDisabled}></ExtensionDisabledCover>}
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
        <div className="home_page__usage__line"></div>
        <UsageBreakdown
          websites={websites}
          totalTime={totalTime}
        ></UsageBreakdown>
        <div className="home_page__usage__line"></div>
        <SuperFocusMode></SuperFocusMode>
        <div className="home_page__usage__line"></div>
        <HourlySummaryBox></HourlySummaryBox>
        <div className="home_page__usage__line"></div>
        <DailySummaryBox></DailySummaryBox>
      </div>
    </div>
  );
}
