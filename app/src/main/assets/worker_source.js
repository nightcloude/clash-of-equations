export default {
    async fetch(request, env) {

        const url = new URL(request.url);
        const path = url.pathname.replace(/\/+$/, "") || "/";

        const JSON_HEADERS = {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        };

        /*
        ============================================================
        LEADERBOARD
        ============================================================
        */

        if (
            (path === "/api/leaderboard" || path === "/math/api/leaderboard") &&
            request.method === "GET"
        ) {
            try {

                const result = await env.DB.prepare(`
                    SELECT
                        id,
                        name,
                        grade,
                        section,
                        score,
                        created_at
                    FROM tbl_leaderboard
                    WHERE created_at >= datetime(
                        'now',
                        'localtime',
                        'weekday 1',
                        '-7 days'
                    )
                    ORDER BY score DESC, id ASC
                `).all();

                const rows = result.results || [];

                return new Response(
                    JSON.stringify({
                        success: true,
                        weeklyLeaderboard: true,
                        rows: rows,
                        scores: rows.map(
                            row => Number(row.score) || 0
                        )
                    }),
                    {
                        status: 200,
                        headers: JSON_HEADERS
                    }
                );

            } catch (error) {

                console.error("Leaderboard error:", error);

                return new Response(
                    JSON.stringify({
                        success: false,
                        message: "Unable to load leaderboard."
                    }),
                    {
                        status: 500,
                        headers: JSON_HEADERS
                    }
                );
            }
        }


        /*
        ============================================================
        SUBMIT SCORE
        ============================================================
        */

        if (
            (path === "/api/submit-score" ||
             path === "/math/api/submit-score") &&
            request.method === "POST"
        ) {
            try {

                const contentType =
                    request.headers.get("content-type") || "";

                let body = {};

                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    body = await request.json();

                } else {

                    const form =
                        await request.formData();

                    body = {
                        name: form.get("name"),
                        grade: form.get("grade"),
                        section: form.get("section"),
                        score: form.get("score")
                    };
                }


                let name =
                    String(body.name || "").trim();

                let grade =
                    String(body.grade || "").trim();

                let section =
                    String(body.section || "").trim();

                let score =
                    Number.parseInt(
                        body.score,
                        10
                    );


                if (!name) {
                    name = "Anonymous";
                }

                if (!grade) {
                    grade = "N/A";
                }

                if (!section) {
                    section = "N/A";
                }

                if (
                    !Number.isFinite(score) ||
                    score < 0
                ) {
                    score = 0;
                }


                name =
                    name.substring(0, 100);

                grade =
                    grade.substring(0, 50);

                section =
                    section.substring(0, 100);


                await env.DB.prepare(`
                    INSERT INTO tbl_leaderboard
                    (
                        name,
                        grade,
                        section,
                        score,
                        created_at
                    )
                    VALUES
                    (?, ?, ?, ?, datetime('now'))
                `)
                .bind(
                    name,
                    grade,
                    section,
                    score
                )
                .run();


                return new Response(
                    JSON.stringify({
                        success: true,
                        message:
                            "Score saved successfully."
                    }),
                    {
                        status: 200,
                        headers: JSON_HEADERS
                    }
                );

            } catch (error) {

                console.error(
                    "Score submission error:",
                    error
                );

                return new Response(
                    JSON.stringify({
                        success: false,
                        message:
                            "Unable to save your score."
                    }),
                    {
                        status: 500,
                        headers: JSON_HEADERS
                    }
                );
            }
        }


        /*
        ============================================================
        ALL-TIME LEADERBOARD
        ============================================================
        */

        if (
            (
                path === "/api/leaderboard/all" ||
                path === "/math/api/leaderboard/all"
            ) &&
            request.method === "GET"
        ) {
            try {

                const result = await env.DB.prepare(`
                    SELECT
                        id,
                        name,
                        grade,
                        section,
                        score,
                        created_at
                    FROM tbl_leaderboard
                    ORDER BY score DESC, id ASC
                `).all();

                const rows =
                    result.results || [];

                return new Response(
                    JSON.stringify({
                        success: true,
                        weeklyLeaderboard: false,
                        rows: rows,
                        scores: rows.map(
                            row =>
                                Number(row.score) || 0
                        )
                    }),
                    {
                        status: 200,
                        headers: JSON_HEADERS
                    }
                );

            } catch (error) {

                console.error(
                    "All-time leaderboard error:",
                    error
                );

                return new Response(
                    JSON.stringify({
                        success: false,
                        message:
                            "Unable to load leaderboard."
                    }),
                    {
                        status: 500,
                        headers: JSON_HEADERS
                    }
                );
            }
        }


        /*
        ============================================================
        GAME
        ============================================================
        */

        if (
            request.method === "GET" &&
            (
                path === "/" ||
                path === "/index.html" ||
                path === "/math" ||
                path === "/math/index.html"
            )
        ) {

            return new Response(
                getGameHTML(request),
                {
                    status: 200,
                    headers: {
                        "Content-Type":
                            "text/html; charset=utf-8",

                        "Cache-Control":
                            "no-store, no-cache, must-revalidate, max-age=0"
                    }
                }
            );
        }


        /*
        ============================================================
        404
        ============================================================
        */

        return new Response(
            "Not Found",
            {
                status: 404,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );
    }
};


/*
====================================================================
GAME HTML
====================================================================
*/

function getGameHTML(request) {

    const url =
        new URL(request.url);

    const base =
        url.pathname.startsWith("/math")
            ? "/math/"
            : "/";

    return `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>Clash of Equations</title>

<link
    rel="preconnect"
    href="https://fonts.googleapis.com"
>

<link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
>

<link
    href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;700;800;900&display=swap"
    rel="stylesheet"
>

<style>
${GAME_CSS}
</style>

</head>

<body>

${BACKGROUND_HTML}

<div class="app">

${LANDING_HTML}

${GAME_HTML}

${LEADERBOARD_HTML}

</div>

${OVERLAYS_HTML}

${SOUND_HTML}

<script>
window.CLASH_BASE = ${JSON.stringify(base)};
</script>

<script>
${GAME_JS}
</script>

</body>

</html>`;
}


/*
====================================================================
BACKGROUND
====================================================================
*/

const BACKGROUND_HTML = `

<div class="background">

    <div class="orb one"></div>
    <div class="orb two"></div>
    <div class="orb three"></div>

    <div class="particle"
         style="left:10%;animation-duration:9s"></div>

    <div class="particle"
         style="left:22%;animation-duration:12s"></div>

    <div class="particle"
         style="left:37%;animation-duration:10s"></div>

    <div class="particle"
         style="left:53%;animation-duration:14s"></div>

    <div class="particle"
         style="left:68%;animation-duration:11s"></div>

    <div class="particle"
         style="left:84%;animation-duration:13s"></div>

</div>

`;


/*
====================================================================
LANDING
====================================================================
*/

const LANDING_HTML = `

<section
    id="landingScreen"
    class="screen active"
>

    <div class="landing">

        <img
            class="logo"
            src="https://raw.githubusercontent.com/nightcloude/amaris/main/antipolox.png"
            alt=""
        >

        <h1 class="game-title">
            CLASH<br>OF EQUATIONS
        </h1>

        <div class="subtitle">
            SPEED • ACCURACY • COMBO
        </div>

        <div
            class="difficulty-panel"
            aria-label="Choose difficulty"
        >

            <div class="difficulty-heading">
                SELECT DIFFICULTY
            </div>

            <div class="difficulty-options">

                <label class="difficulty-option">

                    <input
                        type="radio"
                        name="difficulty"
                        value="easy"
                    >

                    <span class="difficulty-name easy">
                        EASY
                    </span>

                    <span class="difficulty-desc">
                        Simple equations
                    </span>

                </label>


                <label class="difficulty-option">

                    <input
                        type="radio"
                        name="difficulty"
                        value="normal"
                        checked
                    >

                    <span class="difficulty-name normal">
                        NORMAL
                    </span>

                    <span class="difficulty-desc">
                        Balanced challenge
                    </span>

                </label>


                <label class="difficulty-option">

                    <input
                        type="radio"
                        name="difficulty"
                        value="hard"
                    >

                    <span class="difficulty-name hard">
                        HARD
                    </span>

                    <span class="difficulty-desc">
                        Bigger numbers
                    </span>

                </label>


                <label class="difficulty-option">

                    <input
                        type="radio"
                        name="difficulty"
                        value="extreme"
                    >

                    <span class="difficulty-name extreme">
                        EXTREME
                    </span>

                    <span class="difficulty-desc">
                        Maximum challenge
                    </span>

                </label>

            </div>

        </div>


        <div class="menu">

            <button
                class="btn btn-primary"
                type="button"
                onclick="startGame()"
            >
                ▶ START GAME
            </button>

            <button
                class="btn btn-secondary"
                type="button"
                onclick="viewLeaderboard()"
            >
                ★ LEADERBOARD
            </button>

        </div>

    </div>

</section>

`;


