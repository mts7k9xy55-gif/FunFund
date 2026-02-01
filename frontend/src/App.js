import { useState } from "react";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import FunFundLayout from "@/components/funfund/FunFundLayout";

function App() {
  return (
    <div className="App h-screen">
      <FunFundLayout />
      <Toaster />
    </div>
  );
}

export default App;