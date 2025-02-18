// Global variables and settings
const chartWidth = 600;
const chartHeight = 400;
const margin = { top: 30, right: 30, bottom: 50, left: 50 };

let dataset = [];
let columns = [];
let orientation = 'vertical';

const COLORS = {
    primary: '#3182ce',
    secondary: '#68d391',
    hover: '#2c5282',
    background: '#f7fafc'
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeChartActions();
    // Load data
    d3.csv('data/sample.csv')
        .then(data => {
            if (!data || data.length === 0) {
                throw new Error('No data loaded');
            }
            dataset = data;
            columns = Object.keys(dataset[0]);
            
            // Initialize UI
            setupUIControls();
            populateDropdowns();
            attachEventListeners();
            updateChart();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            showErrorMessage('Failed to load data. Please check if data/sample.csv exists and is accessible.');
        });
});

// UI Setup Functions
function setupUIControls() {
    const axesButton = document.getElementById('flipAxes');
    const orientationButton = document.getElementById('flipOrientation');
    
    if (axesButton) {
        axesButton.addEventListener('click', () => {
            const firstVar = d3.select('#variableSelect').property('value');
            const secondVar = d3.select('#secondVariableSelect').property('value');
            
            // Swap variables
            d3.select('#variableSelect').property('value', secondVar);
            d3.select('#secondVariableSelect').property('value', firstVar);
            
            updateChart();
        });
    }

    if (orientationButton) {
        orientationButton.addEventListener('click', () => {
            orientation = orientation === 'vertical' ? 'horizontal' : 'vertical';
            updateChart();
        });
    }

    // Add dropdown change listeners
    d3.select('#variableSelect').on('change', updateChart);
    d3.select('#secondVariableSelect').on('change', updateChart);
}

function populateDropdowns() {
    const variableSelect = d3.select('#variableSelect');
    const secondVariableSelect = d3.select('#secondVariableSelect');

    // Clear existing options
    variableSelect.selectAll('option').remove();
    secondVariableSelect.selectAll('option').remove();

    // Add options for each column
    columns.forEach(col => {
        variableSelect.append('option')
            .attr('value', col)
            .text(col);

        secondVariableSelect.append('option')
            .attr('value', col)
            .text(col);
    });

    // Set default selections
    if (columns.length >= 2) {
        secondVariableSelect.property('value', columns[1]);
    }
}

function attachEventListeners() {
    // Dropdown change handlers
    d3.select('#variableSelect').on('change', updateChart);
    d3.select('#secondVariableSelect').on('change', updateChart);
}

// Chart Update Function
function updateChart() {
    if (!dataset || dataset.length === 0) {
        showErrorMessage('No data available to display');
        return;
    }

    const selectedVar1 = d3.select('#variableSelect').property('value');
    const selectedVar2 = d3.select('#secondVariableSelect').property('value');

    if (!selectedVar1 || !selectedVar2) {
        showErrorMessage('Please select variables to display');
        return;
    }

    // Clear existing chart
    d3.select('#chart').selectAll('*').remove();

    // Detect data types
    const var1Type = detectDataType(dataset, selectedVar1);
    const var2Type = detectDataType(dataset, selectedVar2);

    // Create appropriate visualization
    if (var1Type === 'numeric' && var2Type === 'numeric') {
        createScatterPlot(selectedVar1, selectedVar2);
    } else if (var1Type === 'numeric') {
        createHistogram(selectedVar1);
    } else {
        createBarChart(selectedVar1);
    }
}

// Data Type Detection
function detectDataType(data, variable) {
    const values = data.map(d => d[variable]);
    const uniqueValues = new Set(values);
    
    // If there are few unique values, treat as categorical
    if (uniqueValues.size <= 10) {
        return 'categorical';
    }
    
    // Check if values are numeric
    const sampleSize = Math.min(10, values.length);
    let numericCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
        if (!isNaN(parseFloat(values[i])) && isFinite(values[i])) {
            numericCount++;
        }
    }
    
    return numericCount / sampleSize > 0.6 ? 'numeric' : 'categorical';
}

// Visualization Functions
function createScatterPlot(xVar, yVar) {
    const container = d3.select('#chart');
    const width = container.node().getBoundingClientRect().width;
    const height = chartHeight;

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, d => +d[xVar]))
        .range([0, width - margin.left - margin.right])
        .nice();

    const yScale = d3.scaleLinear()
        .domain(d3.extent(dataset, d => +d[yVar]))
        .range([height - margin.top - margin.bottom, 0])
        .nice();

    // Add axes
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));

    // Add points
    svg.selectAll('circle')
        .data(dataset)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(+d[xVar]))
        .attr('cy', d => yScale(+d[yVar]))
        .attr('r', 5)
        .attr('fill', COLORS.primary)
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 8)
                .attr('fill', COLORS.hover);
            
            // Add tooltip
            showTooltip(event, `${xVar}: ${d[xVar]}<br>${yVar}: ${d[yVar]}`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 5)
                .attr('fill', COLORS.primary);
            
            hideTooltip();
        });

    // Add labels
    svg.append('text')
        .attr('x', width / 2 - margin.left)
        .attr('y', height - margin.bottom)
        .attr('text-anchor', 'middle')
        .text(xVar);

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height / 2) + margin.top)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .text(yVar);
}

