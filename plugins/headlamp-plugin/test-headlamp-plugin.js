#!/bin/env node
const USAGE = `
This tests unpublished @kinvolk/headlamp-plugin package in repo.

./test-headlamp-plugin.js

Assumes being run within the plugins/headlamp-plugin folder
`;
const PACKAGE_NAME = 'headlamp-myfancy';

function testHeadlampPlugin() {
  // remove some temporary files.
  cleanup();

  // Make a package file of headlamp-plugin we can test
  run('npm install');
  run('npm run build');
  run('npm pack');

  const packedFile = fs
    .readdirSync('.')
    .filter(file => file.match('kinvolk-headlamp-plugin-.*gz'))[0];
  console.log('Packed headlamp-plugin package file:', packedFile);

  // Use "link" to test the repo version of the headlamp-plugin tool.
  run('npm link');
  run(`node bin/headlamp-plugin.js create ${PACKAGE_NAME} --link`);
  curDir = join('.', PACKAGE_NAME);
  run(`npm install ${join('..', packedFile)}`);

  // test headlamp-plugin build
  run(`node ${join('..', 'bin', 'headlamp-plugin.js')} build`);
  checkFileExists(join(PACKAGE_NAME, 'dist', 'main.js'));

  // test headlamp-plugin build folder
  curDir = '.';
  fs.rmSync(PACKAGE_NAME, { recursive: true });
  run(`node bin/headlamp-plugin.js create ${PACKAGE_NAME} --link`);
  curDir = PACKAGE_NAME;
  run(`npm install ${join('..', packedFile)}`);
  curDir = '.';
  run(`node bin/headlamp-plugin.js build ${PACKAGE_NAME}`);
  checkFileExists(join(PACKAGE_NAME, 'dist', 'main.js'));

  // test extraction works
  run(`node bin/headlamp-plugin.js extract . .plugins`);
  checkFileExists(join('.plugins', PACKAGE_NAME, 'main.js'));

  // test format command and that default code is formatted correctly
  fs.rmSync(PACKAGE_NAME, { recursive: true });
  run(`node bin/headlamp-plugin.js create ${PACKAGE_NAME} --link`);
  curDir = PACKAGE_NAME;
  run(`npm install ${join('..', packedFile)}`);
  run('npm run format');

  // test lint command and default code is lint free
  run('npm run lint');
  run('npm run lint-fix');

  // test type script error checks
  run('npm run tsc');
}

const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const join = path.join;
let curDir;

function cleanup() {
  console.log(`Cleaning up. Removing temp files...`);

  fs.readdirSync('.')
    .filter(file => file.match('kinvolk-headlamp-plugin-.*gz'))
    .forEach(file => fs.rmSync(file));

  const foldersToRemove = [path.join('.plugins', PACKAGE_NAME), PACKAGE_NAME];
  foldersToRemove
    .filter(folder => fs.existsSync(folder))
    .forEach(folder => fs.rmSync(folder, { recursive: true }));
}

function run(cmd) {
  console.log('');
  console.log(`Running cmd:${cmd} inside of cwd:${curDir}`);
  console.log('');
  try {
    child_process.execSync(cmd, {
      stdio: 'inherit',
      cwd: curDir,
      encoding: 'utf8',
    });
  } catch (e) {
    console.error(`Error: Problem running "${cmd}" inside of "${curDir}"`);
    cleanup();
    process.exit(1);
  }
}
function checkFileExists(fname) {
  if (!fs.existsSync(fname)) {
    console.error(`Error: ${fname} does not exist.`);
    cleanup();
    process.exit(1);
  }
}

(function () {
  if (process.argv[1].includes('test-headlamp-plugin')) {
    console.log(USAGE);
    curDir = '.';

    process.on('beforeExit', cleanup);
    testHeadlampPlugin();
  }
})();
