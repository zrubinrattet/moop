import { useCallback, useEffect, useRef } from "react";

type NumberFieldProps = {
	min?: number;
	max?: number;
	sensitivity?: number;
	value?: number;
	onChange?: (value: number) => void;
	name: string;
};

export default function NumberField({
	min = 0,
	max = 100,
	sensitivity = 1,
	value = 0,
	onChange,
	name
}: NumberFieldProps) {
	const isActiveRef = useRef(false);
	const yInitialRef = useRef(0);
	const valueInitialRef = useRef(value);

	const updateValue = useCallback((nextValue: number) => {
		const clamped = Math.min(max, Math.max(min, nextValue));
		onChange?.(clamped);
	}, [min, max, onChange]);

	function handlePointerDown(e: React.PointerEvent<HTMLInputElement>) {
		isActiveRef.current = true;
		yInitialRef.current = e.pageY;
		valueInitialRef.current = value;
		e.currentTarget.setPointerCapture?.(e.pointerId);
	}

	useEffect(() => {
		function handlePointerMove(e: PointerEvent) {
			if (!isActiveRef.current) return;

			const delta = (yInitialRef.current - e.pageY) * sensitivity;
			const newValue = Math.round(valueInitialRef.current + delta);
			updateValue(newValue);
		}

		function handlePointerUp() {
			isActiveRef.current = false;
		}

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [sensitivity, updateValue]);

	return (
		<input
			type="number"
			min={min}
			max={max}
			value={value}
			name={name}
			id={name}
			className="settingspane-inner-fields-form-fields-field-number"
			onChange={(e) => updateValue(Number(e.target.value))}
			onPointerDown={handlePointerDown}
		/>
	);
}
