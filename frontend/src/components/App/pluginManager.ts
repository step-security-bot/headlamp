/**
 * A wrapper class for initiating calls to Electron via desktopApi for managing plugins.
 */
export class PluginManager {
  /**
   * Installs a plugin from the specified URL.
   * @param {string} identifier - The unique identifier for the plugin.
   * @param {string} URL - The URL of the plugin to be installed.
   * @param {(progress: {type: string, message: string}) => void} [progressCallback=null] - Optional callback function to track progress. If not provided, the progress will be tracked internally.
   * @example
   * PluginManager.install('pluginID', 'https://example.com/plugin.zip', (progress) => {
   *   console.log('Installation progress:', progress);
   * });
   */
  static install(
    identifier: string,
    URL: string,
    progressCallback: ((progress: {}) => void) | null = null
  ) {
    window.desktopApi.send('install-plugin', identifier, URL);

    PluginManager.setStatus(
      'Install',
      identifier,
      3,
      '{"type":"info","message":"Plugin Installation Started"}'
    );
    window.desktopApi.receive(
      `install-plugin-progress`,
      (progress: { type: string; message: string }) => {
        if (progressCallback === null) {
          let progressPercentage = 10;
          if (progress?.type === 'info' && progress?.message === 'Fetching Plugin Metadata') {
            progressPercentage = 20;
          }
          if (progress?.type === 'info' && progress?.message === 'Plugin Metadata Fetched') {
            progressPercentage = 30;
          }
          if (progress?.type === 'info' && progress?.message === 'Downloading Plugin') {
            progressPercentage = 50;
          }
          if (progress?.type === 'info' && progress?.message === 'Plugin Downloaded') {
            progressPercentage = 100;
          }
          PluginManager.setStatus(
            'Install',
            identifier,
            progressPercentage,
            JSON.stringify(progress)
          );
        } else {
          progressCallback(progress);
        }
      }
    );
  }

  /**
   * Updates a plugin with the specified name.
   * @param {string} name - The name of the plugin to update.
   * @param {(progress: {type: string, message: string}) => void} [progressCallback=null] - Optional callback function to track progress. If not provided, the progress will be tracked internally.
   * @example
   * PluginManager.update('my-plugin', (progress) => {
   *   console.log('Update progress:', progress);
   * });
   */
  static update(
    identifier: string,
    name: string,
    progressCallback: ((progress: {}) => void) | null = null
  ) {
    window.desktopApi.send('update-plugin', identifier, name);

    PluginManager.setStatus(
      'Update',
      identifier,
      3,
      '{"type":"info","message":"Plugin Updation Started"}'
    );
    window.desktopApi.receive(
      `update-plugin-progress`,
      (progress: { type: string; message: string }) => {
        if (progressCallback === null) {
          let progressPercentage = 10;
          if (progress?.type === 'info' && progress?.message === 'Fetching Plugin Metadata') {
            progressPercentage = 20;
          }
          if (progress?.type === 'info' && progress?.message === 'Plugin Metadata Fetched') {
            progressPercentage = 30;
          }
          if (progress?.type === 'info' && progress?.message === 'Downloading Plugin') {
            progressPercentage = 50;
          }
          if (progress?.type === 'info' && progress?.message === 'Plugin Downloaded') {
            progressPercentage = 100;
          }
          PluginManager.setStatus(
            'Update',
            identifier,
            progressPercentage,
            JSON.stringify(progress)
          );
        } else {
          progressCallback(progress);
        }
      }
    );
  }

