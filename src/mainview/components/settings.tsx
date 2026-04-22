import { useContext, useEffect, useMemo, useState } from "react"
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
	const languageOptions: Array<{ value: AvailableLangs; label: string }> = useMemo(() => {
		const langs = {
			"am": "Amharic",
			"ar": "Arabic",
			"bn": "Bangla",
			"bho": "Bhojpuri",
			"zh": "Chinese",
			"en": "English",
			"fil": "Filipino",
			"fr": "French",
			"de": "German",
			"gu": "Gujarati",
			"ha": "Hausa",
			"hi": "Hindi",
			"id": "Indonesian",
			"it": "Italian",
			"ja": "Japanese",
			"jv": "Javanese",
			"kn": "Kannada",
			"ko": "Korean",
			"ml": "Malayalam",
			"mr": "Marathi",
			"fa": "Persian",
			"pt": "Portuguese",
			"pa": "Punjabi",
			"ru": "Russian",
			"es": "Spanish",
			"sw": "Swahili",
			"ta": "Tamil",
			"te": "Telugu",
			"th": "Thai",
			"tr": "Turkish",
			"ur": "Urdu",
			"vi": "Vietnamese",
			"yo": "Yoruba"
		};
		return (Object.keys(langs) as Array<AvailableLangs>)
			.map((value) => ({
				value,
				label: t(value),
			}))
			.sort((a, b) => a.label.localeCompare(b.label, settings.language, { sensitivity: 'base' }));
	}, [settings.language]);
	const outputFormatOptions: Array<{ value: AvailableOutputFormats; label: string }> = [
		{ value: 'webp', label: 'WebP' },
		{ value: 'png', label: 'PNG' },
		{ value: 'jpeg', label: 'JPEG' },
	];
	const outputFolderOptions: Array<{ value: 'default' | 'custom'; label: string }> = [
		{ value: 'default', label: t('pictures') },
		{ value: 'custom', label: t('custom') },
	];

	const [draftSettings, setDraftSettings] = useState(settings);
	const [settingsPaneOpen, setSettingsPaneOpen] = useState(false);

	useEffect(() => {
		async function loadSettings() {
			try {
				const loadedSettings = await electroview.rpc?.request.getSettings();
				console.log('laoded settings: ', loadedSettings)
					if (loadedSettings) {
						const nextSettings = {
							effort: loadedSettings.effort,
							quality: loadedSettings.quality,
							theme: loadedSettings.theme,
							maxWidth: loadedSettings.maxWidth,
							maxHeight: loadedSettings.maxHeight,
							outputFolder: loadedSettings.outputFolder,
							language: loadedSettings.language,
							outputFormat: loadedSettings.outputFormat,
						};
						setSettings(nextSettings);
						setDraftSettings(nextSettings);
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
			const newSettings = { ...appContextDefaults.settings, ...draftSettings };
			try {
				const res = await electroview.rpc?.request.setSettings(newSettings)
				console.log(res)
				setSettings(newSettings);
				setQuality(newSettings.quality);
				setEffort(newSettings.effort);
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
				setDraftSettings(appContextDefaults.settings)
				setQuality(appContextDefaults.settings.quality);
				setEffort(appContextDefaults.settings.effort);
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
				setDraftSettings((current) => ({
					...current,
					outputFolder: res.path,
				}));
			} catch (error) {
				handleRPCRequestCatch(error)
			}
		}
		else {
			setDraftSettings((current) => ({
				...current,
				outputFolder: '',
			}));
		}
	}
	const outputFolderButtonClickHandler = async () => {
		try {
			const res = await electroview.rpc?.request.openFileDialog() || { path: '' };
			if (res.path.length) {
				setDraftSettings((current) => ({
					...current,
					outputFolder: res.path,
				}));
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
										value={themeOptions.find((option) => option.value === draftSettings.theme)}
										onChange={(option) => {
											if (!option) {
												return;
											}
											setDraftSettings((current) => ({
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
									value={draftSettings.quality}
									onChange={(val) => setDraftSettings((current) => ({ ...current, quality: Number(val) }))}
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
								<div>
									<NumberField
										min={draftSettings.outputFormat === 'webp' ? 0 : 1}
										max={draftSettings.outputFormat === 'webp' ? 6 : 10}
										name="effort"
										value={draftSettings.effort}
										onChange={(val) => setDraftSettings((current) => ({ ...current, effort: Number(val) }))}
									/>
								</div>
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
										value={draftSettings.maxWidth}
										onChange={(val) => setDraftSettings((current) => ({ ...current, maxWidth: Number(val) }))}
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
									value={draftSettings.maxHeight}
									onChange={(val) => setDraftSettings((current) => ({ ...current, maxHeight: Number(val) }))}
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
										value={outputFolderOptions.find((option) => option.value === (draftSettings.outputFolder === '' ? 'default' : 'custom'))}
										onChange={outputFolderSelectHandler}
									/>
									{draftSettings.outputFolder.length ? <><input className="settingspane-inner-fields-form-fields-field-button" onClick={outputFolderButtonClickHandler} type="button" value={t('changeLocation')} />
										<div className="settingspane-inner-fields-form-fields-field-desc">{draftSettings.outputFolder}</div></> : ''}
									<input className="settingspane-inner-fields-form-fields-field-desc" name="outputFolder" type="hidden" readOnly value={draftSettings.outputFolder} />
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
										value={languageOptions.find((option) => option.value === draftSettings.language)}
										onChange={(option) => {
											if (!option) {
												return;
											}
											setDraftSettings((current) => ({
												...current,
												language: option.value,
											}));
									}}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="outputFormat" data-tooltip-id="outputFormat" className="settingspane-inner-fields-form-fields-field-label">{t('format')}</label>
								<Tooltip
									id="outputFormat"
									place="top"
									content={t('formatTooltip')}
									className="tooltip"
								/>
									<Select
										inputId="outputFormat"
										name="outputFormat"
										className="settingspane-inner-fields-form-fields-field-select"
										options={outputFormatOptions}
										value={outputFormatOptions.find((option) => option.value === draftSettings.outputFormat)}
										onChange={(option) => {
											if (!option) {
												return;
											}
											setDraftSettings((current) => ({
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
