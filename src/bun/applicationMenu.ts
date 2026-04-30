import Electrobun, { Utils, ApplicationMenu, Updater, MessageBoxOptions } from "electrobun/bun";
import { t } from "../lang/lang";
import { getMainWindow } from "./mainWindow";

ApplicationMenu.setApplicationMenu([
	{
		submenu: [
			{ label: t('about'), action: "about" },
			{ label: t('checkForUpdates'), action: "checkforupdates" },
			{ label: t('settings'), action: "settings", accelerator: ',' },
			{ label: t('quit'), role: "quit", accelerator: 'q' }
		],
	}
]);

const currentVersion = await Updater.localInfo.version();

// application menu is open
Electrobun.events.on("application-menu-clicked", async (e) => {
	if (e.data.action === 'settings') {
		getMainWindow().webview.rpc?.send.openSettings()
	}
	else if (e.data.action === 'about') {
		Utils.showMessageBox({
			type: 'info',
			title: '',
			message: `${t('version')}
			${currentVersion}
			
			${t('learnMore')}
			https://zrubinrattet.github.io/moop/

			${t('madeWith')}`
		});
	}
	else if (e.data.action === 'checkforupdates') {
		const updateInfo = await Updater.checkForUpdate();
		let message;
		if (updateInfo.updateAvailable) {
			message = `
				${t('updateAvailable')}
				
				${currentVersion} ${t('to')} ${updateInfo.version}
				`;
		}
		else {
			message = t('upToDate');
		}
		const messageBoxParams: MessageBoxOptions = {
			type: updateInfo.updateAvailable ? 'question' : 'info',
			title: t('checkForUpdates'),
			message: message,
			buttons: updateInfo.updateAvailable ? [t('downloadUpdate'), t('downloadUpdateButton1')] : [],
		}
		if (updateInfo.updateAvailable) {
			messageBoxParams.defaultId = 1;  // Focus "Cancel" by default
			messageBoxParams.cancelId = 1;   // Pressing Escape returns 1 (Cancel)
		}
		const { response } = await Utils.showMessageBox(messageBoxParams);

		// downloading update
		if (updateInfo.updateAvailable && response === 0) {
			await Updater.downloadUpdate();
			if (Updater.updateInfo()?.updateReady) {
				await Updater.applyUpdate();
			}
		}
	}
});