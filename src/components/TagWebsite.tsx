import { useState } from "react";
import { DropdownOptions } from "../types/DropdownOptions";
import Button from "./Button";
import Dropdown from "./Dropdown";
import Input from "./Input";
import "./TagWebsite.scss";
import { tagWebsite } from "../utils/TagWebsite";
const dropdownOptions: DropdownOptions[] = [
  {
    id: "1",
    value: "Productive",
  },
  {
    id: "2",
    value: "Unsure",
  },
  {
    id: "3",
    value: "Wasteful",
  },
];

export default function TagWebsite() {
  const [activeOption, setActiveOption] = useState<DropdownOptions>({
    id: "0",
    value: "Select",
  });

  const [website, setWebsite] = useState<string>("");
  const [maxTime, setMaxTime] = useState<string>("");

  const handleActiveOption = (option: DropdownOptions) => {
    setActiveOption(option);
  };

  const handleAddWebsite = async () => {
    tagWebsite(
      website,
      activeOption,
      maxTime,
      setWebsite,
      setActiveOption,
      setMaxTime
    );
  };

  return (
    <div className="tag_website">
      <div className="tag_website__header">Tag Website</div>
      <div className="tag_website__outline">
        <div className="tag_website__content">
          <div className="tag_website__content__input">
            <Input
              input={website}
              placeholder="Enter Website URL"
              setInput={setWebsite}
              type="text"
            ></Input>
          </div>
          <div className="tag_website__content__dropdown">
            <Dropdown
              dropdownOptions={dropdownOptions}
              activeOption={activeOption}
              setActiveOption={handleActiveOption}
            ></Dropdown>
          </div>
        </div>
        {activeOption.id === "3" && (
          <div className="tag_website__max_time">
            <div className="tag_website__max_time__title">Max Time</div>
            <div className="tag_website__max_time__input">
              <Input
                input={maxTime}
                placeholder="Maximum Time of Usage per day in Minutes"
                setInput={setMaxTime}
                type="text"
              ></Input>
            </div>
          </div>
        )}
        <div className="tag_website__button">
          <Button text={"Add a website"} onClick={handleAddWebsite}></Button>
        </div>
      </div>
    </div>
  );
}
