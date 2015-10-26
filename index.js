//Copyright (c) 2015 TimTheSinner All Rights Reserved.
'use strict';

/**
 * Copyright (c) 2015 TimTheSinner All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 * 
 * @author TimTheSinner
 */
var Q = require('q'),
    _ = require('underscore'),
    exec = require('exec-promised');
    
var COMMIT = /^commit\s+(.*)$/i,
    AUTHOR = /^Author:\s+(.*)$/i,
    DATE = /^Date:\s+(.*)$/i;
    
function output(res) {
  return _.compact(res.out);
}
    
function git(repo) {
  this.repo = repo;
}
module.exports = function(repo) {
  return new git(repo);
}

git.prototype.run = function() {
  var args = Array.prototype.slice.apply(arguments);
  args.unshift('git');
  return exec(args, this.repo).then(output);
}

git.prototype.toCommits = function(lines) {
  var commits = [],
      commit = null;
      
  if (lines) {
    _.each(lines, function(line) {
      var match = null;
      if ((match = COMMIT.exec(line))) {
        if (commit) {
          commits.push(commit);
          commit = null;
        }
        commit = {hash:match[1],text:line}
      } else {
        commit.text += '\n' + line;
        if ((match = AUTHOR.exec(line))) {
          commit.author = match[1];
        } else if ((match = DATE.exec(line))) {
          commit.date = match[1];
        }
      }
    });
    
    if (commit) {
      commits.push(commit);
    }
  }
  
  return commits;
}

git.prototype.log = function(count, file) {
  return exec(['git', 'log', '-n', count], file || this.repo).then(output).then(this.toCommits);
}

git.prototype.list = function(commit) {
  return exec(['git', 'diff-tree', '--no-commit-id', '--name-only', '-r', commit.hash || commit], this.repo).then(function(res) {
    return _.compact(res.out);
  });
}

git.prototype.ls = function(options) {
  var args = ['git', 'ls-files'];
  var options = _.extend({}, options);
  if (options.others) { args.push('--others'); }
  if (options.excludeStandard) { args.push('--exclude-standard'); }
  return exec(args, this.repo).then(output);
}

git.prototype.add = function(file) {
  return exec(['git', 'add', file], this.repo).then(output);
}

git.prototype.commit = function(message) {
  return exec(['git', 'commit', '-a', '-m', message], this.repo).then(output);
}

git.prototype.fetch = function(options) {
  var args = ['git', 'fetch'];
  var options = _.extend({}, options);
  if (options.prune) { args.push('-p'); }
  if (options.all) { args.push('--all'); }
  return exec(args, this.repo).then(output);
}

git.prototype.reset = function(options) {
  var args = ['git', 'reset'];
  var options = _.extend({}, options);
  if (options.hard) { args.push('--hard'); }
  if (options.head) { args.push('HEAD'); }
  return exec(args, this.repo).then(output);
}

git.prototype.clean = function(options) {
  var args = ['git', 'clean'];
  var options = _.extend({}, options);
  if (options.force) { args.push('--force'); }
  if (options.dir) { args.push('-d'); }
  return exec(args, this.repo).then(output);
}

git.prototype.gc = function() {
  var args = ['git', 'gc'];
  var options = _.extend({}, options);
  if (options.aggressive) { args.push('--aggressive'); }
  if (options.prune) { args.push('--prune'); }
  return exec(args, this.repo).then(output);
}

git.prototype.prune = function() {
  return exec(['git', 'prune'], this.repo).then(output);
}

git.prototype.fsck = function() {
  return exec(['git', 'fsck'], this.repo).then(output);
}

git.prototype.pull = function() {
  return exec(['git', 'pull', '--rebase'], this.repo).then(output);
}

git.prototype.push = function() {
  return exec(['git', 'push'], this.repo).then(output);
}

git.prototype.maintenance = function(clean) {
  if (clean) {
    return this.reset({hard:true, head:true})
             .then(this.clean.bind(this, {force:true, dir:true}))
             .then(this.fetch.bind(this, {prune:true, all:true}))
             .then(this.pull.bind(this))
             .then(this.gc.bind(this, {aggressive:true, prune:true}))
             .then(this.prune.bind(this));
  } else {
    return this.fetch()
             .then(this.pull.bind(this))
             .then(this.gc.bind(this, {aggressive:true, prune:true}))
             .then(this.prune.bind(this));
  }
}
