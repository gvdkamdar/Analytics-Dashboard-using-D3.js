const state = {
    fullData: [],
    currentData: [],
    scatterData: [],
    orientation: "vertical",
    scatterXVar: null,
    scatterYVar: null,
    chartDimensions: {
        width: 0,
        height: 0,
        margin: { top: 40, right: 40, bottom: 60, left: 60 }
    }
};

// Load and process data
async function loadData() {
    try {
        // Load CSV file using fetch instead of window.fs
        const response = await fetch('data/spotify-2023.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fileData = await response.text();
        
        // Parse CSV data
        Papa.parse(fileData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    console.log('Data loaded:', results.data[0]); // Debug log
                    
                    // Store parsed data
                    state.fullData = results.data;
                    state.currentData = results.data;
                    state.scatterData = results.data;

                    // Process numeric columns
                    state.fullData.forEach(d => {
                        for (let key in d) {
                            if (typeof d[key] === 'string' && !isNaN(d[key])) {
                                d[key] = parseFloat(d[key]);
                            }
                        }
                    });

                    // Initialize dropdowns
                    populateSelectOptions();

                    // Set default scatter plot variables
                    state.scatterXVar = 'danceability_%';
                    state.scatterYVar = 'energy_%';

                    // Draw initial charts
                    updateChartDimensions();
                    drawBarHistChart();
                    drawScatterPlot();
                } else {
                    console.error('No data found in CSV');
                }
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
            }
        });
    } catch (error) {
        console.error('Error loading file:', error);
        console.error('Error details:', error.message);
    }
}

// Populate select dropdowns with column names
function populateSelectOptions() {
    const variables = Object.keys(state.fullData[0]);
    const barHistSelect = document.getElementById('barHistSelect');
    const scatterSelect = document.getElementById('scatterSelect');

    // Clear existing options
    barHistSelect.innerHTML = '';
    scatterSelect.innerHTML = '';

    // Add options to both selects
    variables.forEach(variable => {
        // Format variable name for display
        const displayName = variable
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Bar/Hist select
        const barOption = document.createElement('option');
        barOption.value = variable;
        barOption.textContent = displayName;
        barHistSelect.appendChild(barOption);

        // Scatter select
        const scatterOption = document.createElement('option');
        scatterOption.value = variable;
        scatterOption.textContent = displayName;
        scatterSelect.appendChild(scatterOption);
    });
}

// Check if a variable is numeric
function isNumericVariable(data, varName) {
    if (!data.length) return false;
    const sampleSize = Math.min(data.length, 20);
    let numericCount = 0;

    for (let i = 0; i < sampleSize; i++) {
        const value = data[i][varName];
        if (typeof value === 'number' && !isNaN(value)) {
            numericCount++;
        }
    }

    return (numericCount / sampleSize) > 0.7;
}

// Draw Bar Chart
function drawBarChart(container, data, varName, orientation = state.orientation) {
    // Clear existing content
    container.selectAll('*').remove();

    // Process data
    const counts = d3.rollup(
        data,
        v => v.length,
        d => d[varName]
    );

    const chartData = Array.from(counts, ([key, value]) => ({
        category: key,
        count: value
    })).sort((a, b) => b.count - a.count);

    // Get dimensions
    const margin = {
        top: 40,
        right: 40,
        bottom: 80,  // Increased to accommodate rotated labels
        left: 60
    };
    const width = state.chartDimensions.width - margin.left - margin.right;
    const height = state.chartDimensions.height - margin.top - margin.bottom;

    // Create SVG
    const svg = container.append('svg')
        .attr('width', state.chartDimensions.width)
        .attr('height', state.chartDimensions.height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    if (orientation === 'vertical') {
        // Vertical orientation
        const xScale = d3.scaleBand()
            .domain(chartData.map(d => d.category))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.count)])
            .range([height, 0])
            .nice();

        // Add bars
        g.selectAll('.bar')
            .data(chartData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.category))
            .attr('width', xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .transition()
            .duration(750)
            .attr('y', d => yScale(d.count))
            .attr('height', d => height - yScale(d.count));

        // Update x-axis
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        // Update y-axis
        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .attr('dx', '-.5em');

        // Add axis labels
        g.append('text')
            .attr('class', 'x-label axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 5)
            .text(varName.replace(/_/g, ' '));

        g.append('text')
            .attr('class', 'y-label axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', `rotate(-90) translate(${-height/2},${-margin.left + 15})`)
            .text('Count');

    } else {
        // Horizontal orientation
        const yScale = d3.scaleBand()
            .domain(chartData.map(d => d.category))
            .range([0, height])
            .padding(0.1);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.count)])
            .range([0, width])
            .nice();

        // Add bars
        g.selectAll('.bar')
            .data(chartData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => yScale(d.category))
            .attr('height', yScale.bandwidth())
            .attr('x', 0)
            .attr('width', 0)
            .transition()
            .duration(750)
            .attr('width', d => xScale(d.count));

        // Add axes
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));
    }

    // Add title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', state.chartDimensions.width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .text(`Distribution of ${varName.replace(/_/g, ' ')}`);
}

