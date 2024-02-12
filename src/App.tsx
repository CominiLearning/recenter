import { useState } from "react";
import "./App.css";
import MainPage from "./pages/MainPage";
import TagWebsitePage from "./pages/TagWebsitePage";
import SummaryPage from "./pages/SummaryPage";

function App() {
  const [page, setPage] = useState<number>(0);
  const pageOptions = [
    <MainPage setPage={setPage}></MainPage>,
    <TagWebsitePage setPage={setPage}></TagWebsitePage>,
    <SummaryPage setPage={setPage}></SummaryPage>,
  ];
  return <div className="app">{pageOptions[page]}</div>;
}

export default App;
