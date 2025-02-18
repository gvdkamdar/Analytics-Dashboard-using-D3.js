/************************************************************
 *                 GLOBAL VARIABLES & SETTINGS
 ************************************************************/
const chartWidth = 600;
const chartHeight = 400;
const margin = { top: 30, right: 30, bottom: 50, left: 50 };

let dataset = [];        // Will hold the loaded data
let columns = [];        // Will store column names
let orientation = 'vertical'; // Track bar/hist orientation

/************************************************************
 *                 1. LOAD THE CSV DATA
 ************************************************************/
// TODO: Replace 'path/to/yourdata.csv' with your actual CSV file path
d3.csv('data/sample.csv').then(data => {
    dataset = data;

    // 1.1 Detect column names
    columns = Object.keys(dataset[0]); // e.g., ["mpg", "horsepower", "brand", ...]

    // 1.2 Populate dropdown menus
    populateDropdowns(columns);

    // 1.3 Attach event listeners
    attachEventListeners();

    // 1.4 Initial default chart
    updateChart();
})
    .catch(error => {
        console.error('Error loading the CSV file:', error);
    });

/************************************************************
 *                 2. POPULATE DROPDOWNS
 ************************************************************/
function populateDropdowns(cols) {
    const variableSelect = d3.select('#variableSelect');
    const secondVariableSelect = d3.select('#secondVariableSelect');

    // Add <option> elements for each column
    cols.forEach(col => {
        variableSelect.append('option')
            .attr('value', col)
            .text(col);

        secondVariableSelect.append('option')
            .attr('value', col)
            .text(col);
    });
}

/************************************************************
 *                 3. EVENT LISTENERS
 ************************************************************/
function attachEventListeners() {
    // Dropdown change → update chart
    d3.select('#variableSelect').on('change', updateChart);
    d3.select('#secondVariableSelect').on('change', updateChart);

    // Radio buttons for scatter axis assignment
    d3.selectAll('input[name="axisOption"]').on('change', updateChart);

    // Orientation toggle for bar/hist
    d3.select('#orientationToggle').on('click', () => {
        orientation = (orientation === 'vertical') ? 'horizontal' : 'vertical';
        updateChart();
    });
}

/************************************************************
 *                 4. MAIN UPDATE CHART FUNCTION
 ************************************************************/
function updateChart() {
    // Remove any existing SVG
    d3.select('#chart').selectAll('*').remove();

    // Retrieve the currently selected variables
    const selectedVar1 = d3.select('#variableSelect').property('value');
    const selectedVar2 = d3.select('#secondVariableSelect').property('value');
    const axisOption = d3.select('input[name="axisOption"]:checked').node().value;

    // Detect data types
    const var1Type = detectType(dataset, selectedVar1);
    const var2Type = detectType(dataset, selectedVar2);

    // Decide which chart to draw:
    // 1) Both variables are numeric -> scatterplot
    // 2) Var1 is numeric -> histogram
    // 3) Var1 is categorical -> bar chart
    // (We only check Var1 because Var2 is only relevant for scatterplot)

    if (var1Type === 'numeric' && var2Type === 'numeric') {
        drawScatterPlot(selectedVar1, selectedVar2, axisOption);
    } else if (var1Type === 'numeric') {
        drawHistogram(selectedVar1);
    } else {
        // default to bar chart for categorical
        drawBarChart(selectedVar1);
    }
}

/************************************************************
 *                 5. TYPE DETECTION FUNCTION
 ************************************************************/
function detectType(data, colName) {
    // Simple heuristic: try to parseFloat for first ~10 values
    // If majority are numbers, return 'numeric', else 'categorical'.
    let numericCount = 0;
    const sampleSize = Math.min(10, data.length);

    for (let i = 0; i < sampleSize; i++) {
        const value = parseFloat(data[i][colName]);
        if (!isNaN(value)) {
            numericCount++;
        }
    }

    const ratio = numericCount / sampleSize;
    return ratio > 0.6 ? 'numeric' : 'categorical';
}

/************************************************************
 *                 6. DRAW BAR CHART (CATEGORICAL)
 ************************************************************/
