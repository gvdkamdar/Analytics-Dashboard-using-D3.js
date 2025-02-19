// Global flags
let orientationVertical = true;
let scatterAxesFlipped = false;

// Data arrays
let dataset = [];
let columns = [];

// 1) Load data from data/sample.csv
d3.csv("data/sample.csv").then(data => {
    dataset = data;

    // Derive columns from first row
    columns = Object.keys(data[0]).map(colName => {
        const firstVal = data[0][colName];
        const isNumeric = !isNaN(parseFloat(firstVal));
        return {
            name: colName,
            type: isNumeric ? "numerical" : "categorical"
        };
    });

    // Initialize the UI once data is loaded
    initUI();
    // Force an initial chart draw (will show the "Please select..." message)
    updateChart();
});

function initUI() {
    // Grab the two dropdowns
    const var1Select = document.getElementById("variableSelect");
    const var2Select = document.getElementById("secondVariableSelect");

    // Clear them (in case they had old options)
    var1Select.innerHTML = '<option value="">Make a selection</option>';
    var2Select.innerHTML = '<option value="">Make a selection</option>';

    // Populate them
    columns.forEach(col => {
        const option1 = document.createElement("option");
        option1.value = col.name;
        option1.text = col.name;
        var1Select.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = col.name;
        option2.text = col.name;
        var2Select.appendChild(option2);
    });

    // Add event listeners so that changing either dropdown updates the chart
    var1Select.addEventListener("change", updateChart);
    var2Select.addEventListener("change", updateChart);

    // Also set up the flip buttons
    document.getElementById("flipAxes").addEventListener("click", () => {
        scatterAxesFlipped = !scatterAxesFlipped;
        updateChart();
    });
    document.getElementById("flipOrientation").addEventListener("click", () => {
        orientationVertical = !orientationVertical;
        updateChart();
    });
}

// This function decides which chart to render
function updateChart() {
    // Get the selected column names
    const var1 = document.getElementById("variableSelect").value;
    const var2 = document.getElementById("secondVariableSelect").value;

    // Clear out the previous chart, message, etc.
    d3.select("#chart").selectAll("*").remove();

    if (var1 && var2) {
        // We have 2 variables => scatter plot
        const xVar = scatterAxesFlipped ? var2 : var1;
        const yVar = scatterAxesFlipped ? var1 : var2;
        renderScatterPlot(xVar, yVar);
    } else if (var1) {
        // We have 1 variable => bar chart or histogram
        const col = columns.find(c => c.name === var1);
        if (col.type === "numerical") {
            renderHistogram(var1);
        } else {
            renderBarChart(var1);
        }
    } else {
        // Neither selected => show message
        d3.select("#chart")
            .append("p")
            .text("Please select a variable to display a chart.");
    }
}

// We'll make each chart 700x500 to be bigger
const CHART_WIDTH = 700;
const CHART_HEIGHT = 500;
const MARGIN = { top: 30, right: 30, bottom: 70, left: 70 };

// --------------- BAR CHART ---------------
function renderBarChart(varName) {
    // Tally frequencies
    const counts = {};
    dataset.forEach(d => {
        const val = d[varName];
        counts[val] = (counts[val] || 0) + 1;
    });
    const data = Object.entries(counts).map(([key, value]) => ({ key, value }));

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", CHART_WIDTH)
        .attr("height", CHART_HEIGHT);

    const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    if (orientationVertical) {
        // Vertical
        const x = d3.scaleBand()
            .domain(data.map(d => d.key))
            .range([0, innerWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .nice()
            .range([innerHeight, 0]);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .style("text-anchor", "end");

        g.append("g")
            .call(d3.axisLeft(y));

        g.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => innerHeight - y(d.value))
            .attr("fill", "steelblue");
    } else {
        // Horizontal
        const y = d3.scaleBand()
            .domain(data.map(d => d.key))
            .range([0, innerHeight])
            .padding(0.1);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .nice()
            .range([0, innerWidth]);

        g.append("g")
            .call(d3.axisLeft(y));

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        g.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.key))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.value))
            .attr("fill", "steelblue");
    }
}

// --------------- HISTOGRAM ---------------
function renderHistogram(varName) {
    // Convert to numeric
    const values = dataset.map(d => +d[varName]);

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", CHART_WIDTH)
        .attr("height", CHART_HEIGHT);

    const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Create bins
    const histogram = d3.histogram()
        .domain(d3.extent(values))
        .thresholds(10);

    const bins = histogram(values);

    if (orientationVertical) {
        const x = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .nice()
            .range([innerHeight, 0]);

        const bar = g.selectAll(".bar")
            .data(bins)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`);

        bar.append("rect")
            .attr("x", 1)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("height", d => innerHeight - y(d.length))
            .attr("fill", "steelblue");

        // Axes
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        g.append("g")
            .call(d3.axisLeft(y));

    } else {
        // Horizontal histogram
        const y = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([0, innerHeight]);

        const x = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .nice()
            .range([0, innerWidth]);

        const bar = g.selectAll(".bar")
            .data(bins)
            .enter()
            .append("g")
            .attr("transform", d => `translate(0,${y(d.x0)})`);

        bar.append("rect")
            .attr("y", 1)
            .attr("height", d => y(d.x1) - y(d.x0) - 1)
            .attr("width", d => x(d.length))
            .attr("fill", "steelblue");

        // Axes
        g.append("g")
            .call(d3.axisLeft(y));
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));
    }
}

// --------------- SCATTER PLOT ---------------
function renderScatterPlot(xVar, yVar) {
    const data = dataset.map(d => ({
        x: +d[xVar] || d[xVar],
        y: +d[yVar] || d[yVar]
    }));

    const xIsNumeric = !isNaN(data[0].x);
    const yIsNumeric = !isNaN(data[0].y);

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", CHART_WIDTH)
        .attr("height", CHART_HEIGHT);

    const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    if (xIsNumeric && yIsNumeric) {
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.x))
            .nice()
            .range([0, innerWidth]);
        const y = d3.scaleLinear()
            .domain(d3.extent(data, d => d.y))
            .nice()
            .range([innerHeight, 0]);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));
        g.append("g")
            .call(d3.axisLeft(y));

        g.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.x))
            .attr("cy", d => y(d.y))
            .attr("r", 5)
            .attr("fill", "steelblue");

    } else {
        // Handle categorical logic
        const xDomain = xIsNumeric
            ? d3.extent(data, d => d.x)
            : [...new Set(data.map(d => d.x))];
        const yDomain = yIsNumeric
            ? d3.extent(data, d => d.y)
            : [...new Set(data.map(d => d.y))];

        const x = xIsNumeric
            ? d3.scaleLinear().domain(xDomain).nice().range([0, innerWidth])
            : d3.scaleBand().domain(xDomain).range([0, innerWidth]).padding(0.1);

        const y = yIsNumeric
            ? d3.scaleLinear().domain(yDomain).nice().range([innerHeight, 0])
            : d3.scaleBand().domain(yDomain).range([innerHeight, 0]).padding(0.1);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));
        g.append("g")
            .call(d3.axisLeft(y));

        g.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => {
                if (xIsNumeric) return x(d.x);
                // Jitter if categorical
                return x(d.x) + x.bandwidth() / 2 + (Math.random() - 0.5) * 10;
            })
            .attr("cy", d => {
                if (yIsNumeric) return y(d.y);
                return y(d.y) + y.bandwidth() / 2 + (Math.random() - 0.5) * 10;
            })
            .attr("r", 5)
            .attr("fill", "steelblue");
    }
}