/*
====================================================================
GAME
====================================================================
*/

const GAME_HTML = `

<section
    id="gameScreen"
    class="screen"
>

    <div class="game-card">

        <div class="game-header">

            <div class="brand">

                <img
                    src="https://img.icons8.com/?size=512&id=44705&format=png"
                    alt=""
                >

                <div>

                    <div class="brand-name">
                        CLASH OF EQUATIONS
                    </div>

                    <div class="brand-sub">
                        TIME ATTACK
                    </div>

                    <div
                        class="game-difficulty"
                        id="gameDifficulty"
                    >
                        NORMAL
                    </div>

                </div>

            </div>


            <div class="hud">

                <div class="hud-box">

                    <span class="hud-label">
                        TIME
                    </span>

                    <span
                        class="hud-value"
                        id="timer"
                    >
                        00:15
                    </span>

                </div>


                <div class="hud-box">

                    <span class="hud-label">
                        SCORE
                    </span>

                    <span
                        class="hud-value"
                        id="score"
                    >
                        0
                    </span>

                </div>


                <div
                    class="hud-box"
                    id="combo-box"
                >

                    <span class="hud-label">
                        COMBO
                    </span>

                    <span
                        class="hud-value"
                        id="combo"
                    >
                        x0
                    </span>

                </div>


                <div
                    class="tier-badge"
                    id="tierBadge"
                >

                    <span class="tier-label">
                        RANK
                    </span>

                    <span id="tier">
                        BRONZE
                    </span>

                </div>

            </div>

        </div>


        <div
            class="rival-bar"
            id="rivalBar"
        >

            <div
                class="rival-text"
                id="rivalText"
            >
                START PLAYING TO CHALLENGE THE LEADERBOARD
            </div>

        </div>


        <div class="time-container">

            <div class="time-track">

                <div
                    class="time-bar"
                    id="timeBar"
                ></div>

            </div>

        </div>


        <div class="game-content">

            <div class="solve-label">
                SOLVE THE EQUATION
            </div>

            <div id="equation">
                0 + 0 = ?
            </div>

            <div class="answer-wrapper">

                <input
                    id="answer"
                    type="text"
                    readonly
                    autocomplete="off"
                >

            </div>


            <div class="keypad">

                <button
                    class="key"
                    data-key="1"
                >1</button>

                <button
                    class="key"
                    data-key="2"
                >2</button>

                <button
                    class="key"
                    data-key="3"
                >3</button>

                <button
                    class="key"
                    data-key="4"
                >4</button>

                <button
                    class="key"
                    data-key="5"
                >5</button>

                <button
                    class="key"
                    data-key="6"
                >6</button>

                <button
                    class="key"
                    data-key="7"
                >7</button>

                <button
                    class="key"
                    data-key="8"
                >8</button>

                <button
                    class="key"
                    data-key="9"
                >9</button>

                <button
                    class="key clear"
                    data-key="C"
                >C</button>

                <button
                    class="key"
                    data-key="0"
                >0</button>

                <button
                    class="key submit"
                    data-key="ENTER"
                >=</button>

            </div>

        </div>


        <div class="game-footer">

            <button
                class="footer-button"
                onclick="back()"
            >
                ← BACK
            </button>

            <div class="controls">
                NUMBER KEYS • ENTER • BACKSPACE • ESC • R
            </div>

            <button
                class="footer-button"
                onclick="startGame()"
            >
                ↻ RESTART
            </button>

        </div>

    </div>

</section>

`;


/*
====================================================================
LEADERBOARD
====================================================================
*/

const LEADERBOARD_HTML = `

<section
    id="leaderboardScreen"
    class="screen"
>

    <div class="leader-card">

        <div class="leader-title">
            LEADERBOARD
        </div>

        <div class="leader-sub">
            TOP EQUATION WARRIORS
        </div>

        <div
            class="weekly-status"
            id="leaderStatus"
        >
            ● CURRENT WEEK
        </div>

        <div
            class="leader-list"
            id="leaderList"
        ></div>

        <div class="leader-footer">

            <button
                class="btn btn-secondary"
                onclick="back()"
            >
                ← BACK
            </button>

        </div>

    </div>

</section>

`;


/*
====================================================================
OVERLAYS
====================================================================
*/

const OVERLAYS_HTML = `

<div
    class="countdown-overlay"
    id="countdownOverlay"
>

    <div
        class="countdown-number"
        id="countdownNumber"
    >
        3
    </div>

</div>


<div
    class="overlay"
    id="gameOver"
>

    <div class="game-over">

        <h2>
            TIME'S UP!
        </h2>

        <div class="final-label">
            FINAL SCORE
        </div>

        <div
            class="final-score"
            id="finalScore"
        >
            0
        </div>

        <div
            class="final-tier"
            id="finalTier"
        >
            BRONZE
        </div>

        <form id="scoreForm">

            <input
                type="text"
                class="name-input"
                id="name"
                name="name"
                maxlength="100"
                placeholder="ENTER FULL NAME"
                autocomplete="off"
                required
            >

            <input
                type="text"
                class="name-input"
                id="grade"
                name="grade"
                maxlength="50"
                placeholder="ENTER GRADE"
                autocomplete="off"
                required
            >

            <input
                type="text"
                class="name-input"
                id="section"
                name="section"
                maxlength="100"
                placeholder="ENTER SECTION"
                autocomplete="off"
                required
            >

            <input
                type="hidden"
                id="userScore"
                name="score"
            >

            <div class="game-over-buttons">

                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="closeGameOver()"
                >
                    CANCEL
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    SAVE SCORE
                </button>

            </div>

        </form>

    </div>

</div>

`;


/*
====================================================================
GAME JAVASCRIPT
====================================================================

IMPORTANT:
There are NO nested backtick template literals in this section.
This prevents the Cloudflare Worker parser from breaking.
====================================================================
*/

