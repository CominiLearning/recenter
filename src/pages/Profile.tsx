import { useEffect, useState } from "react";
import AchievementsCard from "../components/AchievementsCard";
import Navbar from "../components/Navbar";
import { Achievements } from "../types/Achievements";
import "./Profile.scss";
import { weeklyProductivity } from "../utils/Achievements";
import ConfigureOptions from "../components/ConfigureOptions";
import UsageBox from "../components/UsageBox";

interface ProfileProps {
  isFocused: boolean;
}

export default function Profile({ isFocused }: ProfileProps) {
  const options = ["API usage", "Achievements"];
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [achievements, setAchievements] = useState<Achievements[]>([
    {
      name: "",
      time: 0,
      trophy: "",
      color: "",
      isCompleted: false,
    },
  ]);

  useEffect(() => {
    async function loadData() {
      setAchievements([
        {
          name: "GATEPASS",
          time: 5,
          trophy: (await import("../images/t1.png")).default,
          color: "blue",
          isCompleted: await weeklyProductivity(5),
        },
        {
          name: "MAESTRO",
          time: 10,
          trophy: (await import("../images/t2.png")).default,
          color: "green",
          isCompleted: await weeklyProductivity(10),
        },
        {
          name: "SENSEI",
          time: 20,
          trophy: (await import("../images/t3.png")).default,
          color: "yellow",
          isCompleted: await weeklyProductivity(20),
        },
        {
          name: "RENSHI",
          time: 40,
          trophy: (await import("../images/t4.png")).default,
          color: "purple",
          isCompleted: await weeklyProductivity(40),
        },
      ]);
    }
    loadData();
  }, []);

  return (
    <div className="profile_page">
      <Navbar text="Profile" isFocused={isFocused}></Navbar>
      <div className="profile_page__header">
        <ConfigureOptions
          isFocused={isFocused}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          options={options}
        ></ConfigureOptions>
      </div>
      <div className="profile_page__content">
        {selectedOption === 1 ? (
          achievements.map((achievement, index) => {
            if (!achievement.isCompleted) {
              return null;
            }
            return (
              <AchievementsCard
                achievementsType={achievements[index]}
              ></AchievementsCard>
            );
          })
        ) : (
          <UsageBox></UsageBox>
        )}
      </div>
    </div>
  );
}
