import React, { useRef, useEffect, useState } from "react";
import "./App.css";

export default function App() {
  // Refs for DOM elements
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const targetTagRef = useRef(null);
  const scoreTagRef = useRef(null);
  const timeTagRef = useRef(null);
  const startOverlayRef = useRef(null);
  const symptomPromptRef = useRef(null);
  const gameOverRef = useRef(null);
  const againBtnRef = useRef(null);
  const pauseResumeBtnRef = useRef(null);
  const musicBtnRef = useRef(null);
  const backBtnRef = useRef(null);
  const bgMusicRef = useRef(null);
  const dingSoundRef = useRef(null);
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuToggleRef = useRef(null);

  // Game state
  
  const [state, setState] = useState("menu"); // 'menu' | 'playing' | 'paused' | 'over'
  const [target, setTarget] = useState(null);
  const [musicOn, setMusicOn] = useState(true);

  const pillsRef = useRef([]);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(30 * 1000);
  const lastTsRef = useRef(performance.now());
  const spawnAccRef = useRef(0);
  const draggingRef = useRef(false);



  const catcherRef = useRef({ x: 100, y: 0, w: 120, h: 26, speed: 600 });

  const COLORS = {
    red: { main: "#e11d48", dark: "#a31132", label: "RED" },
    blue: { main: "#2563eb", dark: "#1d4ed8", label: "BLUE" },
    green: { main: "#10b981", dark: "#0b8f6a", label: "GREEN" },
  };


   useEffect(() => {
    function handleClickOutside(event) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        menuToggleRef.current &&
        !menuToggleRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);


  /* =========================
     CATCHER DRAG CONTROLS
     ========================= */
  useEffect(() => {
    const canvas = canvasRef.current;

    function clampCatcher() {
      const c = catcherRef.current;
      c.x = Math.max(0, Math.min(canvas.width - c.w, c.x));
    }
    function setCatcherX(px) {
      catcherRef.current.x = px - catcherRef.current.w / 2;
      clampCatcher();
    }

    function onMouseDown(e) {
      if (state !== "playing") return;
      draggingRef.current = true;
      const r = canvas.getBoundingClientRect();
      setCatcherX(e.clientX - r.left);
    }
    function onMouseMove(e) {
      if (!draggingRef.current || state !== "playing") return;
      const r = canvas.getBoundingClientRect();
      setCatcherX(e.clientX - r.left);
    }
    function onMouseUp() {
      draggingRef.current = false;
    }
    function onTouchStart(e) {
      if (state !== "playing") return;
      draggingRef.current = true;
      const r = canvas.getBoundingClientRect();
      setCatcherX(e.touches[0].clientX - r.left);
      e.preventDefault();
    }
    function onTouchMove(e) {
      if (!draggingRef.current || state !== "playing") return;
      const r = canvas.getBoundingClientRect();
      setCatcherX(e.touches[0].clientX - r.left);
      e.preventDefault();
    }
    function onTouchEnd() {
      draggingRef.current = false;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [state]);

  /* =========================
     MUSIC CONTROL
     ========================= */
  useEffect(() => {
    if (!bgMusicRef.current) return;
    bgMusicRef.current.volume = 0.4;
    if (state === "playing" && musicOn) {
      bgMusicRef.current.play().catch(() => {});
    } else {
      bgMusicRef.current.pause();
    }
  }, [state, musicOn]);

  /* =========================
     SIDEBAR BUTTONS
     (deleted the duplicate hook)
     ========================= */
  useEffect(() => {
    const pauseBtn = pauseResumeBtnRef.current;
    const backBtn = backBtnRef.current;
    const musicBtn = musicBtnRef.current;

    if (pauseBtn) {
      // Enable/disable and label
      pauseBtn.disabled = state === "menu" || state === "over";
      pauseBtn.textContent = state === "paused" ? "Resume" : "Pause";

      pauseBtn.onclick = () => {
        if (state === "playing") {
          setState("paused");
        } else if (state === "paused") {
          lastTsRef.current = performance.now(); // avoid time jump
          setState("playing");
        }
      };
    }

    if (musicBtn) {
      musicBtn.onclick = () => setMusicOn((m) => !m);
    }

    if (backBtn) {
      backBtn.disabled = state === "menu";
      backBtn.onclick = () => {
        // Back to menu without duplicate logic
        setState("menu");
        if (startOverlayRef.current) startOverlayRef.current.style.display = "flex";
        pillsRef.current = [];
        scoreRef.current = 0;
        timeLeftRef.current = 30 * 1000;
        spawnAccRef.current = 0;
        if (pauseResumeBtnRef.current) pauseResumeBtnRef.current.textContent = "Pause";
      };
    }
  }, [state]);

  /* =========================
     MOBILE MENU TOGGLE
     ========================= */
  useEffect(() => {
    const btn = menuToggleRef.current;
    const sidebar = sidebarRef.current;
    if (!btn || !sidebar) return;
    const onClick = () => {
      const open = sidebar.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    btn.addEventListener("click", onClick);
    return () => btn.removeEventListener("click", onClick);
  }, []);

  /* Auto-pause if tab hidden */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && state === "playing") setState("paused");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [state]);

  /* =========================
     CANVAS + GAME LOOP
    
     ========================= */
  useEffect(() => {
   
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const stage = canvas.parentElement;
    const RATIO = 480 / 760;
    let rafId = null;

    function fitCanvas() {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const sideW = isMobile ? 0 : (sidebarRef.current?.offsetWidth || 0) + 40;

      let maxW = Math.min(540, window.innerWidth - sideW - 60);
      maxW = Math.max(360, maxW);

      const topAllowance = 120;
      let maxH = Math.min(760, Math.floor(window.innerHeight - topAllowance));
      maxH = Math.max(560, Math.min(maxH, 700));

      let h = Math.min(maxH, Math.floor(window.innerHeight * 0.82));
      h = Math.max(560, Math.min(h, 700));
      let w = Math.round(h * RATIO);
      if (w > maxW) {
        w = maxW;
        h = Math.round(w / RATIO);
      }

      canvas.width = w;
      canvas.height = h;
      stage.style.width = w + "px";
      stage.style.height = h + 44 + "px";

      catcherRef.current.y = canvas.height - 70;
      clampCatcher();
    }

    function clampCatcher() {
      const c = catcherRef.current;
      c.x = Math.max(0, Math.min(canvas.width - c.w, c.x));
    }

    window.addEventListener("resize", fitCanvas);
    fitCanvas();

    // Helpers
    function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
      return !(
        x1 + w1 < x2 ||
        x1 > x2 + w2 ||
        y1 + h1 < y2 ||
        y1 > y2 + h2
      );
    }
    function roundRect(ctx, x, y, w, h, r = 10) {
      const rr = Math.min(r, h / 2, w / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
    function lighten(hex, amt) {
      const n = hex.replace("#", "");
      const r = Math.min(
        255,
        Math.max(0, parseInt(n.substr(0, 2), 16) + Math.round(255 * amt))
      );
      const g = Math.min(
        255,
        Math.max(0, parseInt(n.substr(2, 2), 16) + Math.round(255 * amt))
      );
      const b = Math.min(
        255,
        Math.max(0, parseInt(n.substr(4, 2), 16) + Math.round(255 * amt))
      );
      return `rgb(${r},${g},${b})`;
    }

    function spawnPill() {
      const r = Math.random();
      const types = ["red", "blue", "green"];
      let type = target || "red";
      if (r >= 0.6) {
        const others = types.filter((t) => t !== target);
        type = others[(Math.random() * others.length) | 0];
      }
      const w = 48 + Math.random() * 14;
      const h = 22 + Math.random() * 6;
      const x = Math.random() * (canvas.width - w);
      const y = -h - 10;
      const speed = 140 + Math.random() * 90;
      const angle = Math.random() * Math.PI;
      const spin = (Math.random() * 0.8 - 0.4) * 0.8 * (Math.PI / 180);
      pillsRef.current.push({ x, y, w, h, speed, type, angle, spin });
    }

    function drawCatcher() {
      if (!(state === "playing" || state === "paused")) return; // hidden before start
      const c = catcherRef.current;
      const r = 12;
      ctx.fillStyle = "#111827";
      roundRect(ctx, c.x, c.y, c.w, c.h, r);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      roundRect(ctx, c.x, c.y, c.w, 6, 8);
      ctx.fill();
    }

    function drawPill(p) {
      const col = COLORS[p.type];
      const cx = p.x + p.w / 2,
        cy = p.y + p.h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(p.angle);

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      roundRect(ctx, -p.w / 2 + 2, -p.h / 2 + 4, p.w, p.h, p.h / 2);
      ctx.fill();

      // left colored half
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(-p.w / 2, -p.h / 2, p.w / 2, p.h);
      ctx.clip();
      const gradL = ctx.createLinearGradient(-p.w / 2, -p.h / 2, -p.w / 2, p.h / 2);
      gradL.addColorStop(0, lighten(col.main, 0.15));
      gradL.addColorStop(1, col.dark);
      ctx.fillStyle = gradL;
      roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
      ctx.fill();
      ctx.restore();

      // right white half
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(0, -p.h / 2, p.w / 2, p.h);
      ctx.clip();
      const gradR = ctx.createLinearGradient(0, -p.h / 2, 0, p.h / 2);
      gradR.addColorStop(0, "#ffffff");
      gradR.addColorStop(1, "#e5e7eb");
      ctx.fillStyle = gradR;
      roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
      ctx.fill();
      ctx.restore();

      // seam + highlight + outline
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(-2, -p.h / 2, 4, p.h);
      ctx.beginPath();
      ctx.ellipse(-p.w / 6, -p.h / 4, p.w / 6, p.h / 3, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, p.h / 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawScene() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      
      // glassy background
ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
ctx.fillRect(0, 0, canvas.width, canvas.height);
for (const p of pillsRef.current) drawPill(p);
      drawCatcher();

      // HUD
      if (targetTagRef.current)
        targetTagRef.current.textContent = `Collect: ${
          target ? COLORS[target].label : "—"
        }`;
      if (scoreTagRef.current)
        scoreTagRef.current.textContent = `Score: ${scoreRef.current}`;
      if (timeTagRef.current)
        timeTagRef.current.textContent = `Time: ${Math.ceil(
          timeLeftRef.current / 1000
        )}s`;
    }

   function endGame() {
  setState("over");

  if (bgMusicRef.current) {
    bgMusicRef.current.pause();
    bgMusicRef.current.currentTime = 0;
  }

  if (gameOverRef.current) {
    gameOverRef.current.style.display = "flex";

    // Update heading based on score
    const heading = gameOverRef.current.querySelector("#over");
    const summary = gameOverRef.current.querySelector("#summary");

    if (heading && summary) {
      if (scoreRef.current >= 15) {
        heading.textContent = "Great, you're now well 🏆";
      } else {
        heading.textContent = "Sorry, try again to get well 💊";
      }
      summary.textContent = `You scored ${scoreRef.current}.`;
    }
  }

  if (pauseResumeBtnRef.current) {
    pauseResumeBtnRef.current.disabled = true;
    pauseResumeBtnRef.current.textContent = "Pause";
  }

  if (backBtnRef.current) backBtnRef.current.disabled = false;
}


    function loop(ts) {
      rafId = requestAnimationFrame(loop);

      // draw-only states
      if (state === "menu" || state === "paused" || state === "over") {
        drawScene();
        return;
      }

      const dt = Math.min(50, ts - lastTsRef.current);
      lastTsRef.current = ts;

      // timer
      timeLeftRef.current -= dt;
      if (timeLeftRef.current <= 0) {
        timeLeftRef.current = 0;
        endGame();
        drawScene();
        return;
      }

      // spawn pills
      spawnAccRef.current += dt;
      while (spawnAccRef.current >= 900) {
        spawnPill();
        spawnAccRef.current -= 900;
      }

      // update pills
      for (let i = pillsRef.current.length - 1; i >= 0; i--) {
        const p = pillsRef.current[i];
        p.y += (p.speed * dt) / 1000;
        p.angle += p.spin;

        const c = catcherRef.current;
        if (rectsOverlap(p.x, p.y, p.w, p.h, c.x, c.y, c.w, c.h)) {
          try {
            if (dingSoundRef.current) {
              dingSoundRef.current.currentTime = 0;
              dingSoundRef.current.play();
            }
          } catch {}
          if (p.type === target) scoreRef.current += 1;
          else scoreRef.current = Math.max(0, scoreRef.current - 1);
          pillsRef.current.splice(i, 1);
        } else if (p.y - p.h > canvas.height + 20) {
          pillsRef.current.splice(i, 1);
        }
      }

      drawScene();
    }

    rafId = requestAnimationFrame(loop);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", fitCanvas);
    };
  }, [state, target]);

  /* =========================
     RENDER
     ========================= */
  return (
<div id="app">

      {/* Main game column */}
      <div id="stage">
        <div id="hud" ref={hudRef}>
          <span id="targetTag" ref={targetTagRef}>
            Collect: —
          </span>
          <span id="scoreTag" ref={scoreTagRef}>
            Score: 0
          </span>
          <span id="timeTag" ref={timeTagRef}>
            Time: 30s
          </span>
        </div> 



        {/* Start overlay */}
        <div id="startOverlay" className="overlay" ref={startOverlayRef}>
          <div className="start-card">
            <h3 id="head" style={{  color: "#fff" }}>Medicine Catcher</h3>
            <p id="instruction" style={{ margin: 0, color: "#fff" }}>
              Click start to choose your symptom.
            </p>
            <button
              id="startBtnMain"
              className="start-btn"
              onClick={() => (symptomPromptRef.current.style.display = "flex")}
            >
              Start Game
            </button>
          </div>
        </div>

        {/* Symptom prompt */}
        <div
          id="symptomPrompt"
          className="overlay"
          style={{ display: "none" }}
          ref={symptomPromptRef}
        >
          <div className="panel">
            <h2 style={{ margin: "0 0 6px 0" }}>What hurts today?</h2>
            <p id="p-style" style={{ margin: "0 0 8px 0" }}>Pick a symptom to start and collect the matching capsules.
             Avoid the others or lose a minus score
            </p>
            <div className="choices">
              <button
                className="btn-red"
                data-target="red"
                onClick={() => {
                  // setup fresh run
                  setTarget("red");
                  symptomPromptRef.current.style.display = "none";
                  startOverlayRef.current.style.display = "none";
                  pillsRef.current = [];
                  scoreRef.current = 0;
                  timeLeftRef.current = 30 * 1000;
                  spawnAccRef.current = 0;
                  lastTsRef.current = performance.now();
                  catcherRef.current.x =
                    (canvasRef.current.width - catcherRef.current.w) / 2;
                  if (pauseResumeBtnRef.current)
                    pauseResumeBtnRef.current.disabled = false;
                  if (backBtnRef.current) backBtnRef.current.disabled = false;
                  if (musicOn && bgMusicRef.current)
                    bgMusicRef.current.play().catch(() => {});
                  setState("playing");
                }}
              >
                Headache (RED)
              </button>
              <button
                className="btn-blue"
                data-target="blue"
                onClick={() => {
                  setTarget("blue");
                  symptomPromptRef.current.style.display = "none";
                  startOverlayRef.current.style.display = "none";
                  pillsRef.current = [];
                  scoreRef.current = 0;
                  timeLeftRef.current = 30 * 1000;
                  spawnAccRef.current = 0;
                  lastTsRef.current = performance.now();
                  catcherRef.current.x =
                    (canvasRef.current.width - catcherRef.current.w) / 2;
                  if (pauseResumeBtnRef.current)
                    pauseResumeBtnRef.current.disabled = false;
                  if (backBtnRef.current) backBtnRef.current.disabled = false;
                  if (musicOn && bgMusicRef.current)
                    bgMusicRef.current.play().catch(() => {});
                  setState("playing");
                }}
              >
                Stomach ache (BLUE)
              </button>
              <button
                className="btn-green"
                data-target="green"
                onClick={() => {
                  setTarget("green");
                  symptomPromptRef.current.style.display = "none";
                  startOverlayRef.current.style.display = "none";
                  pillsRef.current = [];
                  scoreRef.current = 0;
                  timeLeftRef.current = 30 * 1000;
                  spawnAccRef.current = 0;
                  lastTsRef.current = performance.now();
                  catcherRef.current.x =
                    (canvasRef.current.width - catcherRef.current.w) / 2;
                  if (pauseResumeBtnRef.current)
                    pauseResumeBtnRef.current.disabled = false;
                  if (backBtnRef.current) backBtnRef.current.disabled = false;
                  if (musicOn && bgMusicRef.current)
                    bgMusicRef.current.play().catch(() => {});
                  setState("playing");
                }}
              >
                 Blood pressure (GREEN)
              </button>
            </div>
          </div>
        </div>

        {/* Game over */}
        <div
          id="gameover"
          className=""
          style={{ display: "none" }}
          ref={gameOverRef}
        >
          <div style={{ textAlign: "center" }}>
            <h2 id="over"></h2>
            <p id="summary"></p>
            <button
              id="againBtn"
              
              ref={againBtnRef}
              onClick={() => {
                gameOverRef.current.style.display = "none";
                startOverlayRef.current.style.display = "flex";
                setState("menu");
                pillsRef.current = [];
                scoreRef.current = 0;
                timeLeftRef.current = 30 * 1000;
                spawnAccRef.current = 0;
                if (pauseResumeBtnRef.current)
                  pauseResumeBtnRef.current.textContent = "Pause";
              }}
            >
              Play again
            </button>
          </div>
        </div>

        <canvas id="game" width="480" height="760" ref={canvasRef}></canvas>
      </div>

       {/* Hamburger Button */}
      <button
        id="menuToggle"
        aria-controls="sidebar"
        aria-expanded={open}
        ref={menuToggleRef}
        onClick={() => setOpen(!open)}
        className={open ? "open" : ""}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar */}
      <nav
        id="sidebar"
        aria-label="Game menu"
        ref={sidebarRef}
        className={open ? "open" : ""}
      >
        <h2 id="menu">Menu</h2>
        <button
          id="pauseResumeBtn"
          className="btn-dark"
          disabled
          ref={pauseResumeBtnRef}
        >
          Pause
        </button>
        <button id="musicBtn" ref={musicBtnRef}>
          {musicOn ? "Music: On" : "Music: Off"}
        </button>
        <button
          id="backBtn"
          className="btn-dark"
          disabled
          ref={backBtnRef}
        >
          Back to Menu
        </button>
      </nav>
   

      {/* Audio */}
      <audio
        id="bgMusic"
        ref={bgMusicRef}
        src="https://www.bensound.com/bensound-music/bensound-funkyelement.mp3"
        loop
      />
      <audio
        id="dingSound"
        ref={dingSoundRef}
        src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
      />
    </div>
  );
}
