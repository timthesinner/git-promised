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
    path = require('path');
    
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

git.run('branch', '-a', '-vv').then(git.log.bind(git, 10, repo)).then(function(commits) {
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
})//.progress(progress)
  .fail(function(err) { throw err; })
  .done(function() { console.log('Finished'); });
  