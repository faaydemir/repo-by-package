import githubClient from '../github-client.js';
import { Project, RepoDependencyList, RepoDependency, UnprocessableRepoError } from '../repo-dependency-list.js';
import { getFolderPath } from '../utils.js';
import peggy from 'peggy';

const GO_PROVIDER = 'go';

/* PEG grammar for parse reuired dependencies ignore other declarations. ! Mostly works but not all cases */
const GO_REQUIRE_PEG_GRAMMER = `GoMod         = (Directive / Newline )* End
Directive     = RequireDecl / OtherDecl

RequireDecl   = "require" Break ( "(" RequireSpecLine* ")" / RequireSpec)
RequireSpecLine = BreakOptional (CommentLine / RequireSpec) BreakOptional

RequireSpec = mp:ModulePath Space v:Version c:CommentLine? { 
  return { type: "RequireSpec", module: mp, version: v, comment: c ?? null }; 
}
OtherDecl     = [^\\n]* Newline

ModulePath    = AnyText
Version       = AnyText
CommentLine   = SpaceOptional Comment End
Comment       = "//" [^\\n]*
AnyText       = TextChar+ / StringLiteral
StringLiteral      = DoubleQuoteString / SingleQuoteString
DoubleQuoteString  = '"' TextChar* '"'
SingleQuoteString  = "'" TextChar* "'"
TextChar           = [a-zA-Z0-9./\\\-_~!@#$%^&*()+=:;'"?,<>[\\]{}|]
Break              = [ \\t\\r\\n]+
BreakOptional      = [ \\t\\r\\n]*
Space              = [ \\t]+
SpaceOptional      = [ \\t]*
Newline       = "\\n"
End       = Eof / Newline
Eof           = !.
`;

let goRequirementParser = null;

/**
 * @param {*} ast
 * @returns {Array<{name: string, version: string}>}
 */
const findRequireSpec = (ast) => {
	let specs = [];

	if (Array.isArray(ast)) {
		for (const item of ast) {
			specs = specs.concat(findRequireSpec(item));
		}
	} else if (ast && ast.type === 'RequireSpec') {
		// Convert module and version arrays to strings and format the result
		specs.push({
			name: Array.isArray(ast.module) ? ast.module.join('') : ast.module,
			version: Array.isArray(ast.version) ? ast.version.join('') : ast.version,
		});
	}
	return specs;
};

/**
 * @param {String} goFileContent
 * @returns {RepoDependency[]}
 */
export const parseGoModFileContent = (goFileContent) => {
	if (!goFileContent) {
		return [];
	}
	if (!goRequirementParser) {
		goRequirementParser = peggy.generate(GO_REQUIRE_PEG_GRAMMER);
	}

	const parsed = goRequirementParser.parse(goFileContent);
	const dependencies = findRequireSpec(parsed);
	const repoDependencies = dependencies.map((dep) => {
		return new RepoDependency({
			name: dep.name,
			provider: GO_PROVIDER,
		});
	});

	return repoDependencies;
};

/**
 * @param {Repo} repo
 * @returns {RepoDependencyList}
 */
export const parseGoDependencies = async (repo) => {
	const dependencyList = new RepoDependencyList({ id: repo.id });

	const dependencyFiles = await githubClient.getFilesContents(
		repo.owner,
		repo.name,
		[/go\.mod$/i],
		[/(sample|example|test)/i], // Exclude test/sample folders
	);

	if (dependencyFiles.length === 0) {
		throw new UnprocessableRepoError('No supported Go dependency files found');
	}

	for (const file of dependencyFiles) {
		const fileFolder = getFolderPath(file.path);
		const dependencies = parseGoModFileContent(file.content);
		dependencyList.projects.push(
			new Project({
				path: fileFolder,
				packageProvider: GO_PROVIDER,
				dependencies: dependencies,
			}),
		);
	}

	return dependencyList;
};
