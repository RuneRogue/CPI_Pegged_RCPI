// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import MintRedeem from "./components/MintRedeem";
import RcpiChart from "./components/RcpiChart";
import RcsChart from "./components/RcsChart";

function App() {
    return (
        <Router>
            <div className="app-container">
                <Home />
                <Routes>
                    <Route path="/" element={<MintRedeem />} />
                    <Route path="/rcpi-chart" element={<RcpiChart />} />
                    <Route path="/rcs-chart" element={<RcsChart />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
