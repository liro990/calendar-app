import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

const fileInput = document.getElementById("fileInput");
const filterSelect = document.getElementById("filter");
const calendarDiv = document.getElementById("calendar");

let allEvents = [];

fileInput.addEventListener("change", handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    processData(jsonData);
  };
  reader.readAsArrayBuffer(file);
}

function processData(data) {
  const deptSet = new Set();
  allEvents = [];

  data.forEach((row) => {
    const date = parseDate(row["날짜"]);
    Object.keys(row).forEach((key) => {
      if (key === "날짜") return;

      const dept = key.trim();
      const content = row[key].toString().trim();

      if (content) {
        deptSet.add(dept);
        allEvents.push({ date, dept, content });
      }
    });
  });

  updateDeptOptions([...deptSet]);
  renderCalendar();
}

function parseDate(value) {
  if (typeof value === "string") {
    return new Date(value);
  } else if (typeof value === "number") {
    return XLSX.SSF.parse_date_code(value);
  } else {
    return new Date();
  }
}

function updateDeptOptions(depts) {
  filterSelect.innerHTML = '<option value="전체">전체</option>';
  depts.forEach((dept) => {
    const option = document.createElement("option");
    option.value = dept;
    option.textContent = dept;
    filterSelect.appendChild(option);
  });
}

filterSelect.addEventListener("change", renderCalendar);

function renderCalendar() {
  const selectedDept = filterSelect.value;
  calendarDiv.innerHTML = "";

  const eventsByDate = {};

  allEvents.forEach((event) => {
    if (selectedDept !== "전체" && event.dept !== selectedDept) return;

    const dateStr = formatDate(event.date);
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
    eventsByDate[dateStr].push(event);
  });

  Object.keys(eventsByDate)
    .sort()
    .forEach((date) => {
      const section = document.createElement("div");
      section.className = "event";
      section.innerHTML = `<strong>${date}</strong><ul>` +
        eventsByDate[date]
          .map((e) => `<li><strong>[${e.dept}]</strong> ${e.content}</li>`)
          .join("") +
        `</ul>`;
      calendarDiv.appendChild(section);
    });

  if (calendarDiv.innerHTML === "") {
    calendarDiv.innerHTML = "표시할 행사가 없습니다.";
  }
}

function formatDate(date) {
  if (typeof date === "object" && date.y && date.m && date.d) {
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  } else if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  } else {
    return "알 수 없는 날짜";
  }
}
