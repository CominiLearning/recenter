import { useEffect, useState } from "react";
import Button from "./Button";
import Input from "./Input";
import "./AuthKeyBox.scss";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import { verifyAPIKey } from "../utils/VerifyApiKey";

export default function AuthKeyBox() {
  const [authKey, setAuthKey] = useState<string>("");
  const [showAuthKey, setShowAuthKey] = useState<boolean>(false);

  const handleAddAuthKey = async () => {
    await chrome.storage.local.remove("authKey");
    const res = await verifyAPIKey(authKey);
    if (res === 0) {
      alert("API Key saved successfully");
    } else {
      alert("Invalid API Key");
    }
  };

  useEffect(() => {
    async function checkStatus() {
      setAuthKey((await chrome.storage.local.get())["authKey"] as string);
    }
    checkStatus();
  }, []);

  const handleShowAuthKey = () => {
    setShowAuthKey((prev) => !prev);
  };

  return (
    <div className="auth_key_box">
      <div className="auth_key_box__header">Auth Key</div>
      <div className="auth_key_box__outline">
        <div className="auth_key_box__content">
          <div className="auth_key_box__content__input">
            <Input
              input={authKey}
              placeholder="Enter Your Chatgpt Auth Key"
              setInput={setAuthKey}
              type={showAuthKey ? "text" : "password"}
            ></Input>
          </div>
          <div className="auth_key_box__content__show">
            <div
              className="auth_key_box__content__show__eye"
              onClick={handleShowAuthKey}
            >
              {showAuthKey ? <FaEyeSlash></FaEyeSlash> : <FaEye></FaEye>}
            </div>
          </div>
        </div>
        <div className="auth_key_box__button">
          <Button text={"Authenticate"} onClick={handleAddAuthKey}></Button>
        </div>
      </div>
    </div>
  );
}
