import { useContext, useEffect, useState } from "react"
import { electroview } from "../../shared/shared-electroview";
import { appContextDefaults, sharedContext } from "../../shared/shared-context";
import { ApplicationSettingsType, AvailableThemes } from "../../shared/shared-types";
import Select from "react-select";
import NumberField from "./numberField";
import { Tooltip } from "react-tooltip";
import toast from "react-hot-toast";
import { eventBus } from "../../shared/shared-eventbus";

export default function SettingsPane() {
	const appContext = useContext(sharedContext);
	const { settings, setSettings } = appContext;

	const themeOptions: Array<{ value: AvailableThemes; label: string }> = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'light', label: 'Light' },
	];
	const languageOptions: Array<{ value: 'en-US'; label: string }> = [
		{ value: 'en-US', label: 'English' },
	];
	const outputFormatOptions: Array<{ value: ApplicationSettingsType['outputFormat']; label: string }> = [
		{ value: 'webp', label: 'WebP' },
	];
	const outputFolderOptions: Array<{ value: 'default' | 'custom'; label: string }> = [
		{ value: 'default', label: 'Pictures (default)' },
		{ value: 'custom', label: 'Custom' },
	];

	const [outputFolder, setOutputFolder] = useState('');
	const [settingsPaneOpen, setSettingsPaneOpen] = useState(false);

	useEffect(() => {
		async function loadSettings() {
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
				appContext.setQuality(loadedSettings.quality)
				appContext.setEffort(loadedSettings.effort)
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
	}, []);

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
			console.log(formProps)
			const res = await electroview.rpc?.request.setSettings({ ...appContextDefaults.settings, ...formProps })
			console.log(res)
			const newSettings = { ...appContextDefaults.settings, ...formProps };
			setSettings(newSettings);
			toast(`Settings updated.`, {
				className: 'hottoast'
			});
			appContext.setQuality(newSettings.quality)
			appContext.setEffort(newSettings.effort)
		}
		else if (submitterName === 'restoredefaults') {
			const res = await electroview.rpc?.request.setSettings({ ...appContextDefaults.settings })
			console.log(res)
			setSettings(appContextDefaults.settings)
			toast(`Default settings restored.`, {
				className: 'hottoast'
			});
		}
	}
	const outputFolderSelectHandler = async (option: { value: 'default' | 'custom'; label: string } | null) => {
		if (!option) {
			return;
		}
		if (option.value === 'custom') {
			const res = await electroview.rpc?.request.openFileDialog() || { path: '' };
			setOutputFolder(res.path);
		}
		else {
			setOutputFolder('');
		}
	}
	const outputFolderButtonClickHandler = async () => {
		const res = await electroview.rpc?.request.openFileDialog() || { path: '' };
		if (res.path.length) {
			setOutputFolder(res.path);
		}
	}

	const closeClickHandler = (e: React.MouseEvent) => {
		e.preventDefault();

		setSettingsPaneOpen(false);
	}

	const effortTooltipContent = `Level of CPU effort to reduce file size from 0-6.
	Higher effort means processing will take longer but will usually be better looking & lower in filesize (usually).`;

	const formatTooltipContent = `The output file format. WebP is default and typically offers better compression than the other options.
	It also has wide browser support and offers support for animated formats like gif.
	Jpeg and png are available as well in case the need comes up.`;

	return (
		<div className={'settingspane' + (settingsPaneOpen ? ' active' : '')}>
			<div className="settingspane-inner">
				<a href="#" onClick={closeClickHandler} className="settingspane-inner-close">&times;</a>
				<h1 className="settingspane-inner-header">Settings</h1>
				<div className="settingspane-inner-fields">
					<form onSubmit={submitHandler} className="settingspane-inner-fields-form">
						<div className="settingspane-inner-fields-form-fields">
							<div className="settingspane-inner-fields-form-fields-field">
								<label data-tooltip-id="theme" htmlFor="theme" className="settingspane-inner-fields-form-fields-field-label">Theme</label>
								<Tooltip
									id="theme"
									place="top"
									content="The display theme of the app. Auto defaults to your systems preference."
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
								<label data-tooltip-id="quality" htmlFor="quality" className="settingspane-inner-fields-form-fields-field-label">Default Quality</label>
								<Tooltip
									id="quality"
									place="top"
									content="Compression quality from 1-100. Higher quality means less compression and larger files."
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
								<label data-tooltip-id="effort" htmlFor="effort" className="settingspane-inner-fields-form-fields-field-label">Default Effort</label>
								<Tooltip
									id="effort"
									place="top"
									content={effortTooltipContent}
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
								<label htmlFor="maxWidth" data-tooltip-id="maxwidth" className="settingspane-inner-fields-form-fields-field-label">Max Width</label>
								<Tooltip
									id="maxwidth"
									place="top"
									content="The max width to resize to of the output image. Enter 0 for no resize clamping on this axis."
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
								<label htmlFor="maxheight" data-tooltip-id="maxheight" className="settingspane-inner-fields-form-fields-field-label">Max Height</label>
								<Tooltip
									id="maxheight"
									place="top"
									content="The max height to resize to of the output image. Enter 0 for no resize clamping on this axis."
									className="tooltip"
								/>
								<NumberField
									min={0}
									max={16383}
									name="maxheight"
									value={settings.maxHeight}
									onChange={(val) => setSettings((current) => ({ ...current, maxHeight: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="output" data-tooltip-id="outputfolder" className="settingspane-inner-fields-form-fields-field-label">Output Folder</label>
								<Tooltip
									id="outputfolder"
									place="top"
									content="By default your user's Pictures folder is used for the root of the output folders. You may also set a custom direectory."
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
								{outputFolder.length ? <><input className="settingspane-inner-fields-form-fields-field-button" onClick={outputFolderButtonClickHandler} type="button" value="Change location" />
									<div className="settingspane-inner-fields-form-fields-field-desc">{outputFolder}</div></> : ''}
								<input className="settingspane-inner-fields-form-fields-field-desc" name="customOutputFolder" type="hidden" readOnly value={outputFolder} />
							</div>
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="language" data-tooltip-id="language" className="settingspane-inner-fields-form-fields-field-label">Language</label>
								<Tooltip
									id="language"
									place="top"
									content="The written language used throughout the app."
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
								<label htmlFor="format" data-tooltip-id="format" className="settingspane-inner-fields-form-fields-field-label">Format</label>
								<Tooltip
									id="format"
									place="top"
									content={formatTooltipContent}
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
						<button className="settingspane-inner-fields-form-field-submit" name="save" type="submit">Save</button>
						<button className="settingspane-inner-fields-form-field-submit" name="restoredefaults" type="submit">Restore Defaults</button>
					</form>
				</div>
			</div>
		</div>
	);
}
