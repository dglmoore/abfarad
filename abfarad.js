/* global document, Plotly */
const { ipcRenderer } = require('electron');
const ABF = require('./abfjs/main');
const stringify = require('csv-stringify');
const fs = require('fs');

const abfarad = Object.assign(Object.create({
    load: function(filename, div='plot') {
        try {
            this.abf = ABF(filename);
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
    },

    export_csv: function(csv_path) {
        if (this.filename === null) {
            ipcRenderer.send('error', {
                title: 'Export Error',
                message: 'Open an ABF file before exporting'
            });
            return;
        }

        let data = new Array(this.abf.data_point_count);
        for (let channel = 0, i = 0; channel < this.abf.channel_count; ++channel) {
            let sample_times = this.abf.sample_times[channel],
                channel_data = this.abf.channel_data[channel],
                t = 0;
            for (let sweep = 0; sweep < this.abf.sweep_count; ++sweep) {
                for (let j = 0; j < this.abf.sweep_point_count; ++i, ++j, ++t) {
                    data[t] = [ channel, sweep, sample_times[t], channel_data[t] ];
                }
            }
        }

        let stringifier = stringify(data, {
            header: true,
            columns: ['channel', 'sweep', 'time', 'data']
        });

        stringifier.on('error', function(err) {
            ipcRenderer.send('error', {
                title: 'Export Error',
                message: 'Cannot format ABF data',
                detail: err.toString()
            });
            stringifier.end();
        }).pipe(fs.createWriteStream(csv_path)).on('error', function(err) {
            ipcRenderer.send('error', {
                title: 'Export Error',
                message: 'Cannot write CSV file',
                detail: err.toString()
            });
        }).on('finish', function() {
            document.getElementById('status').innerHTML = 'Export complete!';
        });
    }
}), { filename: null, abf: null });

ipcRenderer.on('open', function(event, path) {
    abfarad.load(path);
});

ipcRenderer.on('export', function(event, path) {
    abfarad.export_csv(path);
});