// Draw Histogram
function drawHistogram(container, data, varName, orientation = state.orientation) {
    // Clear existing content
    container.selectAll('*').remove();

    // Extract numeric values
    const values = data.map(d => d[varName]).filter(v => !isNaN(v));

    // Create SVG
    const svg = container.append('svg')
        .attr('width', state.chartDimensions.width)
        .attr('height', state.chartDimensions.height);

    const margin = state.chartDimensions.margin;
    const width = state.chartDimensions.width - margin.left - margin.right;
    const height = state.chartDimensions.height - margin.top - margin.bottom;

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create histogram bins
    const histogram = d3.histogram()
        .domain(d3.extent(values))
        .thresholds(20);

    const bins = histogram(values);

    if (orientation === 'vertical') {
        // Vertical orientation
        const xScale = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([height, 0])
            .nice();

        // Add bars
        g.selectAll('.bar')
            .data(bins)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.x0))
            .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
            .attr('y', height)
            .attr('height', 0)
            .transition()
            .duration(750)
            .attr('y', d => yScale(d.length))
            .attr('height', d => height - yScale(d.length));

        // Add axes
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));

    } else {
        // Horizontal orientation
        const yScale = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([0, height]);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([0, width])
            .nice();

        // Add bars
        g.selectAll('.bar')
            .data(bins)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => yScale(d.x0))
            .attr('height', Math.max(0, yScale(bins[0].x1) - yScale(bins[0].x0) - 1))
            .attr('x', 0)
            .attr('width', 0)
            .transition()
            .duration(750)
            .attr('width', d => xScale(d.length));

        // Add axes
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));
    }

    // Add title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', state.chartDimensions.width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .text(`Distribution of ${varName.replace(/_/g, ' ')}`);
}

// Draw Bar/Histogram Chart based on data type
function drawBarHistChart() {
    const container = d3.select('#barHistChart');
    const selectedVar = document.getElementById('barHistSelect').value;

    if (!state.currentData.length || !selectedVar) return;

    const isNumeric = isNumericVariable(state.currentData, selectedVar);
    
    if (isNumeric) {
        drawHistogram(container, state.currentData, selectedVar, state.orientation);
    } else {
        drawBarChart(container, state.currentData, selectedVar, state.orientation);
    }
}

// Draw Scatter Plot
function drawScatterPlot() {
    const container = d3.select('#scatterPlotChart');
    
    if (!state.scatterData.length || !state.scatterXVar || !state.scatterYVar) return;

    // Clear existing content
    container.selectAll('*').remove();

    // Create SVG
    const svg = container.append('svg')
        .attr('width', state.chartDimensions.width)
        .attr('height', state.chartDimensions.height);

    const margin = state.chartDimensions.margin;
    const width = state.chartDimensions.width - margin.left - margin.right;
    const height = state.chartDimensions.height - margin.top - margin.bottom;

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(state.scatterData, d => d[state.scatterXVar]))
        .range([0, width])
        .nice();

    const yScale = d3.scaleLinear()
        .domain(d3.extent(state.scatterData, d => d[state.scatterYVar]))
        .range([height, 0])
        .nice();

    // Add points
    g.selectAll('.point')
        .data(state.scatterData)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(d[state.scatterXVar]))
        .attr('cy', d => yScale(d[state.scatterYVar]))
        .attr('r', 4)
        .style('fill', 'steelblue')
        .style('opacity', 0.6);

    // Add axes
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));

    // Update scatter plot labels
    svg.append('text')
        .attr('class', 'x-label axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2 + margin.left)
        .attr('y', height + margin.top + 40)
        .text(state.scatterXVar.replace(/_/g, ' '));

    svg.append('text')
        .attr('class', 'y-label axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', `rotate(-90) translate(${-height/2},${margin.left - 40})`)
        .text(state.scatterYVar.replace(/_/g, ' '));
}

