/* global d3, Plotly */
const { ipcRenderer } = require('electron');
const ABF = require('../abfjs/main');
const stringify = require('csv-stringify');
const fs = require('fs');

const abfarad = Object.assign(Object.create({
    init: function() {
        const accelerator = (process.platform === 'darwin') ? '⌘+O' : 'Ctrl+O';
        d3.select('#startup a:first-child')
            .html(`Open ABF File (${accelerator})`)
            .on('click', () => this.open());
        this.info('Ready');
    },

    open: function() {
        ipcRenderer.send('open');
    },

    load: function(filename, div='plot') {
        this.info(`Reading ${filename}...`);
        try {
            this.abf = ABF(filename);
            this.filename = filename;
        } catch (e) {
            ipcRenderer.send('error', {
                title: 'ABF Error',
                message: `Cannot read ABF file "${filename}"`,
                detail: e.message
            });
            this.error(`Cannot read ABF file '${filename}', ${e.message}.`);
            return;
        }
        this.info(`Reading of ${this.filename} complete.`);
        this.plot(div);
    },

    plot: function(div='plot') {
        this.info(`Plotting ${this.filename}...`);

        const { sweep_x, sweep_x_label, sweep_y, sweep_y_label } = this.abf;

        const trace = {
            x: sweep_x,
            y: sweep_y,
            mode: 'lines'
        };

        const layout = {
            title: this.filename,
            xaxis: { title: sweep_x_label },
            yaxis: { title: sweep_y_label },
            showLegend: false,
            hovermode: false
        };

        d3.selectAll('#startup').style('display', 'none');
        d3.selectAll('#plot').style('display', 'block');

        Plotly.newPlot(div, [ trace ], layout, {
            displayLogo: false,
            responsive: true,
            displayModeBar: false
        });

        this.info(`Plotting of ${this.filename} complete.`);
    },

    export_csv: function(csv_path) {
        if (this.filename === null) {
            ipcRenderer.send('error', {
                title: 'Export Error',
                message: 'Open an ABF file before exporting'
            });
            this.error('Cannot export before opening an ABF file');
            return;
        }

        this.info('Collecting channel data');
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

        let errored = false,
            stringifier = stringify(data, {
                header: true,
                columns: ['channel', 'sweep', 'time', 'data']
            });

        this.info(`Exporting "${this.filename}" to "${csv_path}"...`);
        stringifier.on('error', (err) => {
            errored = true;
            ipcRenderer.send('error', {
                title: 'Export Error',
                message: 'Cannot format ABF data',
                detail: err.message
            });
            this.error(`Cannot format ABF data, ${err.message}`);
            stringifier.end();
        }).pipe(fs.createWriteStream(csv_path)).on('error', (err) => {
            errored = true;
            ipcRenderer.send('error', {
                title: 'Export Error',
                message: 'Cannot write CSV file',
                detail: err.message
            });
            this.error(`Cannot write CSV file '${csv_path}', ${err.message}`);
        }).on('finish', () => {
            if (!errored) {
                abfarad.info(`Export of "${this.filename}" to "${csv_path}" complete.`);
            }
        });
    },

    info: function(s) {
        d3.select('footer').classed('error', false);
        d3.select('footer').classed('info', true);
        d3.select('footer span:last-child').html(s);
    },

    error: function(s) {
        d3.select('footer').classed('info', false);
        d3.select('footer').classed('error', true);
        d3.select('footer span:last-child').html(s);
    }
}), { filename: null, abf: null });

ipcRenderer.on('ready', function() {
    abfarad.init();
});

ipcRenderer.on('open', function(event, path) {
    abfarad.load(path);
});

ipcRenderer.on('export', function(event, path) {
    abfarad.export_csv(path);
});

ipcRenderer.on('info', function(event, s) {
    abfarad.info(s);
});

ipcRenderer.on('error', function(event, s) {
    abfarad.error(s);
});
