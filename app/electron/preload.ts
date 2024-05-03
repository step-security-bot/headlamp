import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('desktopApi', {
  send: (channel, data) => {
    // allowed channels
    const validChannels = [
      'setMenu',
      'locale',
      'appConfig',
      'pluginsLoaded',
      'run-command',
      'install-plugin',
      'update-plugin',
      'uninstall-plugin',
      'list-plugins',
      'cancel-plugin-process',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'currentMenu',
      'setMenu',
      'locale',
      'appConfig',
      'command-stdout',
      'command-stderr',
      'command-exit',
      'install-plugin-progress',
      'update-plugin-progress',
      'uninstall-plugin-progress',
      'list-plugins',
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
