import { useContext, useEffect, useState } from "react"
import { electroview } from "../../shared/shared-electroview";
import { appContextDefaults, sharedContext } from "../../shared/shared-context";
import { AvailableLangs, AvailableOutputFormats, AvailableThemes } from "../../shared/shared-types";
import Select from "react-select";
import NumberField from "./numberField";
import { Tooltip } from "react-tooltip";
import toast from "react-hot-toast";
import { eventBus } from "../../shared/shared-eventbus";
import { setLocale, t } from "../lang/lang";
import { handleRPCRequestCatch } from "../../shared/shared-utils";

export default function SettingsPane() {
	const appContext = useContext(sharedContext);
	const { settings, setSettings, setQuality, setEffort } = appContext;

	const themeOptions: Array<{ value: AvailableThemes; label: string }> = [
		{ value: 'auto', label: t('auto') },
		{ value: 'dark', label: t('dark') },
		{ value: 'light', label: t('light') },
	];
	const languageOptions: Array<{ value: AvailableLangs; label: string }> = [
		{ value: 'en', label: t('en') },
		{ value: 'es', label: t('es') }
	];
	const outputFormatOptions: Array<{ value: AvailableOutputFormats; label: string }> = [
		{ value: 'webp', label: 'WebP' },
	];
	const outputFolderOptions: Array<{ value: 'default' | 'custom'; label: string }> = [
		{ value: 'default', label: t('pictures') },
		{ value: 'custom', label: t('custom') },
	];

	const [outputFolder, setOutputFolder] = useState('');
	const [settingsPaneOpen, setSettingsPaneOpen] = useState(false);

	useEffect(() => {
		async function loadSettings() {
			try {
				const loadedSettings = await electroview.rpc?.request.getSettings();
				console.log('laoded settings: ', loadedSettings)
				if (loadedSettings) {
					setSettings({
						effort: loadedSettings.effort,
						quality: loadedSettings.quality,
						theme: loadedSettings.theme,
						maxWidth: loadedSettings.maxWidth,
						maxHeight: loadedSettings.maxHeight,
						outputFolder: loadedSettings.outputFolder,
						language: loadedSettings.language,
						outputFormat: loadedSettings.outputFormat,
					});
					setOutputFolder(loadedSettings.outputFolder ?? '');
					setQuality(loadedSettings.quality);
					setEffort(loadedSettings.effort);
					setLocale(loadedSettings.language);
				}
			} catch (error) {
				handleRPCRequestCatch(error);
			}
		}

		loadSettings();

		const openSettingsHandler = () => {
			setSettingsPaneOpen(true)
			console.log('settings open')
		};

		eventBus.addEventListener('openSettings', openSettingsHandler)

		return () => {
			eventBus.removeEventListener('openSettings', openSettingsHandler)
		};
	}, [setQuality, setEffort, setSettings]);

	useEffect(() => {
		if (!settingsPaneOpen) {
			return;
		}

		const keyDownHandler = (e: KeyboardEvent) => {
			if (e.key === 'Escape' || e.key === 'Esc') {
				e.preventDefault();
				e.stopPropagation();
				setSettingsPaneOpen(false);
			}
		};

		window.addEventListener('keydown', keyDownHandler, { capture: true });
		return () => {
			window.removeEventListener('keydown', keyDownHandler, { capture: true });
		};
	}, [settingsPaneOpen]);

	const submitHandler = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitterName = e.nativeEvent.submitter?.getAttribute('name');
		console.log('submithander', submitterName)
		if (submitterName === 'save') {
			const formData = new FormData(e.currentTarget);
			const formProps = Object.fromEntries(formData)
			delete formProps.output;
			console.log(formProps)
			delete formProps.output;
			try {
				const res = await electroview.rpc?.request.setSettings({ ...appContextDefaults.settings, ...formProps })
				console.log(res)
				const newSettings = { ...appContextDefaults.settings, ...formProps };
				setSettings(newSettings);
				setLocale(newSettings.language);
				toast(t('settingsUpdated'), {
					className: 'hottoast'
				});
			} catch (error) {
				handleRPCRequestCatch(error)
			}
		}
		else if (submitterName === 'restoredefaults') {
			try {
				const res = await electroview.rpc?.request.setSettings({ ...appContextDefaults.settings })
				console.log(res)
				setSettings(appContextDefaults.settings)
				setLocale(appContextDefaults.settings.language);
				toast(t('settingsRestoredDefaults'), {
					className: 'hottoast'
				});
			} catch (error) {
				handleRPCRequestCatch(error)
			}

		}
	}
	const outputFolderSelectHandler = async (option: { value: 'default' | 'custom'; label: string } | null) => {
		if (!option) {
			return;
		}
		if (option.value === 'custom') {
			try {
				const res = await electroview.rpc?.request.openFileDialog() || { path: '' };
				setOutputFolder(res.path);
			} catch (error) {
				handleRPCRequestCatch(error)
			}
		}
		else {
			setOutputFolder('');
		}
	}
	const outputFolderButtonClickHandler = async () => {
		try {
			const res = await electroview.rpc?.request.openFileDialog() || { path: '' };
			if (res.path.length) {
				setOutputFolder(res.path);
			}
		} catch (error) {
			handleRPCRequestCatch(error)
		}
	}

	const closeClickHandler = (e: React.MouseEvent) => {
		e.preventDefault();

		setSettingsPaneOpen(false);
	}

	return (
		<div className={'settingspane' + (settingsPaneOpen ? ' active' : '')}>
			<div className="settingspane-inner">
				<a href="#" onClick={closeClickHandler} className="settingspane-inner-close">&times;</a>
				<h1 className="settingspane-inner-header">{t('settings')}</h1>
				<div className="settingspane-inner-fields">
					<form onSubmit={submitHandler} className="settingspane-inner-fields-form">
						<div className="settingspane-inner-fields-form-fields">
							<div className="settingspane-inner-fields-form-fields-field">
								<label data-tooltip-id="theme" htmlFor="theme" className="settingspane-inner-fields-form-fields-field-label">{t('theme')}</label>
								<Tooltip
									id="theme"
									place="top"
									content={t('theme')}
									className="tooltip"
								/>
								<Select
									inputId="theme"
									name="theme"
									className="settingspane-inner-fields-form-fields-field-select"
									options={themeOptions}
									value={themeOptions.find((option) => option.value === settings.theme)}
									onChange={(option) => {
										if (!option) {
											return;
										}
										setSettings((current) => ({
											...current,
											theme: option.value,
										}));
									}}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field number">
								<label data-tooltip-id="quality" htmlFor="quality" className="settingspane-inner-fields-form-fields-field-label">{t('defaultQuality')}</label>
								<Tooltip
									id="quality"
									place="top"
									content={t('qualityTooltip')}
									className="tooltip"
								/>
								<NumberField
									min={1}
									max={100}
									name="quality"
									value={settings.quality}
									onChange={(val) => setSettings((current) => ({ ...current, quality: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field number">
								<label data-tooltip-id="effort" htmlFor="effort" className="settingspane-inner-fields-form-fields-field-label">{t('defaultEffort')}</label>
								<Tooltip
									id="effort"
									place="top"
									content={t('effortTooltip')}
									className="tooltip"
								/>
								<NumberField
									min={0}
									max={6}
									name="effort"
									value={settings.effort}
									onChange={(val) => setSettings((current) => ({ ...current, effort: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field number">
								<label htmlFor="maxWidth" data-tooltip-id="maxwidth" className="settingspane-inner-fields-form-fields-field-label">{t('maxWidth')}</label>
								<Tooltip
									id="maxwidth"
									place="top"
									content={t('maxWidthTooltip')}
									className="tooltip"
								/>
								<NumberField
									min={0}
									max={16383}
									name="maxWidth"
									value={settings.maxWidth}
									onChange={(val) => setSettings((current) => ({ ...current, maxWidth: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field number">
								<label htmlFor="maxHeight" data-tooltip-id="maxheight" className="settingspane-inner-fields-form-fields-field-label">{t('maxHeight')}</label>
								<Tooltip
									id="maxheight"
									place="top"
									content={t('maxHeightTooltip')}
									className="tooltip"
								/>
								<NumberField
									min={0}
									max={16383}
									name="maxHeight"
									value={settings.maxHeight}
									onChange={(val) => setSettings((current) => ({ ...current, maxHeight: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="output" data-tooltip-id="outputfolder" className="settingspane-inner-fields-form-fields-field-label">{t('outputFolder')}</label>
								<Tooltip
									id="outputfolder"
									place="top"
									content={t('outputFolderTooltip')}
									className="tooltip"
								/>
								<Select
									inputId="output"
									name="output"
									className="settingspane-inner-fields-form-fields-field-select"
									options={outputFolderOptions}
									value={outputFolderOptions.find((option) => option.value === (outputFolder === '' ? 'default' : 'custom'))}
									onChange={outputFolderSelectHandler}
								/>
								{outputFolder.length ? <><input className="settingspane-inner-fields-form-fields-field-button" onClick={outputFolderButtonClickHandler} type="button" value={t('changeLocation')} />
									<div className="settingspane-inner-fields-form-fields-field-desc">{outputFolder}</div></> : ''}
								<input className="settingspane-inner-fields-form-fields-field-desc" name="outputFolder" type="hidden" readOnly value={outputFolder} />
							</div>
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="language" data-tooltip-id="language" className="settingspane-inner-fields-form-fields-field-label">{t('language')}</label>
								<Tooltip
									id="language"
									place="top"
									content={t('languageTooltip')}
									className="tooltip"
								/>
								<Select
									inputId="language"
									name="language"
									className="settingspane-inner-fields-form-fields-field-select"
									options={languageOptions}
									value={languageOptions.find((option) => option.value === settings.language)}
									onChange={(option) => {
										if (!option) {
											return;
										}
										setSettings((current) => ({
											...current,
											language: option.value,
										}));
									}}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="format" data-tooltip-id="format" className="settingspane-inner-fields-form-fields-field-label">{t('format')}</label>
								<Tooltip
									id="format"
									place="top"
									content={t('formatTooltip')}
									className="tooltip"
								/>
								<Select
									inputId="format"
									name="format"
									className="settingspane-inner-fields-form-fields-field-select"
									options={outputFormatOptions}
									value={outputFormatOptions.find((option) => option.value === settings.outputFormat)}
									onChange={(option) => {
										if (!option) {
											return;
										}
										setSettings((current) => ({
											...current,
											outputFormat: option.value,
										}));
									}}
								/>
							</div>
						</div>
						<button className="settingspane-inner-fields-form-field-submit" name="save" type="submit">{t('save')}</button>
						<button className="settingspane-inner-fields-form-field-submit" name="restoredefaults" type="submit">{t('restoreDefaults')}</button>
					</form>
				</div>
			</div>
		</div>
	);
}
