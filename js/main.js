// ======================================
// ✅ Fetch REAL logs from your Raspberry Pi
// ======================================
async function loadLogs() {
    try {
        const res = await fetch("http://raspberrypi.tail505f60.ts.net:8000/logs");
        const logs = await res.json();

        const logList = document.getElementById("event-log");
        logList.innerHTML = "";

        logs.forEach(entry => {
            const li = document.createElement("li");
            li.textContent = `${entry.timestamp} → ${entry.event}`;
            logList.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Failed to load logs:", error);
    }
}



// ======================================
// SECTION SWITCHING
// ======================================
function showSection(id) {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.style.display = (section.id === id) ? 'block' : 'none';
    });

    // Load REAL logs + chart when opening History page
    if (id === 'history-section') {
        loadLogs();

        if (!window.historyChartLoaded) {
            createHistoryChart();
            window.historyChartLoaded = true;
        }
    }
}



// ======================================
// 📊 HISTORY CHART (REAL LOG VERSION)
// ======================================
async function createHistoryChart() {
    const ctx = document.getElementById("historyChart").getContext("2d");

    // 1️⃣ Fetch logs from Raspberry Pi
    const res = await fetch("http://raspberrypi.tail505f60.ts.net:8000/logs");
    const logs = await res.json();

    // 2️⃣ Convert logs into daily counts
    const dateMap = {};

    logs.forEach(log => {
        const dateOnly = log.timestamp.split(" ")[0]; // yyyy-mm-dd

        if (!dateMap[dateOnly]) {
            dateMap[dateOnly] = { hungry: 0, feeder: 0 };
        }

        if (log.event === "Hungry Detected") {
            dateMap[dateOnly].hungry++;
        }
        if (log.event === "Auto Feeder Triggered") {
            dateMap[dateOnly].feeder++;
        }
    });

    // 3️⃣ Convert to arrays for Chart.js
    const allLabels = [];
    const hungryData = [];
    const feederData = [];

    Object.keys(dateMap).sort().forEach(date => {
        const formatted = new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

        allLabels.push(formatted);
        hungryData.push(dateMap[date].hungry);
        feederData.push(dateMap[date].feeder);
    });

    // 4️⃣ Create the real chart
    const chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: "Hungry Detected",
                    data: hungryData,
                    backgroundColor: "rgba(255,205,86,0.7)",
                },
                {
                    label: "Auto Feeder Triggered",
                    data: feederData,
                    backgroundColor: "rgba(54,162,235,0.7)",
                }
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
        },
    });

    // 5️⃣ Filter: Last 7 / 30 / All
    function updateChart(days) {
        const start = Math.max(allLabels.length - days, 0);

        chart.data.labels = allLabels.slice(start);
        chart.data.datasets[0].data = hungryData.slice(start);
        chart.data.datasets[1].data = feederData.slice(start);

        chart.update();
    }

    document.getElementById("btn7").addEventListener("click", () => updateChart(7));
    document.getElementById("btn30").addEventListener("click", () => updateChart(30));
    document.getElementById("btnAll").addEventListener("click", () => updateChart(allLabels.length));



    // 6️⃣ Month Filter
    document.getElementById("monthSelect").addEventListener("change", () => {
        const monthVal = document.getElementById("monthSelect").value;

        if (monthVal === "all") {
            updateChart(allLabels.length);
            return;
        }

        const monthIndex = parseInt(monthVal);

        const filteredLabels = [];
        const filteredHungry = [];
        const filteredFeeder = [];

        Object.keys(dateMap).sort().forEach(date => {
            const d = new Date(date);
            if (d.getMonth() === monthIndex) {
                filteredLabels.push(
                    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                );
                filteredHungry.push(dateMap[date].hungry);
                filteredFeeder.push(dateMap[date].feeder);
            }
        });

        chart.data.labels = filteredLabels;
        chart.data.datasets[0].data = filteredHungry;
        chart.data.datasets[1].data = filteredFeeder;
        chart.update();
    });
}


