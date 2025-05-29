import fs from 'fs';
import path from 'path';

/**
 * Extract the directory path from a file path
 * @param {string} filePath - The complete file path
 * @returns {string} - The directory containing the file
 */
export const getFolderPath = (filePath) => {
	return filePath.split('/').slice(0, -1).join('/');
};

export const saveFile = (folder, repoFullName, fullFilePath, content) => {
	const fileName = `${repoFullName}_${fullFilePath}`.replace(/[^.a-zA-Z0-9-]/g, '_');
	const testFilesDir = path.join(process.cwd(), 'test_files', folder);
	if (!fs.existsSync(testFilesDir)) {
		fs.mkdirSync(testFilesDir, { recursive: true });
	}
	const filePath = path.join(testFilesDir, fileName);
	fs.writeFileSync(filePath, content, 'utf8');
	return filePath;
};
