/* global d3, Plotly */
const { ipcRenderer } = require('electron');

const stddev = function(data) {
    const μ = data.reduce((acc, x) => acc + x) / data.length;
    return Math.sqrt(data.reduce((acc, x) => acc + (x - μ)**2) / (data.length - 1));
};

const plot = function({ x, y, label }, div='plot') {
    const trace = {
        x: x,
        y: y,
        mode: 'markers',
        type: 'scattergl'
    };

    const layout = {
        title: `Poincaré Plot: (${label})`,
        xaxis: { title: 'xₜ' },
        yaxis: { title: 'xₜ₊₁'},
        showLegend: false,
        hovermode: false
    };

    d3.selectAll('#plot').style('display', 'block');

    Plotly.newPlot(div, [ trace ], layout, {
        displayLogo: false,
        responsive: true,
        displayModeBar: false
    });
};

const deviations = function(x, y) {
    const root_2 = Math.sqrt(2);

    const data = new Array(x.length);
    for (let i = 0, len = data.length; i < len; ++i) {
        data[i] = (y[i] - x[i]) / root_2;
    }
    const σ1 = stddev(data);

    for (let i = 0, len = data.length; i < len; ++i) {
        data[i] = (x[i] + y[i]) / root_2;
    }
    const σ2 = stddev(data);

    return { σ1, σ2 };
};

ipcRenderer.on('data', function(event, { sweep_y, sweep_y_label }) {
    const x = sweep_y.slice(0, sweep_y.length - 1);
    const y = sweep_y.slice(1);

    const { σ1, σ2 } = deviations(x, y);

    d3.select('#sigma1').attr('value', σ1.toFixed(3));
    d3.select('#sigma2').attr('value', σ2.toFixed(3));
    d3.select('#sigma12').attr('value', (σ1/σ2).toFixed(3));

    d3.select('#loading').remove();
    d3.select('#data').style('display', 'flex');
    plot({
        x: x,
        y: y,
        label: sweep_y_label
    });
});