const GAME_JS = `

(() => {

'use strict';


const DIFFICULTIES = {

    easy: {
        name: 'EASY',
        time: 35,
        min: 1,
        max: 20,
        operations: ['+', '-'],
        allowNegative: false
    },

    normal: {
        name: 'NORMAL',
        time: 28,
        min: 2,
        max: 30,
        operations: ['+', '-', '×'],
        allowNegative: false
    },

    hard: {
        name: 'HARD',
        time: 22,
        min: 10,
        max: 99,
        operations: ['+', '-', '×', '÷'],
        allowNegative: false
    },

    extreme: {
        name: 'EXTREME',
        time: 18,
        min: 20,
        max: 150,
        operations: ['+', '-', '×', '÷'],
        allowNegative: true
    }

};


let difficulty =
    localStorage.getItem('clashDifficulty') ||
    'normal';

if (!DIFFICULTIES[difficulty]) {
    difficulty = 'normal';
}


let currentAnswer = 0;
let score = 0;
let combo = 0;

let timeLeft = 15;
let totalTime = 15;

let timerInterval = null;
let countdownInterval = null;
let endTime = null;

let gameRunning = false;
let acceptingInput = false;

let currentQuestion = null;

let leaderboardScores = [];


const $ = id =>
    document.getElementById(id);


const landingScreen =
    $('landingScreen');

const gameScreen =
    $('gameScreen');

const leaderboardScreen =
    $('leaderboardScreen');

const equation =
    $('equation');

const answer =
    $('answer');

const timer =
    $('timer');

const timeBar =
    $('timeBar');

const scoreEl =
    $('score');

const comboEl =
    $('combo');

const tierEl =
    $('tier');

const tierBadge =
    $('tierBadge');

const rivalBar =
    $('rivalBar');

const rivalText =
    $('rivalText');

const gameDifficulty =
    $('gameDifficulty');

const gameOver =
    $('gameOver');

const finalScore =
    $('finalScore');

const finalTier =
    $('finalTier');

const userScore =
    $('userScore');

const scoreForm =
    $('scoreForm');


function sounds(name, ...args) {

    try {

        if (
            window.ClashSounds &&
            typeof window.ClashSounds[name] ===
                'function'
        ) {

            window.ClashSounds[name](...args);

        }

    } catch (e) {}

}


function getBase() {

    return window.CLASH_BASE || '/';

}


function api(path) {

    const base =
        getBase().replace(/\\/$/, '');

    return base + path;

}


/*
============================================================
DIFFICULTY
============================================================
*/

function getSelectedDifficulty() {

    const selected =
        document.querySelector(
            'input[name="difficulty"]:checked'
        );

    return selected
        ? selected.value
        : 'normal';

}


function applyDifficulty(value) {

    if (!DIFFICULTIES[value]) {
        value = 'normal';
    }

    difficulty = value;

    const config =
        DIFFICULTIES[difficulty];

    if (gameDifficulty) {

        gameDifficulty.textContent =
            config.name;

        gameDifficulty.className =
            'game-difficulty difficulty-' +
            difficulty;

    }


    document
        .querySelectorAll(
            'input[name="difficulty"]'
        )
        .forEach(input => {

            input.checked =
                input.value === difficulty;

        });


    try {

        localStorage.setItem(
            'clashDifficulty',
            difficulty
        );

    } catch (e) {}

}


/*
============================================================
LEADERBOARD
============================================================
*/

async function loadLeaderboard() {

    try {

        const response =
            await fetch(
                api('/api/leaderboard'),
                {
                    cache: 'no-store'
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                'Unable to load leaderboard.'
            );

        }


        leaderboardScores =
            Array.isArray(data.scores)
                ? data.scores
                    .map(Number)
                    .filter(
                        Number.isFinite
                    )
                : [];


        renderLeaderboard(
            data.rows || [],
            data.weeklyLeaderboard
        );


        updateRival();


    } catch (error) {

        console.error(
            'Leaderboard:',
            error
        );


        leaderboardScores = [];


        const list =
            $('leaderList');


        if (list) {

            list.innerHTML =
                '<div class="leader-empty">' +
                'UNABLE TO LOAD SCORES' +
                '</div>';

        }

    }

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function renderLeaderboard(
    rows,
    weekly
) {

    const list =
        $('leaderList');

    const status =
        $('leaderStatus');


    if (!list) {
        return;
    }


    if (status) {

        status.textContent =
            weekly
                ? '● CURRENT WEEK'
                : '● ALL-TIME SCORES';

    }


    if (!rows.length) {

        list.innerHTML =
            '<div class="leader-empty">' +
            'NO SCORES YET' +
            '</div>';

        return;

    }


    list.innerHTML =
        rows.map(
            (row, index) => {

                const scoreValue =
                    Number(row.score) || 0;

                const tier =
                    getTierData(scoreValue);


                return (

                    '<div class="leader-row">' +

                        '<div class="rank">' +
                            '#' +
                            (index + 1) +
                        '</div>' +

                        '<div class="player">' +

                            '<div class="player-name">' +
                                escapeHTML(
                                    row.name || ''
                                ) +
                            '</div>' +

                            '<div class="player-details">' +
                                'Grade ' +
                                escapeHTML(
                                    row.grade || ''
                                ) +
                                '<span class="detail-separator">' +
                                    ' • ' +
                                '</span>' +
                                escapeHTML(
                                    row.section || ''
                                ) +
                            '</div>' +

                        '</div>' +

                        '<div class="player-score">' +
                            scoreValue +
                        '</div>' +

                        '<div class="leader-tier ' +
                            tier.class +
                        '">' +
                            tier.name +
                        '</div>' +

                    '</div>'

                );

            }
        ).join('');

}


/*
============================================================
SCREEN CONTROLS
============================================================
*/

window.viewLeaderboard =
    function () {

        stopTimer();

        gameRunning = false;
        acceptingInput = false;

        if (countdownInterval) {

            clearInterval(
                countdownInterval
            );

            countdownInterval = null;

        }

        gameOver.classList.remove(
            'show'
        );

        $('countdownOverlay')
            ?.classList.remove('show');

        landingScreen.classList.remove(
            'active'
        );

        gameScreen.classList.remove(
            'active'
        );

        leaderboardScreen.classList.add(
            'active'
        );

        loadLeaderboard();

    };


window.back =
    function () {

        stopTimer();

        gameRunning = false;
        acceptingInput = false;

        if (countdownInterval) {

            clearInterval(
                countdownInterval
            );

            countdownInterval = null;

        }

        gameOver.classList.remove(
            'show'
        );

        $('countdownOverlay')
            ?.classList.remove('show');

        leaderboardScreen.classList.remove(
            'active'
        );

        gameScreen.classList.remove(
            'active'
        );

        landingScreen.classList.add(
            'active'
        );

    };


window.closeGameOver =
    function () {

        gameOver.classList.remove(
            'show'
        );

        $('countdownOverlay')
            ?.classList.remove('show');

        gameRunning = false;
        acceptingInput = false;

    };


/*
============================================================
QUESTIONS
============================================================
*/

function randomInt(
    min,
    max
) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}


function makeQuestion() {

    const config =
        DIFFICULTIES[difficulty];


    const op =
        config.operations[
            randomInt(
                0,
                config.operations.length - 1
            )
        ];


    let a;
    let b;
    let result;


    if (op === '+') {

        a =
            randomInt(
                config.min,
                config.max
            );

        b =
            randomInt(
                config.min,
                config.max
            );

        result =
            a + b;

    }


    else if (op === '-') {

        a =
            randomInt(
                config.min,
                config.max
            );

        b =
            randomInt(
                config.min,
                config.max
            );


        if (
            !config.allowNegative &&
            b > a
        ) {

            [
                a,
                b
            ] =
            [
                b,
                a
            ];

        }


        result =
            a - b;

    }


    else if (op === '×') {

        if (difficulty === 'normal') {

            a =
                randomInt(
                    2,
                    12
                );

            b =
                randomInt(
                    2,
                    12
                );

        } else {

            a =
                randomInt(
                    3,
                    15
                );

            b =
                randomInt(
                    2,
                    12
                );

        }


        result =
            a * b;

    }


    else {

        b =
            randomInt(
                2,
                difficulty === 'extreme'
                    ? 12
                    : 10
            );


        const minResult =
            difficulty === 'extreme'
                ? 2
                : 1;


        const maxResult =
            difficulty === 'extreme'
                ? 15
                : 12;


        result =
            randomInt(
                minResult,
                maxResult
            );


        a =
            b * result;

    }


    return {

        text:
            a +
            ' ' +
            op +
            ' ' +
            b +
            ' = ?',

        answer:
            result

    };

}


function newQuestion() {

    currentQuestion =
        makeQuestion();

    currentAnswer =
        currentQuestion.answer;


    equation.textContent =
        currentQuestion.text;


    equation.classList.remove(
        'flash'
    );

    void equation.offsetWidth;

    equation.classList.add(
        'flash'
    );


    answer.value = '';

    answer.classList.remove(
        'correct',
        'wrong'
    );

}


/*
============================================================
TIER
============================================================
*/

function getTierData(scoreValue) {

    if (scoreValue >= 4000) {

        return {
            name: 'DIAMOND',
            class: 'tier-diamond'
        };

    }


    if (scoreValue >= 2000) {

        return {
            name: 'PLATINUM',
            class: 'tier-platinum'
        };

    }


    if (scoreValue >= 1000) {

        return {
            name: 'GOLD',
            class: 'tier-gold'
        };

    }


    if (scoreValue >= 500) {

        return {
            name: 'SILVER',
            class: 'tier-silver'
        };

    }


    return {
        name: 'BRONZE',
        class: 'tier-bronze'
    };

}


/*
============================================================
HUD
============================================================
*/

function updateHUD() {

    scoreEl.textContent =
        score;

    comboEl.textContent =
        'x' + combo;


    timer.textContent =
        '00:' +
        String(
            Math.max(
                0,
                Math.ceil(timeLeft)
            )
        ).padStart(
            2,
            '0'
        );


    const percentage =
        totalTime > 0
            ? Math.max(
                0,
                Math.min(
                    100,
                    (
                        timeLeft /
                        totalTime
                    ) * 100
                )
            )
            : 0;


    timeBar.style.width =
        percentage + '%';


    const tier =
        getTierData(score);


    tierEl.textContent =
        tier.name;


    tierBadge.className =
        'tier-badge ' +
        tier.class;


    updateRival();

}


function updateRival() {

    if (!rivalText) {
        return;
    }


    const scores =
        leaderboardScores
            .map(Number)
            .filter(
                Number.isFinite
            )
            .sort(
                (a, b) => a - b
            );


    if (!scores.length) {

        rivalText.textContent =
            'START PLAYING TO CHALLENGE THE LEADERBOARD';

        rivalBar.classList.remove(
            'beaten'
        );

        return;

    }


    const next =
        scores.find(
            value =>
                value > score
        );


    if (next !== undefined) {

        const gap =
            next - score;


        rivalText.textContent =
            'NEXT RIVAL: ' +
            next +
            ' POINTS • ' +
            gap +
            ' TO OVERTAKE';


        rivalBar.classList.remove(
            'beaten'
        );

    } else {

        rivalText.textContent =
            'YOU ARE AHEAD OF THE CURRENT LEADERBOARD';


        rivalBar.classList.add(
            'beaten'
        );

    }

}


/*
============================================================
TIMER
============================================================
*/

function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }


    sounds(
        'stopLowTime'
    );

}


function startTimer() {

    stopTimer();


endTime =
    performance.now() +
    (
        timeLeft *
        1000
    );


    timerInterval =
        setInterval(
            () => {

                const remaining =
                    Math.max(
                        0,
                        (
                            endTime -
                            performance.now()
                        ) / 1000
                    );


                timeLeft =
                    remaining;


                updateHUD();


                if (
                    remaining <= 5 &&
                    remaining > 0
                ) {

                    sounds(
                        'lowTime'
                    );

                }


                if (
                    remaining <= 0
                ) {

                    stopTimer();

                    endGame();

                }

            },
            100
        );

}


/*
============================================================
SCORING
============================================================
*/

function addScore() {

    const base =
        100;


    const comboBonus =
        Math.min(
            combo * 25,
            500
        );


    const points =
        base +
        comboBonus;


    score +=
        points;


    sounds(
        'score',
        '+' + points
    );


    sounds(
        'combo',
        combo
    );

}


/*
============================================================
ANSWER
============================================================
*/

function submitAnswer() {

    if (
        !gameRunning ||
        !acceptingInput
    ) {
        return;
    }


    const value =
        Number.parseInt(
            answer.value,
            10
        );


    if (
        !Number.isFinite(value)
    ) {
        return;
    }


    acceptingInput =
        false;


    if (
        value === currentAnswer
    ) {

        combo++;


        addScore();


        sounds(
            'correct',
            combo
        );


        const bonuses = {

            easy: 3,
            normal: 4,
            hard: 6,
            extreme: 8

        };


        const bonus =
            bonuses[difficulty] ||
            1;


const bonusMs = bonus * 1000;
endTime += bonusMs;

timeLeft =
    Math.min(
        totalTime,
        timeLeft + bonus
    );


        answer.classList.remove(
            'correct'
        );

        void answer.offsetWidth;

        answer.classList.add(
            'correct'
        );


        showTimeBonus(
            '+' + bonus + 's'
        );


        updateHUD();


        setTimeout(
            () => {

                if (!gameRunning) {
                    return;
                }

                newQuestion();

                acceptingInput =
                    true;

            },
            140
        );


    } else {

        combo =
            0;


        sounds(
            'wrong'
        );


        answer.classList.remove(
            'wrong'
        );

        void answer.offsetWidth;

        answer.classList.add(
            'wrong'
        );


        const penalty =
            difficulty === 'extreme'
                ? 2
                : 1;


        timeLeft =
            Math.max(
                0,
                timeLeft - penalty
            );


        showTimeBonus(
            '-' + penalty + 's'
        );


        updateHUD();


        setTimeout(
            () => {

                if (!gameRunning) {
                    return;
                }

                answer.value =
                    '';

                answer.classList.remove(
                    'wrong'
                );

                acceptingInput =
                    true;

            },
            220
        );

    }

}


function showTimeBonus(text) {

    const el =
        document.createElement(
            'div'
        );


    el.className =
        'time-bonus';


    el.textContent =
        text;


    document.body.appendChild(
        el
    );


    setTimeout(
        () => el.remove(),
        750
    );

}


/*
============================================================
KEYPAD
============================================================
*/

function keyPress(key) {

    if (
        !gameRunning ||
        !acceptingInput
    ) {
        return;
    }


    if (
        /^[0-9]$/.test(key)
    ) {

        if (
            answer.value.length < 7
        ) {

            answer.value +=
                key;

            sounds(
                'button'
            );

        }

        return;

    }


    if (key === 'C') {

        answer.value =
            '';

        sounds(
            'clear'
        );

        return;

    }


    if (key === 'ENTER') {

        sounds(
            'submit'
        );

        submitAnswer();

    }

}


function setupKeypad() {

    document
        .querySelectorAll(
            '.key[data-key]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        const key =
                            button.dataset.key;


                        keyPress(
                            key
                        );


                        button.classList.remove(
                            'pressed'
                        );

                        void button.offsetWidth;

                        button.classList.add(
                            'pressed'
                        );

                    }
                );

            }
        );

}


/*
============================================================
KEYBOARD
============================================================
*/

function setupKeyboard() {

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key >= '0' &&
                event.key <= '9'
            ) {

                keyPress(
                    event.key
                );

            }

            else if (
                event.key === 'Enter'
            ) {

                keyPress(
                    'ENTER'
                );

            }

            else if (
                event.key === 'Backspace'
            ) {

                if (
                    gameRunning &&
                    acceptingInput
                ) {

                    answer.value =
                        answer.value.slice(
                            0,
                            -1
                        );

                    sounds(
                        'clear'
                    );

                }

            }

            else if (
                event.key.toLowerCase() ===
                'c'
            ) {

                keyPress(
                    'C'
                );

            }

            else if (
                event.key === 'Escape'
            ) {

                window.back();

            }



        }
    );

}


/*
============================================================
COUNTDOWN
============================================================
*/

function countdown(callback) {

    const overlay =
        $('countdownOverlay');

    const numberEl =
        $('countdownNumber');


    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );

        countdownInterval =
            null;

    }


    overlay.classList.add(
        'show'
    );


    let number =
        3;


    numberEl.textContent =
        number;


    sounds(
        'countdown',
        number
    );


    countdownInterval =
        setInterval(
            () => {

                number--;


                if (
                    number > 0
                ) {

                    numberEl.textContent =
                        number;


                    numberEl.classList.remove(
                        'countdown-number'
                    );

                    void numberEl.offsetWidth;

                    numberEl.classList.add(
                        'countdown-number'
                    );


                    sounds(
                        'countdown',
                        number
                    );

                } else {

                    clearInterval(
                        countdownInterval
                    );

                    countdownInterval =
                        null;


                    numberEl.textContent =
                        'GO!';


                    sounds(
                        'countdown',
                        0
                    );


                    setTimeout(
                        () => {

                            overlay.classList.remove(
                                'show'
                            );


                            if (
                                gameRunning
                            ) {

                                callback();

                            }

                        },
                        450
                    );

                }

            },
            800
        );

}


/*
============================================================
START GAME
============================================================
*/

window.startGame =
    function () {

        if (countdownInterval) {

            clearInterval(
                countdownInterval
            );

            countdownInterval =
                null;

        }


        difficulty =
            getSelectedDifficulty();


        applyDifficulty(
            difficulty
        );


        const config =
            DIFFICULTIES[difficulty];


        totalTime =
            config.time;


        timeLeft =
            totalTime;


        score =
            0;


        combo =
            0;


        gameRunning =
            true;


        acceptingInput =
            false;


        updateHUD();


        gameOver.classList.remove(
            'show'
        );


        $('countdownOverlay')
            ?.classList.remove(
                'show'
            );


        landingScreen.classList.remove(
            'active'
        );


        leaderboardScreen.classList.remove(
            'active'
        );


        gameScreen.classList.add(
            'active'
        );


        sounds(
            'button'
        );


        countdown(
            () => {

                if (!gameRunning) {
                    return;
                }


                newQuestion();


                acceptingInput =
                    true;


                startTimer();


                sounds(
                    'start'
                );


                answer.focus();

            }
        );

    };


/*
============================================================
END GAME
============================================================
*/

function endGame() {

    if (!gameRunning) {
        return;
    }


    gameRunning =
        false;


    acceptingInput =
        false;


    stopTimer();


    sounds(
        'gameOver'
    );


    const tier =
        getTierData(score);


    finalScore.textContent =
        score;


    finalTier.textContent =
        tier.name;


    userScore.value =
        score;


    gameOver.classList.add(
        'show'
    );

}


/*
============================================================
SAVE SCORE
============================================================
*/

function setupScoreForm() {

    if (!scoreForm) {
        return;
    }


    scoreForm.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            const submitButton =
                scoreForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

            }


            try {

                const response =
                    await fetch(
                        api('/api/submit-score'),
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({

                                    name:
                                        $('name')
                                            .value,

                                    grade:
                                        $('grade')
                                            .value,

                                    section:
                                        $('section')
                                            .value,

                                    score:
                                        Number(
                                            $('userScore')
                                                .value
                                        )

                                })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    data.success === false
                ) {

                    throw new Error(
                        data.message ||
                        'Unable to save score.'
                    );

                }


                sounds(
                    'victory'
                );


                setTimeout(
                    () => {

                        window.location.reload();

                    },
                    250
                );


            } catch (error) {

                console.error(
                    error
                );


                alert(
                    error.message ||
                    'Unable to save your score.'
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                }

            }

        }
    );

}


/*
============================================================
DIFFICULTY EVENTS
============================================================
*/

function setupDifficulty() {

    document
        .querySelectorAll(
            'input[name="difficulty"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    'change',
                    () => {

                        applyDifficulty(
                            input.value
                        );

                        sounds(
                            'button'
                        );

                    }
                );

            }
        );


    applyDifficulty(
        difficulty
    );

}


/*
============================================================
INITIALIZE
============================================================
*/

function init() {

    setupDifficulty();

    setupKeypad();

    setupKeyboard();

    setupScoreForm();

    updateHUD();

    loadLeaderboard();

}


if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        init
    );

} else {

    init();

}

})();

`;