function drawBarChart(column) {
    // Count frequency of each category
    const freqMap = {};
    dataset.forEach(d => {
        const cat = d[column];
        freqMap[cat] = (freqMap[cat] || 0) + 1;
    });

    // Convert freqMap to array of {category, count}
    const dataArray = Object.keys(freqMap).map(k => {
        return { category: k, count: freqMap[k] };
    });

    // Create SVG
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', chartWidth)
        .attr('height', chartHeight);

    // Define scales
    if (orientation === 'vertical') {
        const xScale = d3.scaleBand()
            .domain(dataArray.map(d => d.category))
            .range([margin.left, chartWidth - margin.right])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(dataArray, d => d.count)])
            .range([chartHeight - margin.bottom, margin.top]);

        // Draw bars
        svg.selectAll('.bar')
            .data(dataArray)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.category))
            .attr('y', d => yScale(d.count))
            .attr('width', xScale.bandwidth())
            .attr('height', d => (chartHeight - margin.bottom) - yScale(d.count))
            .attr('fill', 'steelblue');

        // X-axis
        svg.append('g')
            .attr('transform', `translate(0, ${chartHeight - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Y-axis
        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));

    } else {
        // Horizontal orientation
        const yScale = d3.scaleBand()
            .domain(dataArray.map(d => d.category))
            .range([margin.top, chartHeight - margin.bottom])
            .padding(0.1);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(dataArray, d => d.count)])
            .range([margin.left, chartWidth - margin.right]);

        // Draw bars
        svg.selectAll('.bar')
            .data(dataArray)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => yScale(d.category))
            .attr('x', xScale(0))
            .attr('height', yScale.bandwidth())
            .attr('width', d => xScale(d.count) - margin.left)
            .attr('fill', 'steelblue');

        // Y-axis
        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        // X-axis
        svg.append('g')
            .attr('transform', `translate(0, ${chartHeight - margin.bottom})`)
            .call(d3.axisBottom(xScale));
    }

    // Add chart title
    svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text(`Bar Chart: ${column}`);
}

/************************************************************
 *                 7. DRAW HISTOGRAM (NUMERICAL)
 ************************************************************/
function drawHistogram(column) {
    // Convert the column data to numeric
    const values = dataset.map(d => +d[column]).filter(d => !isNaN(d));

    // Create SVG
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', chartWidth)
        .attr('height', chartHeight);

    // Define X scale
    const xScale = d3.scaleLinear()
        .domain([d3.min(values), d3.max(values)])
        .range([margin.left, chartWidth - margin.right]);

    // Create histogram bins
    const histogram = d3.histogram()
        .domain(xScale.domain())
        .thresholds(10);  // number of bins (can be adjusted)

    const bins = histogram(values);

    // Define Y scale
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([chartHeight - margin.bottom, margin.top]);

    // Decide orientation
    if (orientation === 'vertical') {
        // Vertical histogram
        svg.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.x0))
            .attr('y', d => yScale(d.length))
            .attr('width', d => xScale(d.x1) - xScale(d.x0) - 1)
            .attr('height', d => (chartHeight - margin.bottom) - yScale(d.length))
            .attr('fill', 'orange');

        // X-axis
        svg.append('g')
            .attr('transform', `translate(0, ${chartHeight - margin.bottom})`)
            .call(d3.axisBottom(xScale));

        // Y-axis
        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

    } else {
        // Horizontal histogram (bars going sideways)
        // We'll treat the bin "length" as the X dimension
        const xScaleHorizontal = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([margin.left, chartWidth - margin.right]);

        // For Y, we need a scale for the bin index
        const yScaleHorizontal = d3.scaleBand()
            .domain(bins.map((_, i) => i))
            .range([margin.top, chartHeight - margin.bottom])
            .padding(0.1);

        // Draw bars horizontally
        svg.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('y', (d, i) => yScaleHorizontal(i))
            .attr('x', margin.left)
            .attr('width', d => xScaleHorizontal(d.length) - margin.left)
            .attr('height', yScaleHorizontal.bandwidth())
            .attr('fill', 'orange');

        // Y-axis: each bin range label
        const yAxisScale = d3.scaleBand()
            .domain(bins.map(d => `${Math.round(d.x0)} - ${Math.round(d.x1)}`))
            .range([margin.top, chartHeight - margin.bottom])
            .padding(0.1);

        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yAxisScale));

        // X-axis
        svg.append('g')
            .attr('transform', `translate(0, ${chartHeight - margin.bottom})`)
            .call(d3.axisBottom(xScaleHorizontal));
    }

    // Add chart title
    svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text(`Histogram: ${column}`);
}

/************************************************************
 *                 8. DRAW SCATTERPLOT (NUM vs NUM)
 ************************************************************/
function drawScatterPlot(var1, var2, axisOption) {
    // Convert data to numeric
    const points = dataset.map(d => ({
        xVal: +d[var1],
        yVal: +d[var2]
    })).filter(d => !isNaN(d.xVal) && !isNaN(d.yVal));

    // Decide which variable is X vs. Y based on radio button
    let xLabel = var1;
    let yLabel = var2;
    if (axisOption === 'firstY') {
        xLabel = var2;
        yLabel = var1;
        // Swap the values in points
        points.forEach(pt => {
            const temp = pt.xVal;
            pt.xVal = pt.yVal;
            pt.yVal = temp;
        });
    }

    // Create SVG
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', chartWidth)
        .attr('height', chartHeight);

    // X scale
    const xScale = d3.scaleLinear()
        .domain(d3.extent(points, d => d.xVal))
        .range([margin.left, chartWidth - margin.right]);

    // Y scale
    const yScale = d3.scaleLinear()
        .domain(d3.extent(points, d => d.yVal))
        .range([chartHeight - margin.bottom, margin.top]);

    // Plot circles
    svg.selectAll('circle')
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.xVal))
        .attr('cy', d => yScale(d.yVal))
        .attr('r', 4)
        .attr('fill', 'teal')
        .attr('opacity', 0.7);

    // X-axis
    svg.append('g')
        .attr('transform', `translate(0, ${chartHeight - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    // Y-axis
    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    // X-axis label
    svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight - 5)
        .attr('text-anchor', 'middle')
        .text(xLabel);

    // Y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartHeight / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .text(yLabel);

    // Chart title
    svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text(`Scatterplot: ${var1} vs. ${var2}`);
}
