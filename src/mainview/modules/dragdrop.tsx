import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "../../rpc-schema";

type FileSystemHandleLike = {
	kind: "file" | "directory";
	name: string;
};

type FileSystemFileHandleLike = FileSystemHandleLike & {
	kind: "file";
	getFile(): Promise<File>;
};

type FileSystemDirectoryHandleLike = FileSystemHandleLike & {
	kind: "directory";
	entries(): AsyncIterable<[string, FileSystemHandleLike]>;
};

type WebkitEntryLike = {
	isFile: boolean;
	isDirectory: boolean;
	name: string;
	fullPath: string;
	file?: (callback: (file: File) => void) => void;
	createReader?: () => {
		readEntries: (callback: (entries: WebkitEntryLike[]) => void) => void;
	};
};

type DragItemWithFsAccess = DataTransferItem & {
	getAsFileSystemHandle?: () => Promise<FileSystemHandleLike>;
	webkitGetAsEntry?: () => WebkitEntryLike | null;
};

type DroppedFile = {
	path: string;
	file: File;
	bytes: Uint8Array;
};

const rpc = Electroview.defineRPC<AppRPCSchema>({
	handlers: {
		requests: {},
		messages: {},
	},
});

const electroview = new Electroview({ rpc });


async function readDroppedFile(file: File, path: string): Promise<DroppedFile> {
	const buffer = await file.arrayBuffer();
	return {
		path,
		file,
		bytes: new Uint8Array(buffer),
	};
}

async function collectFromHandle(
	handle: FileSystemHandleLike,
	currentPath = handle.name,
): Promise<DroppedFile[]> {
	if (handle.kind === "file") {
		const file = await (handle as FileSystemFileHandleLike).getFile();
		return [await readDroppedFile(file, currentPath)];
	}

	const files: DroppedFile[] = [];
	for await (const [name, child] of (handle as FileSystemDirectoryHandleLike).entries()) {
		files.push(...(await collectFromHandle(child, `${currentPath}/${name}`)));
	}
	return files;
}

function getFileFromWebkitEntry(entry: WebkitEntryLike): Promise<File> {
	return new Promise((resolve, reject) => {
		if (!entry.file) {
			reject(new Error(`Entry ${entry.fullPath} is not a file`));
			return;
		}
		entry.file(resolve);
	});
}

function readWebkitDirectoryEntries(entry: WebkitEntryLike): Promise<WebkitEntryLike[]> {
	return new Promise((resolve, reject) => {
		const reader = entry.createReader?.();
		if (!reader) {
			reject(new Error(`Entry ${entry.fullPath} is not a directory`));
			return;
		}

		const allEntries: WebkitEntryLike[] = [];
		const pump = () => {
			reader.readEntries((batch) => {
				if (batch.length === 0) {
					resolve(allEntries);
					return;
				}
				allEntries.push(...batch);
				pump();
			});
		};

		pump();
	});
}

async function collectFromWebkitEntry(
	entry: WebkitEntryLike,
	currentPath = entry.fullPath || entry.name,
): Promise<DroppedFile[]> {
	if (entry.isFile) {
		const file = await getFileFromWebkitEntry(entry);
		return [await readDroppedFile(file, currentPath)];
	}

	const children = await readWebkitDirectoryEntries(entry);
	const files: DroppedFile[] = [];
	for (const child of children) {
		files.push(...(await collectFromWebkitEntry(child, `${currentPath}/${child.name}`)));
	}
	return files;
}

export default function DragDrop() {
	function highlight(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.currentTarget.classList.add('highlight');
	}

	function unhighlight(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.currentTarget.classList.remove('highlight');
	}

	async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.currentTarget.classList.remove('highlight');

		const droppedFiles: DroppedFile[] = [];
		const seenPaths = new Set<string>();
		const items = [...e.dataTransfer.items] as DragItemWithFsAccess[];
		const hasDirectoryDrop = items.some((item) => {
			try {
				return item.webkitGetAsEntry?.()?.isDirectory === true;
			} catch {
				return false;
			}
		});

		if (!hasDirectoryDrop) {
			for (const file of e.dataTransfer.files) {
				const droppedFile = await readDroppedFile(file, file.name);
				droppedFiles.push(droppedFile);
				seenPaths.add(droppedFile.path);
			}
		}

		for (const item of items) {
			if (item.kind !== "file") {
				continue;
			}

			try {
				const entry = item.webkitGetAsEntry?.();
				if (entry?.isDirectory) {
					for (const droppedFile of await collectFromWebkitEntry(entry)) {
						if (seenPaths.has(droppedFile.path)) continue;
						droppedFiles.push(droppedFile);
						seenPaths.add(droppedFile.path);
					}
					continue;
				}

				if (item.getAsFileSystemHandle) {
					const handle = await item.getAsFileSystemHandle();
					if (handle.kind === "directory") {
						for (const droppedFile of await collectFromHandle(handle)) {
							if (seenPaths.has(droppedFile.path)) continue;
							droppedFiles.push(droppedFile);
							seenPaths.add(droppedFile.path);
						}
					}
					continue;
				}
			} catch (error) {
				console.warn("failed to read dropped directory item", error);
			}
		}

		const imagesToUpload = [];

		console.log(droppedFiles)
		for (const droppedFile of droppedFiles) {
			imagesToUpload.push({
				path: droppedFile.path,
				name: droppedFile.file.name,
				size: droppedFile.file.size,
				type: droppedFile.file.type,
				bytes: droppedFile.bytes,
			});
			
		}
		console.log("imagestoupload", imagesToUpload);
		try {
			const res = await electroview.rpc?.request.uploadImages(imagesToUpload);
			console.log('response from bun: ', res);
		} catch (error) {
			console.log(error);
		}
	}

	return (
		<div
			className="dragdrop"
			onDragEnter={highlight}
			onDragOver={highlight}
			onDragLeave={unhighlight}
			onDrop={handleDrop}
		>
		</div>
	);
}