/*
====================================================================
SOUND SYSTEM
====================================================================
*/

const SOUND_HTML = `

<style>

#soundButton{
    position:fixed;
    right:18px;
    top:18px;
    z-index:9999;
    border:0;
    border-radius:50%;
    width:46px;
    height:46px;
    background:rgba(24,17,65,.82);
    color:#fff;
    font-size:21px;
    cursor:pointer;
    box-shadow:0 10px 30px rgba(0,0,0,.25);
}

.combo-explosion{
    position:fixed;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    pointer-events:none;
    z-index:80;
    font-family:'Fredoka One',cursive;
    color:#ffdf4f;
    font-size:32px;
    text-shadow:0 5px 0 #9e6a00;
    animation:comboExplosion .8s ease forwards;
}

@keyframes comboExplosion{

    0%{
        opacity:0;
        transform:
            translate(-50%,-50%)
            scale(.4);
    }

    25%{
        opacity:1;
        transform:
            translate(-50%,-50%)
            scale(1.2);
    }

    100%{
        opacity:0;
        transform:
            translate(-50%,-50%)
            scale(2);
    }

}

#dangerVignette{
    position:fixed;
    inset:0;
    pointer-events:none;
    z-index:20;
    opacity:0;
    transition:opacity .2s;
}

#dangerVignette.active{
    opacity:1;
    animation:
        dangerPulse
        .65s
        infinite
        alternate;
}

@keyframes dangerPulse{

    from{
        box-shadow:
            inset 0 0 50px 0
            rgba(255,72,110,0);
    }

    to{
        box-shadow:
            inset 0 0 70px 10px
            rgba(255,72,110,.38);
    }

}

.sound-shake{
    animation:soundShake .22s;
}

@keyframes soundShake{

    0%,100%{
        transform:translateX(0);
    }

    25%{
        transform:
            translateX(-4px)
            rotate(-.5deg);
    }

    75%{
        transform:
            translateX(4px)
            rotate(.5deg);
    }

}

#victoryFlash{
    position:fixed;
    inset:0;
    pointer-events:none;
    z-index:95;
    opacity:0;
    background:rgba(255,223,79,.22);
}

.sound-score-popup{
    position:fixed;
    left:50%;
    top:45%;
    transform:translate(-50%,-50%);
    pointer-events:none;
    z-index:85;
    font-family:'Fredoka One',cursive;
    color:#63f7ff;
    font-size:28px;
    animation:soundScore .65s ease forwards;
}

@keyframes soundScore{

    0%{
        opacity:0;
        transform:
            translate(-50%,0)
            scale(.7);
    }

    25%{
        opacity:1;
    }

    100%{
        opacity:0;
        transform:
            translate(-50%,-60px)
            scale(1);
    }

}

</style>


<button
    id="soundButton"
    type="button"
    aria-label="Toggle sound"
    title="Toggle sound"
>
    🔊
</button>

<div id="dangerVignette"></div>

<div id="victoryFlash"></div>


<script>

(() => {

'use strict';


let audioContext = null;
let masterGain = null;

let muted = false;

let lowTimeTimer = null;
let lowTimeActive = false;


const soundButton =
    document.getElementById(
        'soundButton'
    );


const dangerVignette =
    document.getElementById(
        'dangerVignette'
    );


const victoryFlash =
    document.getElementById(
        'victoryFlash'
    );


function initAudio() {

    if (!audioContext) {

        const AC =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AC) {
            return false;
        }


        audioContext =
            new AC();


        masterGain =
            audioContext.createGain();


        masterGain.gain.value =
            0.72;


        masterGain.connect(
            audioContext.destination
        );

    }


    if (
        audioContext.state ===
        'suspended'
    ) {

        audioContext
            .resume()
            .catch(() => {});

    }


    return true;

}


function oscillator(
    type,
    frequency,
    duration,
    volume = 0.15,
    when = 0,
    endFrequency = null
) {

    if (!initAudio()) {
        return;
    }


    const now =
        audioContext.currentTime +
        when;


    const osc =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    osc.type =
        type;


    osc.frequency.setValueAtTime(
        frequency,
        now
    );


    if (
        endFrequency !== null
    ) {

        osc.frequency
            .exponentialRampToValueAtTime(
                Math.max(
                    1,
                    endFrequency
                ),
                now + duration
            );

    }


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain
        .exponentialRampToValueAtTime(
            Math.max(
                0.0001,
                volume
            ),
            now + 0.01
        );


    gain.gain
        .exponentialRampToValueAtTime(
            0.0001,
            now + duration
        );


    osc.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    osc.start(
        now
    );


    osc.stop(
        now +
        duration +
        0.03
    );

}


function noise(
    duration = 0.12,
    volume = 0.06,
    when = 0
) {

    if (!initAudio()) {
        return;
    }


    const bufferSize =
        Math.max(
            1,
            Math.floor(
                audioContext.sampleRate *
                duration
            )
        );


    const buffer =
        audioContext.createBuffer(
            1,
            bufferSize,
            audioContext.sampleRate
        );


    const data =
        buffer.getChannelData(
            0
        );


    for (
        let i = 0;
        i < bufferSize;
        i++
    ) {

        data[i] =
            Math.random() * 2 - 1;

    }


    const source =
        audioContext
            .createBufferSource();


    const filter =
        audioContext
            .createBiquadFilter();


    const gain =
        audioContext
            .createGain();


    const now =
        audioContext.currentTime +
        when;


    filter.type =
        'highpass';


    filter.frequency.value =
        800;


    gain.gain.setValueAtTime(
        0.0001,
        now
    );


    gain.gain
        .exponentialRampToValueAtTime(
            volume,
            now + 0.01
        );


    gain.gain
        .exponentialRampToValueAtTime(
            0.0001,
            now + duration
        );


    source.buffer =
        buffer;


    source.connect(
        filter
    );


    filter.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    source.start(
        now
    );


    source.stop(
        now +
        duration +
        0.03
    );

}


function visualShake() {

    document.body.classList.remove(
        'sound-shake'
    );

    void document.body.offsetWidth;

    document.body.classList.add(
        'sound-shake'
    );

}


function buttonClick() {

    oscillator(
        'square',
        440,
        0.045,
        0.06
    );

    oscillator(
        'sine',
        660,
        0.06,
        0.05,
        0.02
    );

}


function correct(combo = 0) {

    oscillator(
        'sine',
        523,
        0.11,
        0.12
    );

    oscillator(
        'sine',
        659,
        0.11,
        0.12,
        0.075
    );

    oscillator(
        'sine',
        784,
        0.15,
        0.15,
        0.15
    );


    if (combo >= 3) {

        oscillator(
            'triangle',
            1046,
            0.16,
            0.08,
            0.22
        );

        oscillator(
            'triangle',
            1318,
            0.18,
            0.06,
            0.28
        );

    }


    if (combo >= 5) {

        oscillator(
            'sine',
            1568,
            0.20,
            0.10,
            0.33
        );

        flashCorrect();


        if (
            combo % 5 === 0
        ) {

            visualShake();

        }

    }

}


function wrong() {

    oscillator(
        'sawtooth',
        180,
        0.18,
        0.13,
        0,
        90
    );

    oscillator(
        'square',
        95,
        0.22,
        0.10,
        0.03,
        65
    );

    noise(
        0.13,
        0.045
    );

    visualShake();

}


function clear() {

    oscillator(
        'sine',
        320,
        0.10,
        0.08,
        0,
        170
    );

}


function submit() {

    oscillator(
        'square',
        700,
        0.05,
        0.06
    );

    oscillator(
        'square',
        950,
        0.07,
        0.05,
        0.045
    );

}


function countdown(number) {

    if (number === 3) {

        oscillator(
            'sine',
            440,
            0.18,
            0.12
        );

    }

    else if (number === 2) {

        oscillator(
            'sine',
            520,
            0.18,
            0.12
        );

    }

    else if (number === 1) {

        oscillator(
            'sine',
            620,
            0.18,
            0.14
        );

    }

    else {

        oscillator(
            'triangle',
            660,
            0.12,
            0.13
        );

        oscillator(
            'triangle',
            880,
            0.18,
            0.16,
            0.08
        );

        oscillator(
            'triangle',
            1320,
            0.22,
            0.14,
            0.18
        );

    }

}


function lowTime() {

    if (lowTimeActive) {
        return;
    }


    lowTimeActive =
        true;


    if (dangerVignette) {

        dangerVignette.classList.add(
            'active'
        );

    }


    const beat = () => {

        oscillator(
            'sine',
            92,
            0.16,
            0.08
        );

        oscillator(
            'sine',
            72,
            0.18,
            0.05,
            0.10
        );

    };


    beat();


    lowTimeTimer =
        setInterval(
            beat,
            650
        );

}


function stopLowTime() {

    lowTimeActive =
        false;


    if (lowTimeTimer) {

        clearInterval(
            lowTimeTimer
        );

        lowTimeTimer =
            null;

    }


    if (dangerVignette) {

        dangerVignette.classList.remove(
            'active'
        );

    }

}


function gameOverSound() {

    stopLowTime();


    oscillator(
        'sawtooth',
        420,
        0.20,
        0.13,
        0,
        150
    );

    oscillator(
        'sawtooth',
        260,
        0.25,
        0.11,
        0.18,
        85
    );

    oscillator(
        'square',
        120,
        0.30,
        0.10,
        0.40,
        55
    );


    visualShake();

}


function flashCorrect() {

    const flash =
        document.getElementById(
            'soundFlash'
        );


    if (!flash) {
        return;
    }


    flash.style.background =
        'rgba(124,255,97,.16)';


    flash.style.opacity =
        '1';


    setTimeout(
        () => {

            flash.style.opacity =
                '0';

        },
        120
    );

}


function victory() {

    oscillator(
        'triangle',
        523,
        0.14,
        0.11
    );

    oscillator(
        'triangle',
        659,
        0.14,
        0.11,
        0.10
    );

    oscillator(
        'triangle',
        784,
        0.16,
        0.13,
        0.20
    );

    oscillator(
        'triangle',
        1046,
        0.20,
        0.15,
        0.32
    );


    if (victoryFlash) {

        victoryFlash.style.opacity =
            '1';


        setTimeout(
            () => {

                victoryFlash.style.opacity =
                    '0';

            },
            180
        );

    }


    visualShake();

}


function score(text = '') {

    oscillator(
        'sine',
        700,
        0.08,
        0.06
    );

    oscillator(
        'sine',
        980,
        0.12,
        0.06,
        0.05
    );


    if (text) {

        const popup =
            document.createElement(
                'div'
            );


        popup.className =
            'sound-score-popup';


        popup.textContent =
            text;


        document.body.appendChild(
            popup
        );


        setTimeout(
            () =>
                popup.remove(),
            650
        );

    }

}


function combo(value = 0) {

    oscillator(
        'triangle',
        660,
        0.12,
        0.08
    );

    oscillator(
        'triangle',
        990,
        0.14,
        0.09,
        0.08
    );

    oscillator(
        'triangle',
        1320,
        0.16,
        0.10,
        0.16
    );


    if (value >= 3) {

        const popup =
            document.createElement(
                'div'
            );


        popup.className =
            'combo-explosion';


        popup.textContent =
            '🔥 COMBO x' +
            value +
            ' 🔥';


        document.body.appendChild(
            popup
        );


        setTimeout(
            () =>
                popup.remove(),
            800
        );

    }

}


function mute() {

    if (
        !initAudio() ||
        !masterGain
    ) {
        return;
    }


    muted =
        !muted;


    masterGain.gain.value =
        muted
            ? 0
            : 0.72;


    if (soundButton) {

        soundButton.textContent =
            muted
                ? '🔇'
                : '🔊';

    }

}


function unlockAudio() {

    initAudio();

}


window.ClashSounds = {

    init:
        unlockAudio,

    button:
        buttonClick,

    correct:
        correct,

    wrong:
        wrong,

    clear:
        clear,

    submit:
        submit,

    start:
        unlockAudio,

    countdown:
        countdown,

    lowTime:
        lowTime,

    stopLowTime:
        stopLowTime,

    gameOver:
        gameOverSound,

    victory:
        victory,

    score:
        score,

    combo:
        combo,

    mute:
        mute

};


if (soundButton) {

    soundButton.addEventListener(
        'click',
        () => {

            initAudio();

            mute();

        }
    );

}


document.addEventListener(
    'pointerdown',
    unlockAudio,
    {
        once: true
    }
);


document.addEventListener(
    'keydown',
    unlockAudio,
    {
        once: true
    }
);


})();

</script>

`;


