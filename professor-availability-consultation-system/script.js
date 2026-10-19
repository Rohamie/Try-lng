(() => {
  "use strict";

  const STORAGE_KEY = "pacs-prototype-v2";
  const PIN = "1234";
  const STATUS = {
    present: "Present",
    busy: "Busy",
    unavailable: "Not present",
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

  let selected = null;
  let query = "";
  let adminOn = false;
  let state = load();

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
    const assignments = {};
    const cycle = ["present", "busy", "unavailable", "present", "present", "busy"];
    const statuses = {};
    professors.forEach((p, i) => { statuses[p.id] = cycle[i % cycle.length]; });
    cubicleList.forEach((c, i) => {
      if (c.id === "C31") assignments[c.id] = null;
      else assignments[c.id] = professors[i > 30 ? i - 1 : i].id;
    });
    return { cubicles: cubicleList, professors, assignments, statuses, requests: [] };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed();
      const data = JSON.parse(raw);
      if (!data.cubicles || data.cubicles.length !== 36) return seed();
      return data;
    } catch {
      return seed();
    }
  }

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

  function pending(cubicleId) {
    return state.requests.find((r) => r.cubicleId === cubicleId && r.status === "pending");
  }

  function matches() {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return state.cubicles.filter((c) => {
      const p = prof(state.assignments[c.id]);
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
      const p = prof(state.assignments[c.id]);
      const btn = document.createElement("button");
      const status = p ? state.statuses[p.id] : "vacant";
      btn.type = "button";
      btn.className = `cubicle ${status}`;
      btn.style.gridColumn = String(c.col);
      btn.style.gridRow = String(c.row);
      btn.textContent = label(p);
      if (query && hit.length) btn.classList.add(hit.includes(c.id) ? "is-on" : "is-dim");
      if (selected === c.id) btn.classList.add("is-on");
      if (pending(c.id)) btn.classList.add("wait");
      btn.addEventListener("click", () => openPopup(c.id));
      room.appendChild(btn);
    });
    if (!query) note.textContent = "";
    else if (!hit.length) note.textContent = "No match.";
    else note.textContent = "Matching cubicle is highlighted. Tap it to continue.";
  }

  function openPopup(id) {
    selected = id;
    const p = prof(state.assignments[id]);
    requestError.hidden = true;
    requestOk.hidden = true;
    requestForm.reset();
    if (!p) {
      popupName.textContent = "Vacant";
      popupStatus.textContent = "";
      requestForm.hidden = true;
      vacantNote.hidden = false;
    } else {
      const status = state.statuses[p.id];
      popupName.textContent = label(p);
      popupStatus.textContent = STATUS[status];
      requestForm.hidden = false;
      vacantNote.hidden = true;
      requestSend.disabled = Boolean(pending(id));
      if (pending(id)) {
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
    const professorId = state.assignments[selected];
    if (!professorId) return;
    const studentName = $("student-name").value.trim();
    const srCode = $("student-sr").value.trim();
    requestError.hidden = true;
    requestOk.hidden = true;
    if (pending(selected) || state.requests.some((r) => r.cubicleId === selected && r.srCode.toLowerCase() === srCode.toLowerCase() && r.status === "pending")) {
      requestError.hidden = false;
      requestError.textContent = "A request is already waiting.";
      requestSend.disabled = true;
      return;
    }
    state.requests.unshift({
      id: `req-${Date.now()}`,
      cubicleId: selected,
      professorId,
      studentName,
      srCode,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    save();
    requestOk.hidden = false;
    requestOk.textContent = "Request sent. This is not yet accepted.";
    requestSend.disabled = true;
    renderRoom();
    renderAdmin();
  }

  function renderAdmin() {
    if (!adminOn) return;
    $("people-body").innerHTML = state.cubicles.map((c) => {
      const p = prof(state.assignments[c.id]);
      const options = [`<option value="">Vacant</option>`]
        .concat(state.professors.map((item) => `<option value="${item.id}" ${state.assignments[c.id] === item.id ? "selected" : ""}>${esc(full(item))}</option>`))
        .join("");
      const statusOptions = Object.entries(STATUS).map(([id, text]) => (
        `<option value="${id}" ${p && state.statuses[p.id] === id ? "selected" : ""}>${text}</option>`
      )).join("");
      const waiting = pending(c.id);
      return `<tr>
        <td>${c.id}</td>
        <td>${p ? `<div class="name-grid">
          <select data-field="honorific" data-id="${p.id}">
            <option ${p.honorific === "Dr." ? "selected" : ""}>Dr.</option>
            <option ${p.honorific === "Sir" ? "selected" : ""}>Sir</option>
            <option ${p.honorific === "Ma'am" ? "selected" : ""}>Ma'am</option>
          </select>
          <input data-field="shortName" data-id="${p.id}" value="${esc(p.shortName)}" />
        </div>` : "—"}</td>
        <td><select data-assign="${c.id}">${options}</select></td>
        <td>${p ? `<select data-status="${p.id}">${statusOptions}</select>` : "—"}</td>
        <td>${waiting ? `<button type="button" class="small" data-ack="${c.id}">Acknowledge</button>` : "—"}</td>
      </tr>`;
    }).join("");

    $("request-body").innerHTML = state.requests.length
      ? state.requests.map((r) => `<tr>
          <td>${esc(new Date(r.createdAt).toLocaleString())}</td>
          <td>${esc(label(prof(r.professorId)))}</td>
          <td>${esc(r.studentName)}</td>
          <td>${esc(r.srCode)}</td>
          <td>${r.status === "pending" ? "Waiting" : "Acknowledged"}</td>
        </tr>`).join("")
      : `<tr><td colspan="5">No requests yet.</td></tr>`;
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
    });
  });

  $("people-body").addEventListener("change", (e) => {
    const assign = e.target.closest("select[data-assign]");
    const status = e.target.closest("select[data-status]");
    const field = e.target.closest("[data-field]");
    if (assign) {
      const next = assign.value || null;
      if (next) {
        const used = Object.entries(state.assignments).find(([id, pid]) => pid === next && id !== assign.dataset.assign);
        if (used) state.assignments[used[0]] = null;
      }
      state.assignments[assign.dataset.assign] = next;
    }
    if (status) state.statuses[status.dataset.status] = status.value;
    if (field) {
      const p = prof(field.dataset.id);
      if (p) p[field.dataset.field] = field.value.trim();
    }
    save();
    renderRoom();
    renderAdmin();
  });

  $("people-body").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-ack]");
    if (!btn) return;
    const req = pending(btn.dataset.ack);
    if (!req) return;
    req.status = "acknowledged";
    save();
    renderRoom();
    renderAdmin();
  });

  renderRoom();
})();
