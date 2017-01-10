#!/usr/bin/env node

const git = require('simple-git')();
const program = require('commander');

program
  .option('-b, --base_branch [branch]', 'base branch')
  .option('-n, --pr_branch [branch]', 'pr branch')
  .parse(process.argv);

git
  .checkout(program.base_branch)
  .then(() => {
    console.log(`branch swithed to ${program.base_branch}`)
  })
  .pull()
  .then(() => {
    console.log('branch updated')
  })
  .checkout(program.pr_branch)
  .then(() => {
    console.log(`branch swithed to ${program.pr_branch}`)
  })
  .pull('origin', program.pr_branch)
  .then(() => {
    console.log('branch updated')
  })

// ololol
// git checkout release/4.3.3 && 
// git pull &&
// git checkout feature/4.3.3/epg-performance-improvements-HZN4UI-12253 &&
// git pull origin feature/4.3.3/epg-performance-improvements-HZN4UI-12253 && 
// npm run build-prod && 
// npm run restart