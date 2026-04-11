import { useEffect, useState } from "react"
import { electroview } from "../../shared/shared-electroview";
import { appContextDefaults } from "../../shared/shared-context";
import { ApplicationSettingsType, AvailableThemes } from "../../shared/shared-types";
import Select from "react-select";
import NumberField from "./numberField";

export default function SettingsPane() {
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

	const [settings, setSettings] = useState(appContextDefaults.settings);

	const [outputFolder, setOutputFolder] = useState('');

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
			}
		}

		loadSettings();
	}, []);

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
		}
		else if (submitterName === 'restoredefaults') {
			const res = await electroview.rpc?.request.setSettings({ ...appContextDefaults.settings })
			console.log(res)
			setSettings(appContextDefaults.settings)
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
		setOutputFolder(res.path);
	}


	return (
		<div className="settingspane">
			<div className="settingspane-inner">
				<a href="#" className="settingspane-inner-close">&times;</a>
				<h1 className="settingspane-inner-header">Settings</h1>
				<div className="settingspane-inner-fields">
					<form onSubmit={submitHandler} className="settingspane-inner-fields-form">
						<div className="settingspane-inner-fields-form-fields">
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="theme" className="settingspane-inner-fields-form-fields-field-label">Theme</label>
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
								<label htmlFor="quality" className="settingspane-inner-fields-form-fields-field-label">Default quality</label>
								<NumberField
									min={1}
									max={100}
									name="quality"
									value={settings.quality}
									onChange={(val) => setSettings((current) => ({ ...current, quality: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field number">
								<label htmlFor="effort" className="settingspane-inner-fields-form-fields-field-label">Default effort</label>
								<NumberField
									min={0}
									max={6}
									name="effort"
									value={settings.effort}
									onChange={(val) => setSettings((current) => ({ ...current, effort: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field number">
								<label htmlFor="maxWidth" className="settingspane-inner-fields-form-fields-field-label">Max Width</label>
								<NumberField
									min={0}
									max={16383}
									name="maxWidth"
									value={settings.maxWidth}
									onChange={(val) => setSettings((current) => ({ ...current, maxWidth: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field number">
								<label htmlFor="maxheight" className="settingspane-inner-fields-form-fields-field-label">Max Height</label>
								<NumberField
									min={0}
									max={16383}
									name="maxheight"
									value={settings.maxHeight}
									onChange={(val) => setSettings((current) => ({ ...current, maxHeight: Number(val) }))}
								/>
							</div>
							<div className="settingspane-inner-fields-form-fields-field">
								<label htmlFor="output" className="settingspane-inner-fields-form-fields-field-label">Output Folder</label>
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
								<label htmlFor="language" className="settingspane-inner-fields-form-fields-field-label">Language</label>
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
								<label htmlFor="format" className="settingspane-inner-fields-form-fields-field-label">Format</label>
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
