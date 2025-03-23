import "./App.css";
import Badminton from "./page/badminton";
import { useEffect } from "react";

function App() {
  // Check for /reset path and clear localStorage
  useEffect(() => {
    const path = window.location.pathname;
    // Match both /reset and //reset paths
    if (path === "/reset" || path === "//reset") {
      // Clear all localStorage
      localStorage.clear();
      console.log("All localStorage data has been cleared");

      // Set a flag in sessionStorage to show notification after redirect
      sessionStorage.setItem("justReset", "true");

      // Redirect to home page
      window.location.href = "/";
    }
  }, []);

  return (
    <>
      <Badminton></Badminton>
    </>
  );
}

export default App;
