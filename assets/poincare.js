/* global d3, Plotly */
const { ipcRenderer } = require('electron');
const plot = function({ sweep_y, sweep_y_label }, div='plot') {
    const trace = {
        x: sweep_y.slice(0, sweep_y.length-1),
        y: sweep_y.slice(1),
        mode: 'markers',
        type: 'scattergl'
    };

    const layout = {
        title: `Poincaré Plot: (${sweep_y_label})`,
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

ipcRenderer.on('data', function(event, data) {
    plot(data);
});
