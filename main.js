const { app, dialog, ipcMain, BrowserWindow, Menu } = require('electron');

(function() {
    app.commandLine.appendSwitch('--ignore-gpu-blacklist');

    let windows = {
        main: null,
        poincare: null
    };

    const create_window = function() {
        Menu.setApplicationMenu(new Menu.buildFromTemplate([
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Open ABF File',
                        id: 'open',
                        accelerator: 'CommandOrControl+O',
                        click: open_dialog
                    },
                    {
                        label: 'Export CSV',
                        id: 'export',
                        accelerator: 'CommandOrControl+E',
                        enabled: false,
                        click: export_dialog
                    },
                    {
                        label: 'Quit',
                        id: 'quit',
                        role: 'quit'
                    }
                ]
            },
            {
                label: 'Analysis',
                id: 'analysis',
                submenu: [
                    {
                        label: 'Poincaré Plot',
                        id: 'poincaré',
                        accelerator: 'CommandOrControl+P',
                        enabled: false,
                        click: poincare_plot
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Developer Tools',
                        id: 'devtools',
                        role: 'toggleDevTools'
                    },
                    {
                        label: 'Fullscreen',
                        id: 'fullscreen',
                        role: 'toggleFullScreen'
                    }
                ]
            }
        ]));

        windows.main = new BrowserWindow({
            width: 970,
            height: 700,
            show: false
        }).on('ready-to-show', function() {
            windows.main.show();
            windows.main.send('ready');
        }).on('closed', function() {
            BrowserWindow.getAllWindows().forEach((w) => w.close());
            for (let w in windows) {
                windows[w] = null;
            }
        });

        windows.main.loadFile('assets/index.html');
    };

    app.on('ready', create_window);

    app.on('activate', function() {
        if (windows.main === null) {
            create_window();
        }
    });

    app.on('window-all-closed', function() {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    const open_dialog = function(menuItem, browserWindow) {
        let abf_path = dialog.showOpenDialog(browserWindow, {
            title: 'Choose ABF File',
            buttonLabel: 'Open',
            filters: [
                { name: 'ABF', extensions: [ 'abf' ] },
                { name: 'All Files', extensions: [ '*' ] },
            ],
            properties: [
                'openFile'
            ]
        });

        if (abf_path !== undefined) {
            if (abf_path.length === 1) {
                browserWindow.send('open', abf_path[0]);
                app.getApplicationMenu().getMenuItemById('export').enabled = true;
                app.getApplicationMenu().getMenuItemById('poincaré').enabled = true;
            } else {
                error_dialog({
                    title: 'File Open Error',
                    message: 'Too many files selected, select only one'
                });
            }
        }
    };

    const export_dialog = function(menuItem, browserWindow) {
        let export_path = dialog.showSaveDialog(browserWindow, {
            title: 'Export as...',
            buttonLabel: 'Export',
            filters: [
                { name: 'CSV', extensions: [ 'csv' ] },
                { name: 'All Files', extensions: [ '*' ] },
            ],
            properties: [
                'openFile'
            ]
        });

        if (export_path !== undefined) {
            browserWindow.send('export', export_path);
        }
    };

    const poincare_plot = function(menuItem, browserWindow) {
        if (windows.poincare === null) {
            windows.poincare = new BrowserWindow({
                width: 700,
                height: 700,
                show: false
            }).on('ready-to-show', function() {
                // windows.poincare.setMenu(null);
                windows.poincare.show();
                browserWindow.send('poincare');
            }).on('closed', function() {
                windows.poincare = null;
                app.getApplicationMenu().getMenuItemById('poincaré').enabled = true;
            });

            windows.poincare.loadFile('assets/poincare.html');
        }
        app.getApplicationMenu().getMenuItemById('poincaré').enabled = false;
    };

    const error_dialog = function(options) {
        options = Object.assign({
            type: 'error',
            buttons: [ 'OK ']
        }, options);

        dialog.showMessageBox(options);
    };

    ipcMain.on('error', (event, err) => error_dialog(err));

    ipcMain.on('open', () => open_dialog(null, windows.main));

    ipcMain.on('poincare', function(event, data) {
        if (windows.poincare) {
            windows.poincare.send('data', data);
        }
    });
})();
