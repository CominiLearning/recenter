import { useEffect, useState } from "react";
import "./ProactiveOptionsBox.scss";

const settingsKey = [
  "enableHourlyUpdates",
  "enableBlockDistractingSites",
  "enableDistractingSiteTimer",
];
export default function ProactiveOptionsBox() {
  const [isOn, setIsOn] = useState<boolean[]>([false, false, false]);
  const settings = [
    "Hourly Updates",
    "Block distracting sites",
    "Distracting site timer",
  ];

  const toggleSwitch = async (index: number) => {
    await chrome.storage.local.set({ [settingsKey[index]]: !isOn[index] });
    setIsOn((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  useEffect(() => {
    chrome.storage.local.get(settingsKey, (res) => {
      setIsOn([
        res.enableHourlyUpdates,
        res.enableBlockDistractingSites,
        res.enableDistractingSiteTimer,
      ]);
    });
  }, []);

  return (
    <div className="proactive_setting">
      <div className="proactive_setting__header">Proactive Settings</div>
      <div className="proactive_setting__outline">
        <div className="proactive_setting__content">
          {settings.map((setting, index) => {
            return (
              <div className="proactive_setting__content__row" key={index}>
                <div className="proactive_setting__content__row__enable">
                  {setting}
                </div>
                <div className="proactive_setting__content__row__enable_button">
                  <div
                    className={`proactive_setting__content__row__enable_button__container ${
                      isOn[index] ? "on" : "off"
                    }`}
                    onClick={() => toggleSwitch(index)}
                  >
                    <div className="proactive_setting__content__row__enable_button__container__switch">
                      <div
                        className={`proactive_setting__content__row__enable_button__container__switch__circle ${
                          isOn[index] ? "on" : "off"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}