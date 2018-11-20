const {app, BrowserWindow} = require('electron');

(function() {
    let win = null;

    const create_window = function() {
        win = new BrowserWindow();
        win.loadURL('https://dglmoore.com');
        win.on('closed', function() {
            win = null;
        });
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
})();
