/**
 * Chart Component - Data Visualization Charts
 * Dominion Wars - Nation Building Strategy Game
 */

class Chart {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.type = options.type || 'line';
        this.data = options.data || { labels: [], datasets: [] };
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            width: 300,
            height: 200,
            colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'],
            ...options
        };
        
        this.canvas = null;
        this.context = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the chart
     */
    init() {
        if (!this.container) {
            console.error('Chart container not found');
            return;
        }

        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d');
        
        this.isInitialized = true;
        this.render();
    }

    /**
     * Render the chart based on type
     */
    render() {
        if (!this.isInitialized || !this.context) return;
        
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set up drawing context
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        switch (this.type) {
            case 'line':
                this.renderLineChart();
                break;
            case 'bar':
                this.renderBarChart();
                break;
            case 'pie':
                this.renderPieChart();
                break;
            case 'doughnut':
                this.renderDoughnutChart();
                break;
            case 'area':
                this.renderAreaChart();
                break;
            default:
                this.renderLineChart();
        }
    }

    /**
     * Render line chart
     */
    renderLineChart() {
        if (!this.data.labels.length || !this.data.datasets.length) return;
        
        const padding = 40;
        const chartWidth = this.canvas.width - padding * 2;
        const chartHeight = this.canvas.height - padding * 2;
        
        // Calculate scales
        const xStep = chartWidth / (this.data.labels.length - 1);
        const maxValue = Math.max(...this.data.datasets.flatMap(d => d.data));
        const minValue = Math.min(...this.data.datasets.flatMap(d => d.data));
        const valueRange = maxValue - minValue || 1;
        
        // Draw grid
        this.drawGrid(padding, chartWidth, chartHeight);
        
        // Draw lines
        this.data.datasets.forEach((dataset, datasetIndex) => {
            const color = dataset.color || this.options.colors[datasetIndex % this.options.colors.length];
            
            this.context.strokeStyle = color;
            this.context.lineWidth = dataset.lineWidth || 2;
            this.context.beginPath();
            
            dataset.data.forEach((value, index) => {
                const x = padding + index * xStep;
                const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                
                if (index === 0) {
                    this.context.moveTo(x, y);
                } else {
                    this.context.lineTo(x, y);
                }
                
                // Draw points
                if (dataset.showPoints !== false) {
                    this.context.fillStyle = color;
                    this.context.beginPath();
                    this.context.arc(x, y, 3, 0, Math.PI * 2);
                    this.context.fill();
                }
            });
            
            this.context.stroke();
        });
        
        // Draw labels
        this.drawLabels(padding, xStep, chartHeight);
        this.drawLegend();
    }

    /**
     * Render bar chart
     */
    renderBarChart() {
        if (!this.data.labels.length || !this.data.datasets.length) return;
        
        const padding = 40;
        const chartWidth = this.canvas.width - padding * 2;
        const chartHeight = this.canvas.height - padding * 2;
        
        const barWidth = chartWidth / this.data.labels.length * 0.8;
        const barSpacing = chartWidth / this.data.labels.length * 0.2;
        
        const maxValue = Math.max(...this.data.datasets.flatMap(d => d.data));
        const scale = chartHeight / maxValue;
        
        // Draw grid
        this.drawGrid(padding, chartWidth, chartHeight);
        
        // Draw bars
        this.data.labels.forEach((label, index) => {
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            
            this.data.datasets.forEach((dataset, datasetIndex) => {
                const value = dataset.data[index] || 0;
                const barHeight = value * scale;
                const y = padding + chartHeight - barHeight;
                
                const color = dataset.color || this.options.colors[datasetIndex % this.options.colors.length];
                
                this.context.fillStyle = color;
                this.context.fillRect(
                    x + datasetIndex * (barWidth / this.data.datasets.length),
                    y,
                    barWidth / this.data.datasets.length,
                    barHeight
                );
            });
        });
        
        // Draw labels
        this.drawBarLabels(padding, barWidth, barSpacing, chartHeight);
        this.drawLegend();
    }

    /**
     * Render pie chart
     */
    renderPieChart() {
        if (!this.data.datasets.length || !this.data.datasets[0].data.length) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        const dataset = this.data.datasets[0];
        const total = dataset.data.reduce((sum, value) => sum + value, 0);
        
        let currentAngle = -Math.PI / 2; // Start at top
        
        dataset.data.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            const color = this.data.colors?.[index] || this.options.colors[index % this.options.colors.length];
            
            // Draw slice
            this.context.fillStyle = color;
            this.context.beginPath();
            this.context.moveTo(centerX, centerY);
            this.context.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            this.context.closePath();
            this.context.fill();
            
            // Draw slice border
            this.context.strokeStyle = '#ffffff';
            this.context.lineWidth = 2;
            this.context.stroke();
            
            // Draw label
            if (this.data.labels && this.data.labels[index]) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                this.context.fillStyle = '#ffffff';
                this.context.font = '12px Arial';
                this.context.textAlign = 'center';
                this.context.fillText(this.data.labels[index], labelX, labelY);
            }
            
            currentAngle += sliceAngle;
        });
        
        this.drawLegend();
    }

    /**
     * Render doughnut chart
     */
    renderDoughnutChart() {
        this.renderPieChart(); // Use pie chart logic but with inner circle
        
        // Draw inner circle to create doughnut effect
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const innerRadius = (Math.min(centerX, centerY) - 40) * 0.5;
        
        this.context.fillStyle = '#ffffff';
        this.context.beginPath();
        this.context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        this.context.fill();
    }

    /**
     * Render area chart
     */
    renderAreaChart() {
        if (!this.data.labels.length || !this.data.datasets.length) return;
        
        const padding = 40;
        const chartWidth = this.canvas.width - padding * 2;
        const chartHeight = this.canvas.height - padding * 2;
        
        const xStep = chartWidth / (this.data.labels.length - 1);
        const maxValue = Math.max(...this.data.datasets.flatMap(d => d.data));
        const minValue = Math.min(...this.data.datasets.flatMap(d => d.data));
        const valueRange = maxValue - minValue || 1;
        
        // Draw grid
        this.drawGrid(padding, chartWidth, chartHeight);
        
        // Draw areas
        this.data.datasets.forEach((dataset, datasetIndex) => {
            const color = dataset.color || this.options.colors[datasetIndex % this.options.colors.length];
            
            // Create gradient
            const gradient = this.context.createLinearGradient(0, padding, 0, padding + chartHeight);
            gradient.addColorStop(0, color + '80'); // 50% opacity
            gradient.addColorStop(1, color + '20'); // 12% opacity
            
            this.context.fillStyle = gradient;
            this.context.beginPath();
            
            // Start from bottom left
            this.context.moveTo(padding, padding + chartHeight);
            
            // Draw the data line
            dataset.data.forEach((value, index) => {
                const x = padding + index * xStep;
                const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                this.context.lineTo(x, y);
            });
            
            // Close to bottom right
            this.context.lineTo(padding + chartWidth, padding + chartHeight);
            this.context.closePath();
            this.context.fill();
            
            // Draw the line on top
            this.context.strokeStyle = color;
            this.context.lineWidth = 2;
            this.context.beginPath();
            
            dataset.data.forEach((value, index) => {
                const x = padding + index * xStep;
                const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                
                if (index === 0) {
                    this.context.moveTo(x, y);
                } else {
                    this.context.lineTo(x, y);
                }
            });
            
            this.context.stroke();
        });
        
        // Draw labels
        this.drawLabels(padding, xStep, chartHeight);
        this.drawLegend();
    }

    /**
     * Draw grid lines
     */
    drawGrid(padding, width, height) {
        this.context.strokeStyle = '#e5e5e5';
        this.context.lineWidth = 1;
        
        // Horizontal grid lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding + (height / gridLines) * i;
            this.context.beginPath();
            this.context.moveTo(padding, y);
            this.context.lineTo(padding + width, y);
            this.context.stroke();
        }
        
        // Vertical grid lines
        const xGridLines = this.data.labels.length - 1;
        for (let i = 0; i <= xGridLines; i++) {
            const x = padding + (width / xGridLines) * i;
            this.context.beginPath();
            this.context.moveTo(x, padding);
            this.context.lineTo(x, padding + height);
            this.context.stroke();
        }
    }

    /**
     * Draw chart labels
     */
    drawLabels(padding, xStep, chartHeight) {
        this.context.fillStyle = '#666666';
        this.context.font = '12px Arial';
        this.context.textAlign = 'center';
        
        this.data.labels.forEach((label, index) => {
            const x = padding + index * xStep;
            const y = padding + chartHeight + 20;
            this.context.fillText(label, x, y);
        });
    }

    /**
     * Draw bar chart labels
     */
    drawBarLabels(padding, barWidth, barSpacing, chartHeight) {
        this.context.fillStyle = '#666666';
        this.context.font = '12px Arial';
        this.context.textAlign = 'center';
        
        this.data.labels.forEach((label, index) => {
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2 + barWidth / 2;
            const y = padding + chartHeight + 20;
            this.context.fillText(label, x, y);
        });
    }

    /**
     * Draw legend
     */
    drawLegend() {
        if (!this.options.showLegend || !this.data.datasets.length) return;
        
        const legendHeight = 20;
        const legendY = this.canvas.height - legendHeight;
        let legendX = 10;
        
        this.context.font = '12px Arial';
        this.context.textAlign = 'left';
        
        this.data.datasets.forEach((dataset, index) => {
            const color = dataset.color || this.options.colors[index % this.options.colors.length];
            const label = dataset.label || `Dataset ${index + 1}`;
            
            // Draw color box
            this.context.fillStyle = color;
            this.context.fillRect(legendX, legendY, 12, 12);
            
            // Draw label
            this.context.fillStyle = '#333333';
            this.context.fillText(label, legendX + 16, legendY + 10);
            
            legendX += this.context.measureText(label).width + 30;
        });
    }

    /**
     * Update chart data
     */
    updateData(data) {
        this.data = { ...this.data, ...data };
        this.render();
    }

    /**
     * Add data point
     */
    addDataPoint(label, values) {
        this.data.labels.push(label);
        
        if (Array.isArray(values)) {
            values.forEach((value, index) => {
                if (this.data.datasets[index]) {
                    this.data.datasets[index].data.push(value);
                }
            });
        } else {
            if (this.data.datasets[0]) {
                this.data.datasets[0].data.push(values);
            }
        }
        
        // Keep only last N points for performance
        const maxPoints = this.options.maxDataPoints || 50;
        if (this.data.labels.length > maxPoints) {
            this.data.labels = this.data.labels.slice(-maxPoints);
            this.data.datasets.forEach(dataset => {
                dataset.data = dataset.data.slice(-maxPoints);
            });
        }
        
        this.render();
    }

    /**
     * Clear chart data
     */
    clearData() {
        this.data.labels = [];
        this.data.datasets.forEach(dataset => {
            dataset.data = [];
        });
        this.render();
    }

    /**
     * Resize chart
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.options.width = width;
        this.options.height = height;
        this.render();
    }

    /**
     * Export chart as image
     */
    exportAsImage() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Destroy chart
     */
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.context = null;
        this.isInitialized = false;
    }

    /**
     * Static method to create resource chart
     */
    static createResourceChart(container, resourceData) {
        return new Chart(container, {
            type: 'line',
            data: {
                labels: resourceData.labels,
                datasets: [
                    {
                        label: 'Money',
                        data: resourceData.money,
                        color: '#10B981'
                    },
                    {
                        label: 'Materials',
                        data: resourceData.materials,
                        color: '#F59E0B'
                    },
                    {
                        label: 'Food',
                        data: resourceData.food,
                        color: '#EF4444'
                    }
                ]
            },
            showLegend: true
        });
    }

    /**
     * Static method to create population chart
     */
    static createPopulationChart(container, populationData) {
        return new Chart(container, {
            type: 'area',
            data: {
                labels: populationData.labels,
                datasets: [{
                    label: 'Population',
                    data: populationData.values,
                    color: '#3B82F6'
                }]
            },
            showLegend: false
        });
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Chart };
}