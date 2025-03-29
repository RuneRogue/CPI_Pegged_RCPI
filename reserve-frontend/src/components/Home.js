// src/components/Home.js
import React from "react";
import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="">
            <nav>
                <ul>
                    <li>
                        <Link to="/">Mint / Redeem</Link>
                    </li>
                    <li>
                        <Link to="/rcpi-chart">RCPI Price Chart</Link>
                    </li>
                    <li>
                        <Link to="/rcs-chart">RCS Price Chart</Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

export default Home;