/*
====================================================================
CSS
====================================================================
*/

const GAME_CSS = `

*{
    box-sizing:border-box;
    margin:0;
    padding:0;
}

html,
body{
    width:100%;
    min-height:100%;
}

body{
    min-height:100vh;
    overflow-x:hidden;
    font-family:'Nunito',sans-serif;
    background:
        radial-gradient(
            circle at top left,
            #32156e 0%,
            #180d3e 40%,
            #0d0926 100%
        );
    color:#fff;
}

.background{
    position:fixed;
    inset:0;
    overflow:hidden;
    pointer-events:none;
    z-index:0;
}

.background::before{
    content:"";
    position:absolute;
    inset:0;
    background:
        linear-gradient(
            rgba(255,255,255,.025) 1px,
            transparent 1px
        ),
        linear-gradient(
            90deg,
            rgba(255,255,255,.025) 1px,
            transparent 1px
        );
    background-size:50px 50px;
}

.orb{
    position:absolute;
    border-radius:50%;
    filter:blur(50px);
    opacity:.35;
}

.orb.one{
    width:420px;
    height:420px;
    background:#7028d9;
    top:-120px;
    left:-100px;
}

.orb.two{
    width:360px;
    height:360px;
    background:#0969a9;
    right:-80px;
    top:30%;
}

.orb.three{
    width:300px;
    height:300px;
    background:#a11691;
    bottom:-100px;
    left:40%;
}

.particle{
    position:absolute;
    bottom:-20px;
    width:4px;
    height:4px;
    border-radius:50%;
    background:#fff;
    opacity:.4;
    animation:
        particleFloat
        linear
        infinite;
}

@keyframes particleFloat{

    from{
        transform:translateY(0);
        opacity:0;
    }

    10%{
        opacity:.4;
    }

    90%{
        opacity:.4;
    }

    to{
        transform:translateY(-110vh);
        opacity:0;
    }

}

.app{
    position:relative;
    z-index:1;
    width:100%;
    min-height:100vh;
}

.screen{
    position:absolute;
    inset:0;
    min-height:100vh;
    display:none;
    align-items:center;
    justify-content:center;
    padding:30px;
}

.screen.active{
    display:flex;
}

.landing{
    width:min(900px,96vw);
    text-align:center;
}

.logo{
    width:110px;
    height:110px;
    object-fit:contain;
    margin-bottom:18px;
    filter:
        drop-shadow(
            0 15px 30px
            rgba(0,0,0,.4)
        );
}

.game-title{
    font-family:'Fredoka One',cursive;
    font-size:clamp(44px,8vw,88px);
    line-height:.9;
    letter-spacing:2px;
    text-shadow:
        0 5px 0 #54218f,
        0 15px 35px rgba(0,0,0,.4);
}

.subtitle{
    margin-top:18px;
    font-size:14px;
    letter-spacing:6px;
    color:#d7c5eb;
    font-weight:900;
}

.difficulty-panel{
    margin:28px auto 0;
    width:min(760px,94vw);
}

.difficulty-heading{
    font-family:'Fredoka One',cursive;
    font-size:15px;
    letter-spacing:3px;
    margin-bottom:14px;
    color:#ffdf4f;
}

.difficulty-options{
    display:grid;
    grid-template-columns:
        repeat(4,1fr);
    gap:10px;
}

.difficulty-option{
    cursor:pointer;
    padding:15px 10px;
    border-radius:16px;
    background:
        rgba(255,255,255,.07);
    border:
        2px solid
        rgba(255,255,255,.10);
    transition:.15s;
}

.difficulty-option input{
    display:none;
}

.difficulty-option:has(
    input:checked
){
    background:
        rgba(255,223,79,.13);
    border-color:#ffdf4f;
    transform:translateY(-2px);
    box-shadow:
        0 8px 22px
        rgba(255,223,79,.12);
}

.difficulty-name{
    display:block;
    font-family:'Fredoka One',cursive;
    font-size:17px;
}

.difficulty-name.easy{
    color:#7cff61;
}

.difficulty-name.normal{
    color:#63f7ff;
}

.difficulty-name.hard{
    color:#ffdf4f;
}

.difficulty-name.extreme{
    color:#ff4d63;
}

.difficulty-desc{
    display:block;
    margin-top:4px;
    font-size:9px;
    color:#cdb5df;
}

.menu{
    margin-top:30px;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:12px;
}

.btn{
    border:0;
    border-radius:18px;
    padding:16px 30px;
    min-width:270px;
    font-family:'Nunito',sans-serif;
    font-weight:900;
    font-size:15px;
    letter-spacing:1px;
    cursor:pointer;
    transition:
        transform .15s,
        box-shadow .15s;
}

.btn:hover{
    transform:translateY(-2px);
}

.btn-primary{
    background:
        linear-gradient(
            135deg,
            #ffdf4f,
            #ff9e3d
        );
    color:#351557;
    box-shadow:
        0 12px 30px
        rgba(255,174,68,.25);
}

.btn-secondary{
    background:
        rgba(255,255,255,.08);
    color:#fff;
    border:
        1px solid
        rgba(255,255,255,.15);
}

.game-card{
    width:min(1000px,96vw);
    min-height:min(900px,94vh);
    border-radius:28px;
    background:
        rgba(20,12,55,.88);
    border:
        1px solid
        rgba(255,255,255,.12);
    box-shadow:
        0 30px 80px
        rgba(0,0,0,.45);
    overflow:hidden;
    display:flex;
    flex-direction:column;
}

.game-header{
    padding:24px 28px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:20px;
    border-bottom:
        1px solid
        rgba(255,255,255,.08);
}

.brand{
    display:flex;
    align-items:center;
    gap:14px;
}

.brand img{
    width:50px;
    height:50px;
    object-fit:contain;
}

.brand-name{
    font-family:'Fredoka One',cursive;
    font-size:18px;
}

.brand-sub{
    font-size:10px;
    color:#c7b7d9;
    letter-spacing:2px;
}

.game-difficulty{
    display:inline-block;
    margin-top:6px;
    padding:3px 9px;
    border-radius:10px;
    background:
        rgba(255,223,79,.13);
    color:#ffdf4f;
    font-size:9px;
    font-weight:900;
    letter-spacing:1px;
}

.hud{
    display:flex;
    align-items:center;
    gap:8px;
}

.hud-box{
    min-width:76px;
    padding:9px 12px;
    border-radius:12px;
    text-align:center;
    background:
        rgba(255,255,255,.06);
}

.hud-label{
    display:block;
    font-size:8px;
    color:#b9a6cb;
    letter-spacing:1px;
}

.hud-value{
    display:block;
    margin-top:2px;
    font-weight:900;
    font-size:17px;
}

.tier-badge{
    padding:10px 13px;
    border-radius:13px;
    text-align:center;
    background:
        rgba(255,255,255,.06);
}

.tier-label{
    display:block;
    font-size:7px;
    color:#b9a6cb;
}

.tier-badge span:last-child{
    font-family:'Fredoka One',cursive;
    font-size:12px;
}

.tier-bronze{
    color:#cd8b54;
}

.tier-silver{
    color:#d9e2ef;
}

.tier-gold{
    color:#ffdf4f;
}

.tier-platinum{
    color:#63f7ff;
}

.tier-diamond{
    color:#c47cff;
}

.rival-bar{
    padding:10px 20px;
    text-align:center;
    background:
        rgba(255,255,255,.035);
    border-bottom:
        1px solid
        rgba(255,255,255,.06);
}

.rival-text{
    color:#cdb5df;
    font-size:10px;
    font-weight:900;
    letter-spacing:1px;
}

.rival-bar.beaten .rival-text{
    color:#7cff61;
}

.time-container{
    padding:10px 28px 0;
}

.time-track{
    width:100%;
    height:7px;
    border-radius:20px;
    overflow:hidden;
    background:
        rgba(255,255,255,.07);
}

.time-bar{
    width:100%;
    height:100%;
    border-radius:20px;
    background:
        linear-gradient(
            90deg,
            #7cff61,
            #ffdf4f,
            #ff4d63
        );
    transition:width .12s linear;
}

.game-content{
    flex:1;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    padding:30px;
}

.solve-label{
    font-size:12px;
    letter-spacing:4px;
    color:#bda9d1;
    font-weight:900;
}

#equation{
    margin-top:20px;
    font-family:'Fredoka One',cursive;
    font-size:clamp(42px,8vw,76px);
    text-shadow:
        0 6px 0 #54218f,
        0 12px 30px rgba(0,0,0,.35);
}

#equation.flash{
    animation:
        equationFlash
        .3s ease;
}

@keyframes equationFlash{

    0%{
        transform:scale(.94);
        opacity:.4;
    }

    100%{
        transform:scale(1);
        opacity:1;
    }

}

.answer-wrapper{
    margin-top:25px;
}

#answer{
    width:260px;
    height:70px;
    border-radius:18px;
    border:3px solid
        rgba(255,255,255,.15);
    background:
        rgba(255,255,255,.07);
    color:#fff;
    text-align:center;
    font-family:'Fredoka One',cursive;
    font-size:36px;
    outline:none;
}

#answer.correct{
    border-color:#7cff61;
    box-shadow:
        0 0 30px
        rgba(124,255,97,.3);
}

#answer.wrong{
    border-color:#ff4d63;
    box-shadow:
        0 0 30px
        rgba(255,77,99,.3);
}

.keypad{
    width:min(420px,90vw);
    margin-top:25px;
    display:grid;
    grid-template-columns:
        repeat(3,1fr);
    gap:10px;
}

.key{
    height:62px;
    border:0;
    border-radius:15px;
    background:
        rgba(255,255,255,.08);
    color:#fff;
    font-family:'Nunito',sans-serif;
    font-size:22px;
    font-weight:900;
    cursor:pointer;
    transition:
        transform .08s,
        background .08s;
}

.key:hover{
    background:
        rgba(255,255,255,.13);
}

.key.pressed{
    transform:scale(.94);
}

.key.clear{
    color:#ffdf4f;
}

.key.submit{
    background:
        linear-gradient(
            135deg,
            #7b42d6,
            #b14fd4
        );
}

.game-footer{
    padding:18px 24px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    border-top:
        1px solid
        rgba(255,255,255,.08);
}

.footer-button{
    border:0;
    background:transparent;
    color:#cdb5df;
    font-weight:900;
    cursor:pointer;
}

.controls{
    font-size:8px;
    color:#8f7da3;
    letter-spacing:1px;
}

.time-bonus{
    position:fixed;
    left:50%;
    top:40%;
    transform:
        translate(-50%,-50%);
    pointer-events:none;
    z-index:80;
    font-family:'Fredoka One',cursive;
    color:#7cff61;
    font-size:28px;
    animation:
        timeBonus
        .75s
        ease
        forwards;
}

@keyframes timeBonus{

    0%{
        opacity:0;
        transform:
            translate(-50%,0)
            scale(.7);
    }

    20%{
        opacity:1;
    }

    100%{
        opacity:0;
        transform:
            translate(-50%,-70px)
            scale(1);
    }

}

.leader-card{
    width:min(900px,96vw);
    max-height:92vh;
    overflow:auto;
    padding:35px;
    border-radius:28px;
    background:
        rgba(20,12,55,.90);
    border:
        1px solid
        rgba(255,255,255,.12);
    box-shadow:
        0 30px 80px
        rgba(0,0,0,.45);
}

.leader-title{
    font-family:'Fredoka One',cursive;
    text-align:center;
    font-size:42px;
}

.leader-sub{
    text-align:center;
    margin-top:4px;
    color:#cdb5df;
    font-size:12px;
    letter-spacing:3px;
}

.weekly-status{
    margin:20px auto;
    width:max-content;
    padding:8px 14px;
    border-radius:20px;
    background:
        rgba(124,255,97,.08);
    color:#7cff61;
    font-size:9px;
    font-weight:900;
    letter-spacing:2px;
}

.leader-list{
    display:flex;
    flex-direction:column;
    gap:8px;
}

.leader-row{
    display:grid;
    grid-template-columns:
        65px minmax(0,1fr) minmax(150px,auto) 110px;
    align-items:center;
    gap:12px;
    padding:15px;
    border-radius:15px;
    background:
        rgba(255,255,255,.055);
}

.rank{
    font-family:'Fredoka One',cursive;
    color:#ffdf4f;
    font-size:18px;
}

.player-name{
    font-weight:900;
    min-width:0;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
}

.player-details{
    margin-top:3px;
    color:#9f8bad;
    font-size:10px;
    line-height:1.35;
    white-space:normal;
    overflow-wrap:anywhere;
    word-break:normal;
}

.detail-separator{
    margin:0 4px;
}

.player-score{
    text-align:right;
    font-family:'Fredoka One',cursive;
    font-size:23px;
    white-space:nowrap;
}

.leader-tier{
    text-align:center;
    font-size:9px;
    font-weight:900;
    letter-spacing:1px;
}

.leader-empty{
    text-align:center;
    padding:60px;
    color:#c3a7d9;
}

.leader-footer{
    display:flex;
    justify-content:center;
    margin-top:25px;
}

.overlay{
    position:fixed;
    inset:0;
    z-index:100;
    display:none;
    align-items:center;
    justify-content:center;
    padding:20px;
    background:
        rgba(5,2,20,.78);
    backdrop-filter:blur(10px);
}

.overlay.show{
    display:flex;
}

.game-over{
    width:min(500px,94vw);
    padding:35px;
    border-radius:28px;
    text-align:center;
    background:
        linear-gradient(
            145deg,
            #271153,
            #130a31
        );
    border:
        1px solid
        rgba(255,255,255,.14);
    box-shadow:
        0 30px 80px
        rgba(0,0,0,.55);
}

.game-over h2{
    font-family:'Fredoka One',cursive;
    font-size:38px;
    color:#ffdf4f;
}

.final-label{
    margin-top:15px;
    font-size:10px;
    letter-spacing:3px;
    color:#bda9d1;
}

.final-score{
    margin-top:5px;
    font-family:'Fredoka One',cursive;
    font-size:65px;
}

.final-tier{
    font-family:'Fredoka One',cursive;
    color:#63f7ff;
    letter-spacing:2px;
}

.name-input{
    width:100%;
    height:50px;
    margin-top:10px;
    padding:0 16px;
    border-radius:13px;
    border:1px solid
        rgba(255,255,255,.12);
    background:
        rgba(255,255,255,.07);
    color:#fff;
    outline:none;
    font-family:'Nunito',sans-serif;
    font-weight:800;
}

.game-over-buttons{
    display:flex;
    justify-content:center;
    gap:10px;
    margin-top:18px;
}

.game-over-buttons .btn{
    min-width:0;
    padding:13px 18px;
}

.countdown-overlay{
    position:fixed;
    inset:0;
    z-index:90;
    display:none;
    align-items:center;
    justify-content:center;
    background:
        rgba(5,2,20,.70);
    backdrop-filter:blur(5px);
}

.countdown-overlay.show{
    display:flex;
}

.countdown-number{
    font-family:'Fredoka One',cursive;
    font-size:
        clamp(100px,20vw,220px);
    color:#ffdf4f;
    text-shadow:
        0 10px 0 #9e6a00,
        0 25px 60px rgba(0,0,0,.5);
    animation:
        countdownPop
        .8s
        ease;
}

@keyframes countdownPop{

    0%{
        transform:scale(.3);
        opacity:0;
    }

    30%{
        opacity:1;
    }

    100%{
        transform:scale(1);
        opacity:1;
    }

}

@media(max-width:700px){

    .screen{
        padding:12px;
    }

    .logo{
        width:80px;
        height:80px;
    }

    .game-title{
        font-size:44px;
    }

    .subtitle{
        font-size:10px;
        letter-spacing:3px;
    }

    .difficulty-options{
        grid-template-columns:
            repeat(2,1fr);
    }

    .game-header{
        padding:15px;
        flex-direction:column;
        align-items:stretch;
    }

    .hud{
        justify-content:center;
        flex-wrap:wrap;
    }

    .hud-box{
        min-width:65px;
    }

    .game-card{
        min-height:96vh;
        border-radius:20px;
    }

    .game-content{
        padding:15px;
    }

    #equation{
        font-size:43px;
    }

    #answer{
        width:220px;
        height:62px;
    }

    .game-footer{
        padding:14px;
    }

    .controls{
        display:none;
    }

    .leader-card{
        padding:20px;
    }

    .leader-title{
        font-size:32px;
    }

.leader-row{
    grid-template-columns:
        40px minmax(0,1fr) 70px;
}

.leader-tier{
    display:none;
}

.player-name{
    white-space:normal;
    overflow:visible;
    text-overflow:clip;
}

.player-details{
    white-space:normal;
    overflow-wrap:anywhere;
    word-break:normal;
}

.player-score{
    font-size:18px;
    white-space:nowrap;
}

    .game-over{
        padding:25px;
    }

    .game-over-buttons{
        flex-direction:column;
    }

    .game-over-buttons .btn{
        width:100%;
    }

}

`;