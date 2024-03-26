import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { msToHM } from "../scripts/mmToHM";
import { getTaggedTime } from "../queryStorage/GetTaggedTime";
import Greetings from "./Greetings";
import DailySummary from "./DailySummary";
import useToggle from "../../hooks/useToggle";
// import "../../images/recenter_logo.png";

function DailyPopup() {
  const logo = chrome.runtime.getURL("js/images/recenter_logo.png");
  const gif = chrome.runtime.getURL("js/images/gifs/2.gif");

  const [summary, setSummary] = useState<string>("");
  const [showSummary, setShowSummary] = useToggle(false);
  const [focusRate, setFocusRate] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);

  useEffect(() => {
    async function generateSummary() {
      let prevDaySummary: any[] = (
        await chrome.storage.local.get("prevDaySummary")
      ).prevDaySummary;

      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (!prevDaySummary || yesterday.toDateString() !== prevDaySummary[1]) {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { summarize: "prevDay" },
            function (response) {
              if (response.success) resolve(1);
              else reject(0);
            }
          );
        });
      }

      prevDaySummary = (await chrome.storage.local.get("prevDaySummary"))
        .prevDaySummary;

      setSummary(prevDaySummary[0]);
    }
    async function getProductivity() {
      const yesterdayTime = await getTaggedTime("yesterdayTime");
      if (!yesterdayTime) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await chrome.storage.local.set({
          prevDaySummary: [
            "No previous day data found.",
            yesterday.toDateString(),
          ],
        });
        setSummary("No previous day data found.");
        return;
      }
      generateSummary();
      const totalTime = yesterdayTime.reduce(
        (acc, website) => acc + website.time,
        0
      );
      const focusRate =
        totalTime &&
        (yesterdayTime.reduce(
          (acc, website) => acc + (website.tag === 1 ? website.time : 0),
          0
        ) /
          totalTime) *
          100;
      setFocusRate(focusRate);
      setTotalTime(totalTime / 100);
    }
    getProductivity();
  }, []);
  const timeSummary = [
    {
      label: "Productive",
      value: msToHM(totalTime * focusRate),
      color: "blue",
    },
    {
      label: "Distracted",
      value: msToHM(totalTime * (100 - focusRate)),
      color: "red",
    },
    { label: "Total", value: msToHM(totalTime), color: "black" },
  ];

  const handleClose = () => {
    const root = document.getElementById("recenter_container");
    if (root) {
      root.remove();
    }
  };
  const handleSummary = () => {
    setShowSummary();
  };

  if (summary === "") {
    return <></>;
  }

  return (
    <>
      {!showSummary && (
        <Greetings
          focusRate={focusRate}
          gif={gif}
          logo={logo}
          handleClose={handleClose}
          setShowSummary={handleSummary}
        />
      )}
      {showSummary && (
        <DailySummary
          focusRate={focusRate}
          summary={summary}
          timeSummary={timeSummary}
          handleClose={handleClose}
        />
      )}
    </>
  );
}

export function insertGreetings() {
  if (document.getElementById("recenter_container") !== null) {
    return;
  }
  const root = document.createElement("div");
  root.id = "recenter_container";
  document.body.appendChild(root);
  const rootDiv = ReactDOM.createRoot(root);
  rootDiv.render(
    <React.StrictMode>
      <DailyPopup />
    </React.StrictMode>
  );
}
