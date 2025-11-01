import React from "react";
import Game from "./Game";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1>Mahishmati Catapult — Ragdoll Demo</h1>
        <p>
          Drag the hero (red) and release. After launch it turns into a ragdoll.
        </p>
      </header>
      <Game />
      <footer className="footer">Prototype • Matter.js • No assets</footer>
    </div>
  );
}