// Update chart dimensions based on container size
function updateChartDimensions() {
    const barHistChart = document.getElementById('barHistChart');
    if (barHistChart) {
        const rect = barHistChart.getBoundingClientRect();
        state.chartDimensions = {
            width: Math.max(rect.width, 300),
            height: Math.max(rect.height, 200),
            margin: { top: 40, right: 40, bottom: 60, left: 60 }
        };
    }
}

// Add this function for chart download
function downloadChart(chartId) {
    const svg = document.querySelector(`#${chartId} svg`);
    if (!svg) {
        console.error('No chart to download');
        return;
    }

    // Get SVG data
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(svgBlob);
    downloadLink.download = `${chartId}_${new Date().toISOString()}.svg`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
}

// Update event listeners
function setupEventListeners() {
    // Bar/Histogram controls
    document.getElementById('barHistSelect').addEventListener('change', drawBarHistChart);
    document.getElementById('barHistFlipOrientation').addEventListener('click', () => {
        state.orientation = state.orientation === 'vertical' ? 'horizontal' : 'vertical';
        drawBarHistChart();
    });

    // Scatter plot controls
    document.getElementById('scatterAssign').addEventListener('click', () => {
        const selectedVar = document.getElementById('scatterSelect').value;
        const axis = document.querySelector('input[name="scatterAxis"]:checked').value;
        
        if (axis === 'x') {
            state.scatterXVar = selectedVar;
        } else {
            state.scatterYVar = selectedVar;
        }
        
        drawScatterPlot();
    });

    // Window resize handler
    window.addEventListener('resize', () => {
        updateChartDimensions();
        drawBarHistChart();
        drawScatterPlot();
    });

    // Add refresh button listeners
    document.querySelectorAll('.card-action-btn').forEach(btn => {
        if (btn.title === 'Download Chart') {
            btn.addEventListener('click', function() {
                const card = this.closest('.dashboard-card');
                const chartId = card.querySelector('.card-content').id;
                downloadChart(chartId);
            });
        } else if (btn.title === 'Refresh') {
            btn.addEventListener('click', function() {
                const card = this.closest('.dashboard-card');
                const chartId = card.querySelector('.card-content').id;
                
                // Refresh appropriate chart
                if (chartId === 'barHistChart') {
                    drawBarHistChart();
                } else if (chartId === 'scatterPlotChart') {
                    drawScatterPlot();
                }
            });
        }
    });
}

// Add this to your existing code
function setupFileUpload() {
    const fileInput = document.getElementById('csvFileUpload');
    const uploadStatus = document.getElementById('uploadStatus');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            uploadStatus.textContent = 'Reading file...';
            uploadStatus.className = 'upload-status';

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    Papa.parse(event.target.result, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true,
                        complete: function(results) {
                            if (results.data && results.data.length > 0) {
                                // Update state with new data
                                state.fullData = results.data;
                                state.currentData = results.data;
                                state.scatterData = results.data;

                                // Process numeric columns
                                state.fullData.forEach(d => {
                                    for (let key in d) {
                                        if (typeof d[key] === 'string' && !isNaN(d[key])) {
                                            d[key] = parseFloat(d[key]);
                                        }
                                    }
                                });

                                // Reinitialize visualizations
                                populateSelectOptions();
                                drawBarHistChart();
                                drawScatterPlot();

                                uploadStatus.textContent = 'File uploaded successfully!';
                                uploadStatus.className = 'upload-status upload-success';
                            }
                        },
                        error: function(error) {
                            uploadStatus.textContent = 'Error parsing CSV: ' + error.message;
                            uploadStatus.className = 'upload-status upload-error';
                        }
                    });
                } catch (error) {
                    uploadStatus.textContent = 'Error reading file: ' + error.message;
                    uploadStatus.className = 'upload-status upload-error';
                }
            };

            reader.onerror = function() {
                uploadStatus.textContent = 'Error reading file!';
                uploadStatus.className = 'upload-status upload-error';
            };

            reader.readAsText(file);
        }
    });
}

// Initialize dashboard
function init() {
    setupEventListeners();
    setupFileUpload();
    updateChartDimensions();
    loadData();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);