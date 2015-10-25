# git-promised
A promise wrapper around the git binary
- Common functions are implemented directly by the API 
- Commands not implemented by the API can be executed using run.

## Getting Started

```shell
npm install git-promised --save
```

## Example (log and list)
```js
//List the last 10 commits and the list of modified files
var repo = path.resolve(process.argv[2]);
var git = require('../index')(repo);
git.log(10)).then(function(commits) {
  return Q.allSettled(_.map(commits, function(commit) {
    return git.list(commit).then(function (list) {
      console.log(commit.text);
      if (list) {
        console.log('Files:');
        _.each(list, function(file) {
          console.log('   ', file);
        });
      }
      console.log('');
    });
  }));
})
```

## Example (run)
```js
var repo = path.resolve(process.argv[2]);
var git = require('../index')(repo);

function progress(msg) {
  if (msg.out) {
    _.each(msg.out, function(out) {
      console.log(out);
    });
  } else if (msg.err) {
    _.each(msg.err, function(err) {
      console.log('ERR:', err);
    });
  }
}

//Stream output from a custom git command using a progress handler.
git.run('branch', '-a', '-vv').progress(progress);
```