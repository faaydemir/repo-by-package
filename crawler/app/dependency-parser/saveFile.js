import fs from 'fs';
import path from 'path';

const saveFile = (folder, repoFullName, fullFilePath, content) => {
	const fileName = `${repoFullName}_${fullFilePath}`.replace(/[^.a-zA-Z0-9-]/g, '_');
	const testFilesDir = path.join(process.cwd(), 'test_files', folder);
	if (!fs.existsSync(testFilesDir)) {
		fs.mkdirSync(testFilesDir, { recursive: true });
	}
	const filePath = path.join(testFilesDir, fileName);
	fs.writeFileSync(filePath, content, 'utf8');
	return filePath;
};

export default saveFile;
