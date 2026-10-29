(() => {
  "use strict";

  const STORAGE_KEY = "pacs-prototype-v4";
  const OLD_STORAGE_KEY = "pacs-prototype-v3";
  const PIN = "1234";
  const STATUS = {
    present: "Available",
    busy: "Busy",
    unavailable: "Unavailable",
  };
  const COLS = [1, 3, 4, 6, 7, 9];
  const PEOPLE = [
    ["p01", "Dr.", "Chua", "Christopher", "Chua"],
    ["p02", "Sir", "Boyet", "Rodante", "Melo"],
    ["p03", "Sir", "Bryan", "Bryan", "Macasaet"],
    ["p04", "Sir", "Jeric", "Jeric", "Malata"],
    ["p05", "Sir", "Jerome", "Jerome", "Bagon"],
    ["p06", "Ma'am", "Majan", "Majan", "Camo"],
    ["p07", "Sir", "Jaime", "Jaime", "Ascona"],
    ["p08", "Sir", "Gomer", "Gomer", "Dimalibot"],
    ["p09", "Dr.", "Oscar", "Oscar", "Barte"],
    ["p10", "Ma'am", "Jean", "Jean", "Marasigan"],
    ["p11", "Sir", "Jun Mar", "Jun Mar", "Bae"],
    ["p12", "Ma'am", "Therry", "Therry", "Bedonia"],
    ["p13", "Sir", "Ruel", "Ruel", "Tolentino"],
    ["p14", "Sir", "John Ray", "John Ray", "De Guzman"],
    ["p15", "Sir", "Vener", "Vener", "Macatangay"],
    ["p16", "Ma'am", "Neliza", "Neliza", "Noche"],
    ["p17", "Ma'am", "JL", "Jorliezel", "Bzulueta"],
    ["p18", "Sir", "Marwin", "Marwin", "Manalo"],
    ["p19", "Sir", "John", "John Ver", "Moog"],
    ["p20", "Sir", "Robert", "Robert", "Bagui"],
    ["p21", "Ma'am", "Ange", "Angelica", "Dalisay"],
    ["p22", "Ma'am", "Paula", "Paula", "Samson"],
    ["p23", "Dr.", "Edcel", "Edcel", "Torralba"],
    ["p24", "Ma'am", "Ailyn", "Ailyn", "Torralba"],
    ["p25", "Sir", "Allan", "Allan", "Plata"],
    ["p26", "Sir", "Renato", "Renato", "Legaspi"],
    ["p27", "Dr.", "Cza", "Czarelle", "Lepran"],
    ["p28", "Sir", "Jovic", "Johnvictor", "Lepran"],
    ["p29", "Dr.", "Albert", "Albert", "Villena"],
    ["p30", "Ma'am", "Eloisa", "Eloisa", "Villena"],
    ["p31", "Dr.", "Norman", "Norman", "Rivera"],
    ["p32", "Sir", "Topher", "Christopher", "Simlong"],
    ["p33", "Sir", "RJ", "Romeo Joseff", "Laxamana"],
    ["p34", "Ma'am", "Trisha", "Trisha", "Landicho"],
    ["p35", "Sir", "Benito", "Benito", "Comia III"],
  ];

  const $ = (id) => document.getElementById(id);
  const studentView = $("student-view");
  const adminView = $("admin-view");
  const loginForm = $("admin-login-form");
  const consoleEl = $("admin-console");
  const room = $("faculty-room");
  const roomSelector = $("room-select");
  const search = $("professor-search");
  const note = $("search-note");
  const popup = $("popup");
  const popupName = $("popup-name");
  const popupStatus = $("popup-status");
  const requestForm = $("request-form");
  const requestError = $("request-error");
  const requestOk = $("request-ok");
  const requestSend = $("request-send");
  const vacantNote = $("vacant-note");

  let selectedRoom = "room2";
  let selected = null;
  let query = "";
  let adminOn = false;
  let state = load();
  let adminRoom = "room2";
  let testRoom = "room2";
  let selectedProfessorId = null;

  function cubicles() {
    const list = [];
    let n = 1;
    for (let row = 1; row <= 6; row += 1) {
      COLS.forEach((col, place) => {
        list.push({ id: `C${String(n).padStart(2, "0")}`, row, col, place: place + 1 });
        n += 1;
      });
    }
    return list;
  }

  function seed() {
    const cubicleList = cubicles();
    const professors = PEOPLE.map(([id, honorific, shortName, givenName, lastName]) => ({
      id, honorific, shortName, givenName, lastName,
    }));
    const assignments = { room1: {}, room2: {} };
    const statuses = {};
    professors.forEach((p) => { statuses[p.id] = "unavailable"; });
    cubicleList.forEach((c, i) => {
      assignments.room1[c.id] = null;
      assignments.room2[c.id] = c.id === "C31" ? null : professors[i > 30 ? i - 1 : i].id;
    });
    return { cubicles: cubicleList, professors, assignments, statuses, requests: [], acknowledged: {} };
  }

  function load() {
    const initial = seed();
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
      if (!raw) return initial;
      const data = JSON.parse(raw);
      if (!Array.isArray(data.cubicles) || data.cubicles.length !== 36 || !Array.isArray(data.professors)) return initial;
      if (data.assignments && !data.assignments.room1) {
        data.assignments = { room1: initial.assignments.room1, room2: data.assignments };
      }
      data.assignments ||= initial.assignments;
      data.assignments.room1 ||= initial.assignments.room1;
      data.assignments.room2 ||= initial.assignments.room2;
      data.requests ||= [];
      data.acknowledged ||= {};
      data.statuses ||= {};
      data.professors.forEach((p) => { data.statuses[p.id] ||= "unavailable"; });
      return data;
    } catch {
      return initial;
    }
  }

  const assignedId = (roomId, cubicleId) => state.assignments[roomId]?.[cubicleId] || null;
  const idFor = (roomId, cubicleId) => `${roomId}:${cubicleId}`;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function prof(id) {
    return state.professors.find((p) => p.id === id) || null;
  }

  function label(p) {
    return p ? `${p.honorific} ${p.shortName}`.trim() : "Vacant";
  }

  function full(p) {
    return p ? `${p.honorific} ${p.givenName} ${p.lastName}`.replace(/\s+/g, " ").trim() : "";
  }

  function pending(professorId) {
    return state.requests.find((r) => r.professorId === professorId && r.status === "pending");
  }

  function matches() {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return state.cubicles.filter((c) => {
      const p = prof(assignedId(selectedRoom, c.id));
      if (!p) return false;
      return `${label(p)} ${full(p)}`.toLowerCase().includes(q);
    }).map((c) => c.id);
  }

  function renderRoom() {
    const hit = matches();
    room.innerHTML = "";
    [2, 5, 8].forEach((col) => {
      const aisle = document.createElement("div");
      aisle.className = "aisle";
      aisle.style.gridColumn = String(col);
      room.appendChild(aisle);
    });
    state.cubicles.forEach((c) => {
      const p = prof(assignedId(selectedRoom, c.id));
      const btn = document.createElement("button");
      const status = p ? state.statuses[p.id] : "vacant";
      btn.type = "button";
      btn.className = `cubicle ${status}`;
      btn.style.gridColumn = String(c.col);
      btn.style.gridRow = String(c.row);
      btn.textContent = label(p);
      if (query && hit.length) btn.classList.add(hit.includes(c.id) ? "is-on" : "is-dim");
      if (selected === c.id) btn.classList.add("is-on");
      if (pending(p?.id)) btn.classList.add("wait");
      if (p && state.acknowledged[p.id]) {
        const small = document.createElement("span");
        small.className = "ack-note";
        small.textContent = "Acknowledged";
        btn.appendChild(small);
      }
      btn.addEventListener("click", () => openPopup(c.id));
      room.appendChild(btn);
    });
    if (!query) note.textContent = "";
    else if (!hit.length) note.textContent = "No match.";
    else note.textContent = "Matching cubicle is highlighted. Tap it to continue.";
  }

  function openPopup(id) {
    selected = id;
    const p = prof(assignedId(selectedRoom, id));
    requestError.hidden = true;
    requestOk.hidden = true;
    requestForm.reset();
    if (!p) {
      popupName.textContent = "Vacant";
      popupStatus.textContent = "";
      requestForm.hidden = true;
      vacantNote.hidden = false;
      vacantNote.textContent = "This cubicle is vacant.";
    } else {
      const status = state.statuses[p.id];
      popupName.textContent = label(p);
      popupStatus.textContent = STATUS[status];
      requestForm.hidden = status === "unavailable";
      vacantNote.hidden = status !== "unavailable";
      if (status === "unavailable") vacantNote.textContent = "Consultation requests are unavailable while this professor is red.";
      requestSend.disabled = status === "unavailable" || Boolean(pending(p.id));
      if (pending(p.id)) {
        requestError.hidden = false;
        requestError.textContent = "A request is already waiting.";
      }
    }
    popup.hidden = false;
    renderRoom();
  }

  function closePopup() {
    selected = null;
    popup.hidden = true;
    renderRoom();
  }

  function sendRequest(event) {
    event.preventDefault();
    const professorId = assignedId(selectedRoom, selected);
    if (!professorId) return;
    const studentName = $("student-name").value.trim();
    const srCode = $("student-sr").value.trim();
    if (!studentName || !srCode) return;
    requestError.hidden = true;
    requestOk.hidden = true;
    if (state.statuses[professorId] === "unavailable") {
      requestError.hidden = false;
      requestError.textContent = "This professor is unavailable for consultation requests.";
      return;
    }
    if (pending(professorId)) {
      requestError.hidden = false;
      requestError.textContent = "A request is already waiting.";
      requestSend.disabled = true;
      return;
    }
    state.requests.unshift({
      id: `req-${Date.now()}`,
      cubicleId: selected,
      roomId: selectedRoom,
      professorId,
      professorName: full(prof(professorId)),
      studentName,
      srCode,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    delete state.acknowledged[professorId];
    save();
    requestOk.hidden = false;
    requestOk.textContent = "Request sent. This is not yet accepted.";
    requestSend.disabled = true;
    renderRoom();
    renderAdmin();
  }

  let editingCubicle = null;

  function openAssignmentPicker(cubicleId) {
    editingCubicle = cubicleId;
    $("assignment-picker-context").textContent = `Faculty Room ${adminRoom === "room1" ? "1" : "2"} · Cubicle ${cubicleId}`;
    $("assignment-search").value = "";
    $("assignment-picker").hidden = false;
    renderAssignmentResults();
    $("assignment-search").focus();
  }

  function closeAssignmentPicker() {
    $("assignment-picker").hidden = true;
    editingCubicle = null;
  }

  function renderAssignmentResults() {
    if (!editingCubicle) return;
    const needle = $("assignment-search").value.trim().toLowerCase();
    const matches = state.professors
      .filter((person) => full(person).toLowerCase().includes(needle) || label(person).toLowerCase().includes(needle))
      .sort((a, b) => full(a).localeCompare(full(b)));
    const selectedId = assignedId(adminRoom, editingCubicle);
    $("assignment-results").innerHTML = `<button type="button" class="assignment-option" data-pick="">Vacant / Clear assignment</button>` +
      (matches.map((person) => `<button type="button" class="assignment-option ${selectedId === person.id ? "current" : ""}" data-pick="${esc(person.id)}">${esc(full(person))}${selectedId === person.id ? ' <span class="assignment-current">Current</span>' : ""}</button>`).join("") || '<p class="hint">No professors found.</p>');
  }

  function applyAssignment(professorId) {
    if (!editingCubicle) return;
    // Keep each professor assigned to at most one cubicle across both faculty rooms.
    if (professorId) {
      for (const roomId of ["room1", "room2"]) {
        Object.keys(state.assignments[roomId]).forEach((cubicleId) => {
          if (state.assignments[roomId][cubicleId] === professorId) state.assignments[roomId][cubicleId] = null;
        });
      }
    }
    state.assignments[adminRoom][editingCubicle] = professorId || null;
    save();
    closeAssignmentPicker();
    renderRoom();
    renderAdmin();
  }

  function renderAdmin() {
    if (!adminOn) return;
    $("people-body").innerHTML = state.cubicles.map((c) => {
      const assigned = assignedId(adminRoom, c.id);
      const p = prof(assigned);
      const labelField = p ? `<div class="name-grid">
        <select aria-label="Title for ${c.id}" data-title="${p.id}"><option ${p.honorific === "Dr." ? "selected" : ""}>Dr.</option><option ${p.honorific === "Sir" ? "selected" : ""}>Sir</option><option ${p.honorific === "Ma'am" ? "selected" : ""}>Ma'am</option></select>
        <input aria-label="Name displayed on cubicle ${c.id}" data-short="${p.id}" value="${esc(p.shortName)}" maxlength="70" />
      </div>` : "Vacant";
      return `<tr><td>${esc(c.id)}</td><td>${labelField}</td><td><button type="button" class="assignment-trigger" data-open-assignment="${esc(c.id)}" aria-label="Search and assign professor to ${c.id}">${p ? esc(full(p)) : "Vacant"}<span aria-hidden="true">⌕</span></button></td></tr>`;
    }).join("");
    $("remove-professor-select").innerHTML = state.professors.map((p) => `<option value="${esc(p.id)}">${esc(full(p))}</option>`).join("");
    $("request-body").innerHTML = state.requests.length ? state.requests.map((r) => `<tr>
      <td>${esc(new Date(r.createdAt).toLocaleString())}</td>
      <td>${esc(r.professorName || full(prof(r.professorId)))}</td>
      <td>${esc(r.roomId === "room1" ? "Faculty Room 1" : r.roomId === "room2" ? "Faculty Room 2" : "Not recorded")}</td>
      <td>${esc(r.studentName)}</td>
      <td>${esc(r.srCode)}</td>
      <td>${esc(r.status === "pending" ? "Waiting" : "Acknowledged")}</td>
    </tr>`).join("") : '<tr><td colspan="6">No requests yet.</td></tr>';
    renderTesting();
  }

  function renderTesting() {
    if (!adminOn) return;
    const ids = new Set(Object.values(state.assignments[testRoom] || {}).filter(Boolean));
    $("testing-body").innerHTML = [...ids].map((id) => {
      const p = prof(id);
      if (!p) return "";
      const status = state.statuses[id] || "unavailable";
      const options = Object.entries(STATUS).map(([value, text]) => `<option value="${value}" ${status === value ? "selected" : ""}>${text}</option>`).join("");
      const hasPending = !!pending(id);
      return `<tr><td>${esc(full(p))}</td><td><select data-test-status="${esc(id)}">${options}</select></td><td>${hasPending ? `<button type="button" class="small" data-test-ack="${esc(id)}">Simulate yellow/green acknowledgment</button>` : "None"}</td></tr>`;
    }).join("");
  }

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function logoutAdmin() {
    adminOn = false;
    $("admin-pin").value = "";
    $("admin-login-error").hidden = true;
    loginForm.hidden = false;
    consoleEl.hidden = true;
    closePopup();
    studentView.hidden = false;
    adminView.hidden = true;
  }

  function showAdmin() {
    closePopup();
    studentView.hidden = true;
    adminView.hidden = false;
    loginForm.hidden = adminOn;
    consoleEl.hidden = !adminOn;
    $("admin-logout-btn").textContent = adminOn ? "Log out" : "Back";
    if (adminOn) renderAdmin();
  }

  search.addEventListener("input", () => {
    query = search.value;
    renderRoom();
  });

  $("popup-close").addEventListener("click", closePopup);
  popup.addEventListener("click", (e) => { if (e.target === popup) closePopup(); });
  requestForm.addEventListener("submit", sendRequest);
  $("admin-open-btn").addEventListener("click", showAdmin);
  $("admin-logout-btn").addEventListener("click", logoutAdmin);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopup(); });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("admin-pin").value === PIN) {
      adminOn = true;
      $("admin-login-error").hidden = true;
      $("admin-pin").value = "";
      showAdmin();
    } else {
      $("admin-login-error").hidden = false;
      $("admin-login-error").textContent = "Wrong PIN.";
    }
  });

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-on"));
      btn.classList.add("is-on");
      $("tab-people").hidden = btn.dataset.tab !== "people";
      $("tab-requests").hidden = btn.dataset.tab !== "requests";
      $("tab-testing").hidden = btn.dataset.tab !== "testing";
    });
  });

  $("people-body").addEventListener("change", (e) => {
    const title = e.target.closest("select[data-title]");
    const short = e.target.closest("input[data-short]");
    if (title) { const p = prof(title.dataset.title); if (p) p.honorific = title.value; }
    if (short) { const p = prof(short.dataset.short); if (p) p.shortName = short.value.trim() || p.shortName; }
    save(); renderRoom(); renderAdmin();
  });

  $("people-body").addEventListener("click", (e) => {
    const trigger = e.target.closest("button[data-open-assignment]");
    if (trigger) openAssignmentPicker(trigger.dataset.openAssignment);
  });
  $("assignment-picker-close").addEventListener("click", closeAssignmentPicker);
  $("assignment-picker").addEventListener("click", (e) => {
    if (e.target === $("assignment-picker")) closeAssignmentPicker();
  });
  $("assignment-search").addEventListener("input", renderAssignmentResults);
  $("assignment-results").addEventListener("click", (e) => {
    const choice = e.target.closest("button[data-pick]");
    if (choice) applyAssignment(choice.dataset.pick);
  });

  $("add-professor-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const givenName = $("new-given").value.trim();
    const lastName = $("new-last").value.trim();
    const shortName = $("new-short").value.trim();
    if (!givenName || !lastName || !shortName) return;
    const id = `p-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    state.professors.push({ id, honorific: $("new-honorific").value, givenName, lastName, shortName });
    state.statuses[id] = "unavailable";
    $("add-professor-form").reset();
    save(); renderAdmin();
  });

  document.querySelectorAll("[data-roster-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.rosterAction;
      $("add-professor-form").hidden = action !== "add";
      $("remove-professor-panel").hidden = action !== "remove";
      $("roster-error").hidden = true;
      document.querySelectorAll("[data-roster-action]").forEach((item) => {
        const active = item.dataset.rosterAction === action;
        item.classList.toggle("is-on", active);
        item.setAttribute("aria-pressed", String(active));
      });
    });
  });

  $("remove-professor-btn").addEventListener("click", () => {
    const id = $("remove-professor-select").value;
    if (!id) return;
    const err = $("roster-error");
    err.hidden = true;
    if (pending(id)) {
      err.textContent = "A professor with an unacknowledged request cannot be removed.";
      err.hidden = false;
      return;
    }
    if (!confirm(`Remove ${full(prof(id))} from the prototype roster? Their past request history will be kept.`)) return;
    for (const roomId of ["room1", "room2"]) {
      Object.keys(state.assignments[roomId]).forEach((c) => {
        if (state.assignments[roomId][c] === id) state.assignments[roomId][c] = null;
      });
    }
    state.professors = state.professors.filter((p) => p.id !== id);
    delete state.statuses[id];
    delete state.acknowledged[id];
    save(); renderRoom(); renderAdmin();
  });

  $("admin-room-select").addEventListener("change", (e) => { adminRoom = e.target.value; renderAdmin(); });
  $("testing-room-select").addEventListener("change", (e) => { testRoom = e.target.value; renderTesting(); });
  $("testing-body").addEventListener("change", (e) => {
    const select = e.target.closest("select[data-test-status]");
    if (!select) return;
    state.statuses[select.dataset.testStatus] = select.value;
    save(); renderRoom(); renderTesting();
  });
  $("testing-body").addEventListener("click", (e) => {
    const ack = e.target.closest("button[data-test-ack]");
    if (!ack) return;
    const req = pending(ack.dataset.testAck);
    if (!req) return;
    const status = state.statuses[ack.dataset.testAck];
    if (status !== "busy" && status !== "present") {
      alert("Set the professor to Busy (yellow) or Available (green) before simulating acknowledgment.");
      return;
    }
    req.status = "acknowledged";
    state.acknowledged[ack.dataset.testAck] = true;
    save(); renderRoom(); renderAdmin();
  });
  $("reset-status-btn").addEventListener("click", () => {
    Object.keys(state.statuses).forEach((id) => { state.statuses[id] = "unavailable"; });
    state.acknowledged = {};
    save(); renderRoom(); renderAdmin();
  });

  roomSelector.addEventListener("change", () => {
    closePopup();
    selectedRoom = roomSelector.value;
    query = ""; search.value = "";
    renderRoom();
  });

  renderRoom();
})();