// Tooltip Functions
function showTooltip(event, text) {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .html(text);

    tooltip.style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
}

function hideTooltip() {
    d3.selectAll('.tooltip').remove();
}

// Error Handling
function showErrorMessage(message) {
    const container = d3.select('#chart');
    container.html(`
        <div class="error-message" style="
            padding: 20px;
            color: #e53e3e;
            text-align: center;
            background: #fff5f5;
            border-radius: 8px;
            margin: 20px;
        ">
            ${message}
        </div>
    `);
}

// Additional utility functions can be added here

// Add createBarChart function
function createBarChart(variable) {
    const container = d3.select('#chart');
    const width = container.node().getBoundingClientRect().width;
    const height = chartHeight;

    // Clear existing content
    container.selectAll('*').remove();

    // Process data
    const freqMap = {};
    dataset.forEach(d => {
        const cat = d[variable];
        freqMap[cat] = (freqMap[cat] || 0) + 1;
    });

    const barData = Object.entries(freqMap)
        .map(([key, value]) => ({ category: key, count: value }))
        .sort((a, b) => b.count - a.count);

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    if (orientation === 'vertical') {
        const x = d3.scaleBand()
            .domain(barData.map(d => d.category))
            .range([0, width - margin.left - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(barData, d => d.count)])
            .range([height - margin.top - margin.bottom, 0]);

        // Add bars
        svg.selectAll('rect')
            .data(barData)
            .enter()
            .append('rect')
            .attr('x', d => x(d.category))
            .attr('y', d => y(d.count))
            .attr('width', x.bandwidth())
            .attr('height', d => height - margin.top - margin.bottom - y(d.count))
            .attr('fill', COLORS.primary);

        // Add axes
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));
    } else {
        // Horizontal orientation
        const y = d3.scaleBand()
            .domain(barData.map(d => d.category))
            .range([0, height - margin.top - margin.bottom])
            .padding(0.1);

        const x = d3.scaleLinear()
            .domain([0, d3.max(barData, d => d.count)])
            .range([0, width - margin.left - margin.right]);

        // Add bars
        svg.selectAll('rect')
            .data(barData)
            .enter()
            .append('rect')
            .attr('y', d => y(d.category))
            .attr('x', 0)
            .attr('height', y.bandwidth())
            .attr('width', d => x(d.count))
            .attr('fill', COLORS.primary);

        // Add axes
        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x));
    }
}

// Add createHistogram function
function createHistogram(variable) {
    const container = d3.select('#chart');
    const width = container.node().getBoundingClientRect().width;
    const height = chartHeight;

    // Clear existing content
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data
    const values = dataset.map(d => +d[variable]).filter(d => !isNaN(d));

    // Create histogram bins
    const histogram = d3.histogram()
        .domain(d3.extent(values))
        .thresholds(d3.thresholdScott)(values);

    // Create scales
    const x = d3.scaleLinear()
        .domain([histogram[0].x0, histogram[histogram.length - 1].x1])
        .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(histogram, d => d.length)])
        .range([height - margin.top - margin.bottom, 0])
        .nice();

    // Add bars
    svg.selectAll('rect')
        .data(histogram)
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0))
        .attr('y', d => y(d.length))
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr('height', d => height - margin.top - margin.bottom - y(d.length))
        .attr('fill', COLORS.primary)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('fill', COLORS.hover);
            
            showTooltip(event, `Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br>Count: ${d.length}`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('fill', COLORS.primary);
            
            hideTooltip();
        });

    // Add axes
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y));

    // Add labels
    svg.append('text')
        .attr('x', width / 2 - margin.left)
        .attr('y', height - margin.bottom / 3)
        .attr('text-anchor', 'middle')
        .text(variable);

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height / 2) + margin.top)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .text('Frequency');
}

// Add these new functions
function initializeChartActions() {
    const downloadBtn = document.getElementById('downloadChart');
    const fullscreenBtn = document.getElementById('fullscreenChart');
    
    downloadBtn.addEventListener('click', () => {
        const svg = document.querySelector('#chart svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'chart.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
    
    fullscreenBtn.addEventListener('click', () => {
        const chartContainer = document.querySelector('.dashboard-card');
        if (chartContainer.requestFullscreen) {
            chartContainer.requestFullscreen();
        }
    });
}