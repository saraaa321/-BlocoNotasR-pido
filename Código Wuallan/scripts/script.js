// Espera todo o HTML da página carregar antes de executar o script.
document.addEventListener("DOMContentLoaded", () => {
  // Função principal que chama todas as outras para inicializar os widgets.
  function initializeDashboard() {
    initWeatherWidget();
    initNotepadWidget();
    initClockWidget();
    initMapWidget();
    initCalculatorWidget();
    initDrawingWidget();
    initTicTacToeWidget();
    initTodoWidget();
  }

  //-----------------------------------------------------
  // WIDGET DE CLIMA (usa API real: OpenWeatherMap)
  //-----------------------------------------------------
  function initWeatherWidget() {
    const container = document.querySelector("#widget-weather .widget-content");
    if (!container) return; // Se o elemento não existir, para a função.

    const apiKey = "91379a7cc54f258da003117351303652";

    async function fetchWeather(city = "Osvaldo Cruz") {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Cidade não encontrada");
        const data = await response.json();

        // Insere o HTML com os dados do clima no container.
        container.innerHTML = `<div class="widget-weather-container"><div class="weather-main"><span class="temp">${Math.round(
          data.main.temp
        )}°</span></div><div class="weather-alert">${
          data.weather[0].description
        } em ${data.name}</div></div>`;
      } catch (error) {
        container.innerHTML = `<p>${error.message}</p>`;
      }
    }
    fetchWeather(); // Chama a função para buscar o clima.
  }

  //-----------------------------------------------------
  // WIDGET DE BLOCO DE NOTAS (usa API simulada: localStorage)
  //-----------------------------------------------------
  function initNotepadWidget() {
    const container = document.getElementById("widget-notepad");
    if (!container) return;

    // Insere o HTML base do widget.
    container.innerHTML = `<h3><i class="fas fa-sticky-note"></i> Bloco de Notas</h3><div class="widget-content"><textarea class="notepad-textarea" placeholder="Suas anotações rápidas aqui..."></textarea></div>`;

    const textarea = container.querySelector(".notepad-textarea");

    // Ao carregar, busca o texto salvo no localStorage.
    textarea.value = localStorage.getItem("notepadContent") || "";

    // Adiciona um "ouvinte" que salva o texto no localStorage toda vez que o usuário digita algo.
    textarea.addEventListener("input", () => {
      localStorage.setItem("notepadContent", textarea.value);
    });
  }

  //-----------------------------------------------------
  // WIDGET DE RELÓGIO E CALENDÁRIO (usa API real: WorldTimeAPI)
  //-----------------------------------------------------
  function initClockWidget() {
    const container = document.getElementById("widget-clock");
    if (!container) return;

    // Insere o HTML base do widget.
    container.innerHTML = `<div class="widget-content widget-clock-wrapper"><div class="clock-top-row"><div class="calendar-container"><div class="calendar-header"></div><div class="calendar-grid"></div></div><div class="analog-clock-container"><div class="analog-clock"><div class="hand hour-hand"></div><div class="hand minute-hand"></div><div class="hand second-hand"></div><div class="clock-center"></div></div></div></div><div class="clock-bottom-row"><div class="full-date"></div><div class="digital-time"></div></div></div>`;

    // Adiciona os números ao redor do relógio analógico.
    const analogClock = container.querySelector(".analog-clock");
    for (let i = 1; i <= 12; i++) {
      const angle = i * 30; // 360 graus / 12 horas = 30 graus por hora
      const numberDiv = document.createElement("div");
      numberDiv.className = "clock-number";
      numberDiv.textContent = i;
      // Usa matemática (seno e cosseno) para posicionar os números em um círculo.
      numberDiv.style.left = `calc(50% + ${
        40 * Math.sin((angle * Math.PI) / 180)
      }%)`;
      numberDiv.style.top = `calc(50% - ${
        40 * Math.cos((angle * Math.PI) / 180)
      }%)`;
      analogClock.appendChild(numberDiv);
    }

    // Tenta buscar a hora da API. Se falhar, usa a hora local.
    async function initializeTime() {
      try {
        const response = await fetch("https://worldtimeapi.org/api/ip");
        if (!response.ok) throw new Error("API falhou");
        const data = await response.json();
        // Calcula a diferença entre a hora do servidor e a local.
        const timeOffset = new Date(data.datetime).getTime() - Date.now();
        startClocks(container, timeOffset);
      } catch (error) {
        console.warn(
          "API de tempo falhou, usando hora local como fallback.",
          error
        );
        startClocks(container, 0); // Offset zero significa usar a hora local.
      }
    }

    // Inicia o calendário e o loop de atualização do relógio.
    function startClocks(widget, offset) {
      const now = new Date(Date.now() + offset);
      initCalendar(widget, now); // Desenha o calendário uma vez.

      const update = () => updateClocks(widget, offset);
      update(); // Chama a primeira atualização imediatamente.
      setInterval(update, 1000); // Repete a cada segundo.
    }
    initializeTime();
  }

  // Função auxiliar que desenha o calendário.
  function initCalendar(container, date) {
    const year = date.getFullYear(),
      month = date.getMonth();
    const header = container.querySelector(".calendar-header"),
      grid = container.querySelector(".calendar-grid");
    if (header)
      header.textContent = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ][month];
    if (!grid) return;
    grid.innerHTML = "";
    ["M", "T", "W", "T", "F", "S", "S"].forEach((d) => {
      grid.innerHTML += `<span class="day-name">${d}</span>`;
    });
    const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++)
      grid.innerHTML += `<span class="day other-month"></span>`;
    for (let i = 1; i <= daysInMonth; i++)
      grid.innerHTML += `<span class="day ${
        i === date.getDate() ? "today" : ""
      }">${i}</span>`;
  }

  // Função auxiliar que atualiza os ponteiros e textos do relógio.
  function updateClocks(container, offset) {
    const now = new Date(Date.now() + offset);
    const hh = container.querySelector(".hour-hand"),
      mh = container.querySelector(".minute-hand"),
      sh = container.querySelector(".second-hand");
    const fde = container.querySelector(".full-date"),
      dte = container.querySelector(".digital-time");
    if (!hh) return;
    const s = now.getSeconds(),
      m = now.getMinutes(),
      h = now.getHours();
    sh.style.transform = `rotate(${(s / 60) * 360 + 90}deg)`;
    mh.style.transform = `rotate(${(m / 60) * 360 + (s / 60) * 6 + 90}deg)`;
    hh.style.transform = `rotate(${(h / 12) * 360 + (m / 60) * 30 + 90}deg)`;
    fde.textContent = now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dte.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  //-----------------------------------------------------
  // WIDGET DE MAPA (usa API real: OpenStreetMap)
  //-----------------------------------------------------
  function initMapWidget() {
    const container = document.getElementById("widget-map");
    if (!container) return;
    container.innerHTML = `<h3>Se Localize!</h3><div class="widget-content"><div id="map-container"></div></div>`;

    // setTimeout garante que o div do mapa já existe na tela antes de inicializá-lo.
    setTimeout(() => {
      const map = L.map("map-container").setView([-23.5505, -46.6333], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        map
      );

      // Pede a localização do usuário ao navegador.
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude,
          lon = position.coords.longitude;
        map.setView([lat, lon], 15);
        L.marker([lat, lon]).addTo(map);
      });
    }, 100);
  }

  //-----------------------------------------------------
  // WIDGET DE CALCULADORA (usa lógica interna)
  //-----------------------------------------------------
  function initCalculatorWidget() {
    const container = document.getElementById("widget-calculator");
    if (!container) return;
    container.innerHTML = `<h3>Calculadora</h3><div class="widget-content calculator-grid"><div class="calculator-display">0</div><button class="calc-btn">7</button><button class="calc-btn">8</button><button class="calc-btn">9</button><button class="calc-btn operator">/</button><button class="calc-btn">4</button><button class="calc-btn">5</button><button class="calc-btn">6</button><button class="calc-btn operator">*</button><button class="calc-btn">1</button><button class="calc-btn">2</button><button class="calc-btn">3</button><button class="calc-btn operator">-</button><button class="calc-btn zero">0</button><button class="calc-btn">.</button><button class="calc-btn equals">=</button><button class="calc-btn operator">+</button><button class="calc-btn clear">C</button></div>`;

    const display = container.querySelector(".calculator-display");
    let currentInput = "0",
      previousInput = null,
      operator = null;

    container.querySelectorAll(".calc-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.textContent;
        if (!isNaN(value) || value === ".") {
          // Se for número ou ponto
          if (operator && !previousInput) {
            previousInput = currentInput;
            currentInput = "";
          }
          currentInput = currentInput === "0" ? value : currentInput + value;
        } else if (["+", "-", "*", "/"].includes(value)) {
          // Se for operador
          operator = value;
          previousInput = currentInput;
          currentInput = "0";
        } else if (value === "=") {
          // Se for igual
          if (previousInput && operator) {
            currentInput = String(
              eval(`${previousInput} ${operator} ${currentInput}`)
            );
            operator = null;
            previousInput = null;
          }
        } else if (value === "C") {
          // Se for Limpar
          currentInput = "0";
          operator = null;
          previousInput = null;
        }
        display.textContent = currentInput;
      });
    });
  }

  //-----------------------------------------------------
  // WIDGET DE QUADRO DE DESENHO (usa lógica interna)
  //-----------------------------------------------------
  function initDrawingWidget() {
    const container = document.getElementById("widget-drawing");
    if (!container) return;
    container.innerHTML = `<h3>Quadro de Desenho</h3><div class="widget-content"><canvas class="drawing-canvas"></canvas><div class="drawing-controls"><input type="color" class="color-picker" value="#000000"><input type="range" class="line-width" min="1" max="20" value="5"><button class="clear-canvas">Limpar</button></div></div>`;

    const canvas = container.querySelector(".drawing-canvas");
    const ctx = canvas.getContext("2d");
    const colorPicker = container.querySelector(".color-picker");
    const lineWidth = container.querySelector(".line-width");
    let isDrawing = false,
      lastX = 0,
      lastY = 0;

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("mousedown", (e) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    canvas.addEventListener("mousemove", (e) => {
      if (!isDrawing) return;
      ctx.strokeStyle = colorPicker.value;
      ctx.lineWidth = lineWidth.value;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    canvas.addEventListener("mouseup", () => (isDrawing = false));
    canvas.addEventListener("mouseout", () => (isDrawing = false));
    container.querySelector(".clear-canvas").addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  //-----------------------------------------------------
  // WIDGET DE JOGO DA VELHA (usa lógica interna)
  //-----------------------------------------------------
  function initTicTacToeWidget() {
    const container = document.getElementById("widget-tictactoe");
    if (!container) return;
    container.innerHTML = `<h3>Jogo da Velha</h3><div class="widget-content"><div><div class="tictactoe-status"></div><div class="tictactoe-grid">${Array(
      9
    )
      .fill("")
      .map((_, i) => `<div class="cell" data-index="${i}"></div>`)
      .join(
        ""
      )}</div></div><button class="tictactoe-reset">Reiniciar</button></div>`;

    const cells = container.querySelectorAll(".cell");
    const statusDisplay = container.querySelector(".tictactoe-status");
    const resetButton = container.querySelector(".tictactoe-reset");
    let currentPlayer, board, isActive;

    function startGame() {
      currentPlayer = "X";
      board = Array(9).fill("");
      isActive = true;
      statusDisplay.textContent = `Vez do Jogador ${currentPlayer}`;
      cells.forEach((cell) => (cell.textContent = ""));
    }

    function handleCellClick(e) {
      const index = e.target.dataset.index;
      if (board[index] !== "" || !isActive) return;

      board[index] = currentPlayer;
      e.target.textContent = currentPlayer;

      checkWinner();
    }

    function checkWinner() {
      const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];
      let roundWon = false;
      for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          roundWon = true;
          break;
        }
      }

      if (roundWon) {
        statusDisplay.textContent = `${currentPlayer} Venceu!`;
        isActive = false;
      } else if (!board.includes("")) {
        statusDisplay.textContent = "Empate!";
        isActive = false;
      } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        statusDisplay.textContent = `Vez do Jogador ${currentPlayer}`;
      }
    }

    cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
    resetButton.addEventListener("click", startGame);
    startGame();
  }

  //-----------------------------------------------------
  // WIDGET DE LISTA DE TAREFAS (usa API simulada: localStorage)
  //-----------------------------------------------------
  function initTodoWidget() {
    const container = document.getElementById("widget-todo");
    if (!container) return;
    container.innerHTML = `<h3>Lista de Tarefas</h3><div class="widget-content"><ul class="todo-list"></ul><form class="todo-form"><input type="text" placeholder="Adicionar nova tarefa..." required /><button type="submit">Add</button></form></div>`;

    const listElement = container.querySelector(".todo-list");
    const formElement = container.querySelector(".todo-form");
    const inputElement = container.querySelector(".todo-form input");

    function render() {
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      listElement.innerHTML = "";

      if (tasks.length === 0) {
        listElement.innerHTML = "<li>Nenhuma tarefa ainda!</li>";
        return;
      }

      tasks.forEach((task) => {
        const li = document.createElement("li");
        li.textContent = task.text;
        if (task.completed) li.classList.add("completed");

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = "×";

        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const updatedTasks = tasks.filter((t) => t.id !== task.id);
          localStorage.setItem("tasks", JSON.stringify(updatedTasks));
          render();
        });

        li.addEventListener("click", () => {
          task.completed = !task.completed;
          localStorage.setItem("tasks", JSON.stringify(tasks));
          render();
        });

        li.appendChild(deleteBtn);
        listElement.appendChild(li);
      });
    }

    formElement.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = inputElement.value.trim();
      if (text) {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.push({ id: Date.now(), text, completed: false });
        localStorage.setItem("tasks", JSON.stringify(tasks));
        inputElement.value = "";
        render();
      }
    });
    render();
  }

  // Roda tudo!
  initializeDashboard();
});
