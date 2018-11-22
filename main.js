const { app, dialog, ipcMain, BrowserWindow, Menu } = require('electron');

(function() {
    let win = null;

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

        win = new BrowserWindow({
            width: 970,
            height: 970,
            show: false
        }).on('ready-to-show', function() {
            win.show();
            win.send('ready');
        }).on('closed', function() {
            win = null;
        });

        win.loadFile('assets/index.html');
    };

    app.on('ready', create_window);

    app.on('activate', function() {
        if (win === null) {
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

    const error_dialog = function(options) {
        options = Object.assign({
            type: 'error',
            buttons: [ 'OK ']
        }, options);

        dialog.showMessageBox(options);
    };

    ipcMain.on('error', (event, err) => error_dialog(err));

    ipcMain.on('open', () => open_dialog(null, win));
})();
