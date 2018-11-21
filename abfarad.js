/* global Plotly */
const { ipcRenderer } = require('electron');
const abfjs = require('abfjs');

const abfarad = Object.assign(Object.create({
    load: function(filename, div='plot') {
        try {
            this.abf = abfjs(filename);
            this.filename = filename;
        } catch (e) {
            ipcRenderer.send('error', {
                title: 'ABF Error',
                message: `Cannot read ABF file "${filename}"`,
                detail: e.toString()
            });
            return;
        }

        const { sweep_x, sweep_x_label, sweep_y, sweep_y_label } = this.abf;

        const trace = {
            x: sweep_x,
            y: sweep_y,
            mode: 'lines'
        };

        const layout = {
            title: `File: ${this.filename}`,
            xaxis: { title: sweep_x_label },
            yaxis: { title: sweep_y_label },
            showLegend: false,
            hovermode: false
        };

        Plotly.newPlot(div, [ trace ], layout, {
            displayLogo: false,
            responsive: true,
            displayModeBar: false
        });
    }
}), { filename: null, abf: null });

ipcRenderer.on('open', function(event, path) {
    abfarad.load(path);
});
