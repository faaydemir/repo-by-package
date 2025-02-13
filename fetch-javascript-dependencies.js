
class RepoDependency {
    constructor({
        name,
        version,
        provider,
        versionText,
        versionOperator,
    }) {

        this.name = name;
        this.provider = provider;
        this.version = version;
        this.versionText = versionText;
        this.versionOperator = versionOperator;
    }
}

const parseVersionText = (version) => {
    if (!version || typeof version !== 'string') {
        return { version: undefined, operator: undefined };
    }

    // Handle URL, file, and latest cases
    if (version.startsWith('http') || version.startsWith('file:') || version === 'latest') {
        return { version, operator: undefined };
    }

    // Regex for capturing version patterns and operators
    const regex = /([<>]=?|~|x)?\s*([0-9]+(?:\.[0-9]+(?:\.[0-9]+)?)?|x)/g;

    let match;
    let maxVersion = null;
    let operator = undefined;

    while ((match = regex.exec(version)) !== null) {
        const [_, op, ver] = match;

        if (!maxVersion || compareVersions(ver, maxVersion) > 0) {
            maxVersion = ver;
            operator = op || undefined;
        }
    }

    return { version: maxVersion || undefined, operator };
};

const compareVersions = (v1, v2) => {
    if (v1 === 'x' || v2 === 'x') return 0; // Ignore wildcard comparisons

    const parts1 = v1.split('.').map(n => parseInt(n) || 0);
    const parts2 = v2.split('.').map(n => parseInt(n) || 0);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 !== num2) return num1 - num2;
    }
    return 0;
};


/**
 * 
 * @param {*} packageJson 
 * @returns {RepoDependency[]}
 */
const parseDependenciesFromPackageJson = (packageJson) => {



    const dependencies = packageJson.dependencies ?? {};
    const devDependencies = packageJson.devDependencies ?? {};
    const peerDependencies = packageJson.peerDependencies ?? {};

    const allDependencies = {
        ...dependencies,
        ...devDependencies,
        ...peerDependencies
    };

    return Object.entries(allDependencies).map(([name, version]) => {
        const provider = 'npm';
        const parsedVersion = parseVersionText(version);
        return new RepoDependency({
            name,
            provider,
            versionText: version,
            version: parsedVersion.version,
            versionOperator: parsedVersion.operator
        });
    });
}

export {
    RepoDependency,
    parseDependenciesFromPackageJson
}