  /**
   * Uninstalls a plugin with the specified name.
   * @param {string} name - The name of the plugin to uninstall.
   * @param {(progress: {type: string, message: string}) => void} [progressCallback=null] - Optional callback function to track progress. If not provided, the progress will be tracked internally.
   * @example
   * PluginManager.uninstall('my-plugin', (progress) => {
   *   console.log('Uninstall progress:', progress);
   * });
   */
  static uninstall(
    identifier: string,
    name: string,
    progressCallback: ((progress: {}) => void) | null = null
  ) {
    window.desktopApi.send('uninstall-plugin', name, undefined);

    window.desktopApi.receive(
      `uninstall-plugin-progress`,
      (progress: { type: string; message: string }) => {
        if (progressCallback === null) {
          let progressPercentage = 1;
          if (progress?.type === 'info' && progress?.message === 'Uninstalling Plugin') {
            progressPercentage = 50;
          }
          if (progress?.type === 'info' && progress?.message === 'Plugin Uninstalled') {
            progressPercentage = 100;
          }
          PluginManager.setStatus(
            'Uninstall',
            identifier,
            progressPercentage,
            JSON.stringify(progress)
          );
        } else {
          progressCallback(progress);
        }
      }
    );
  }

  /**
   * Lists all installed plugins.
   * @param {(progress: {}) => void} progressCallback - Callback function to track progress.
   * @example
   * PluginManager.list((plugins) => {
   *   console.log('Installed plugins:', plugins);
   * });
   */
  static list(progressCallback: (progress: {}) => void) {
    window.desktopApi.send('list-plugins');

    window.desktopApi.receive(`list-plugins`, (progress: {}) => {
      progressCallback(progress);
    });
  }

  /**
   * Cancels a plugin process identified by its identifier.Only Install and Update
   * processes can be cancelled.
   * @param {string} identifier - The identifier of the plugin process to cancel.
   * @example
   * PluginManager.cancel('process-123');
   */
  static cancel(identifier: string) {
    window.desktopApi.send('cancel-plugin-process', identifier);
    // remove the status of the identifier
    PluginManager.removeStatus(identifier);
  }

  /**
   * Gets the status of a plugin process identified by its identifier.
   * @param {string} identifier - The identifier of the plugin process to get status for.
   * @returns {object} - The status of the plugin process.
   * @example
   * const status = PluginManager.getStatus('process-123');
   * console.log('Plugin process status:', status);
   *
   * incase the status is not available or is older than 1 minute, it will return null
   */
  static getStatus(identifier: string) {
    const existingStatus = localStorage.getItem('PluginManagerStatus');
    if (existingStatus === null) {
      return null;
    }

    const statusObj = JSON.parse(existingStatus);
    const status = statusObj[identifier];
    if (status === undefined) {
      return null;
    }
    // return only the status only if it was updated in the last 1 minutes
    if (Date.now() - status.timestamp < 60000) {
      const parsedStatus = JSON.parse(status.status);
      return {
        action: status.action,
        progress: status.progress,
        type: parsedStatus.type,
        message: parsedStatus.message,
      };
    }
    PluginManager.removeStatus(identifier);
    return null;
  }

  /**
   * Removes the status of a plugin process identified by its identifier.
   * @param {string} identifier - The identifier of the plugin process to remove status for.
   * @example
   * PluginManager.removeStatus('process-123');
   */
  private static removeStatus(identifier: string) {
    const existingStatus = localStorage.getItem('PluginManagerStatus');
    if (existingStatus === null) {
      return;
    }
    const statusObj = JSON.parse(existingStatus);
    delete statusObj[identifier];
    localStorage.setItem('PluginManagerStatus', JSON.stringify(statusObj));
  }

  /**
   * Sets the status of a plugin process identified by its identifier.
   * @param {string} action - The action being performed on the plugin.
   * @param {string} identifier - The identifier of the plugin process to set status for.
   * @param {number} progress - The progress of the plugin process.
   * @param {string} status - The status of the plugin process.
   * @example
   * PluginManager.setStatus('Install', 'process-123', 10, '{"type":"info","message":"Plugin Installation Started"}');
   */
  private static setStatus(action: string, identifier: string, progress: number, status: string) {
    // store as json string
    let existingStatus = localStorage.getItem('PluginManagerStatus');
    if (existingStatus === null) {
      existingStatus = '{}';
    }
    const statusObj = JSON.parse(existingStatus);
    // overwrite the status of the identifier
    statusObj[identifier] = {
      action: action,
      progress: progress,
      status: status,
      timestamp: Date.now(),
    };
    localStorage.setItem('PluginManagerStatus', JSON.stringify(statusObj));
  }
}
