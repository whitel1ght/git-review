'use strict';
const program = require('commander');
const winston = require('winston');
const cp = require('child_process');
const STOP_COMMAND = 'stop review';

program
    .option('-b, --base_branch [branch]', 'base branch')
    .option('-n, --pr_branch [branch]', 'pr branch')
    .parse(process.argv);

let base_branch;
let pr_branch;
let current_branch;
let was_changes;

const getCurrentBranch = (resolve, reject) => {
    cp.exec('git rev-parse --abbrev-ref HEAD', (err, stdout, stderr) =>{
        if (err) {
            console.error(err);
            console.error(stderr);
            reject(err);
        }
        console.log(`current branch is ${stdout}`);
        resolve(stdout);
    });
};

const setBranches = (currentBranch) => {
    const pBaseBranch = program.base_branch;
    const pPrBranch = program.pr_branch;
    console.log('setting branches...');
    current_branch = currentBranch.replace(/(\r\n|\n|\r)/gm,'');
    if (!pBaseBranch || !pPrBranch) {
        console.error('define branches!');
        process.exit();
    }
    base_branch = program.base_branch;
    pr_branch = program.pr_branch;
};

const checkChangesOnCurrentBranch = () => {
    console.log('current branch status check...');
    return new Promise((resolve, reject) => {
        cp.exec('git status --porcelain', (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            was_changes = stdout.toString();
            resolve();
        });
    })
};

const stashLocalChanges = () => {
    if (was_changes) {
        console.log('stashing changes...');
        cp.execSync('git stash', { stdio: 'inherit' });
    }
};

const checkoutToBaseBranch = () => {
    console.log(`checkout to ${base_branch}`);
    cp.execSync(`git checkout ${base_branch}`, { stdio: 'inherit' });
};

const updateBranch = () => {
    console.log('updating branch...');
    cp.execSync('git pull', { stdio: 'inherit' });
};

const goToPrBranch = () => {
    console.log('going to pr branch');
    cp.execSync(`git checkout ${pr_branch}`, { stdio: 'inherit' });
};

const updatePrBranch = () => {
    console.log('updating pr branch...');
    cp.execSync(`git pull origin ${pr_branch}`, { stdio: 'inherit' });
};


const buildProject = () => {
    console.log('building project...');
    cp.execSync('npm run build-prod', { stdio: 'inherit' });
};

const restartUI = () => {
    console.log('restarting STB Browser...');
    cp.execSync('npm run restart', { stdio: 'inherit' });
    console.log('enter \"stop review\" to stop process...');
};

const stopReview = () => {
    cp.execSync(`git checkout ${current_branch}`, { stdio: 'inherit' });
    if (was_changes) {
        cp.execSync('git stash pop', { stdio: 'inherit' });
    }
    process.exit();
};

new Promise(getCurrentBranch)
    .then(setBranches)
    .then(checkChangesOnCurrentBranch)
    .then(stashLocalChanges)
    .then(checkoutToBaseBranch)
    .then(updateBranch)
    .then(goToPrBranch)
    .then(updatePrBranch)
    .then(buildProject)
    .then(restartUI);

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    if (data.replace(/(\r\n|\n|\r)/gm,'') === STOP_COMMAND) {
        stopReview();
    }
});
