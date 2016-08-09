'use strict';
const self = require('sdk/self');
const bz = require('bz');
const { ActionButton } = require('sdk/ui/button/action');
const { setInterval, clearInterval, setTimeout } = require('sdk/timers');
const tabs = require('sdk/tabs');
const sp = require('sdk/simple-prefs');
const pm = require('sdk/page-mod');

const DEFAULT_EMAIL = null;

// page-mod regex - landifll is included purely for testing here
const BUGZILLA_RE = [
  /^https:\/\/bugzilla\.mozilla\.org\/show_bug.cgi\?id\=[\d]+$/,
  /^https:\/\/landfill\.bugzilla\.org\/bugzilla-5.0-branch\/show_bug\.cgi\?id=[\d]+$/
];
const updateFrequency = sp.prefs.updateFrequency * 1000;
const email = sp.prefs.bugzillaEmail;

// let authConfig = require('./node_modules/bz/test/browser/files/test-config.json');
//
// console.log(authConfig);


let loop;

// let bugzilla = bz.createClient(authConfig.auth);
let bugzilla = bz.createClient();

let button = ActionButton({
  id: 'bz-queue-button',
  label: 'Request Flags',
  icon: './bugzilla.png',
  onClick: () => {
    let _url = 'https://bugzilla.mozilla.org/request.cgi?action=queue&requestee='+ email +'&group=type'
    // let _url = authConfig.auth.url.split('/rest')[0] + '/request.cgi?action=queue&requestee='+ email +'&group=type'
    tabs.open(_url);
  }
});

sp.on('bugzillaEmail', () => {
  if (!sp.prefs.bugzillaEmail) {
    button.badge = '?';
    button.label = 'You need to configure your bugzilla email in preferences.'
  }
  else {
    button.label = ''
  }
});

sp.on('updateFrequency', () => {
  console.log("changed", sp.prefs.updateFrequency);
  let _multiplier = sp.prefs.updateFrequency || DEFAULT_FREQUENCY;
  updateFrequency = _multiplier * 1000;

  clearInterval(loop);
  loop = setInterval(() => {
    fetchQueue(email, handleResponse);
  }, updateFrequency);
});

function fetchQueue(email, cb) {
  console.log("fetching");
  let params = {
    'f1': 'requestees.login_name',
    'o1': 'equals',
    'v1': email,
    'query_format': 'advanced',
    'include_fields': 'id,summary,status,resolution,last_change_time,flags'
  };

  bugzilla.searchBugs(params, cb);
}

function handleResponse(err, bugs) {
  console.log('in handleResponse', bugs);
  if (err) throw err;
  if (bugs) {
    let length = bugs.length;
    if (length === 0) {
      //
      button.badgeColor = 'green';
    }
    else {
      button.badgeColor = 'red';
    }
    button.badge = length;
  }
  else {
    button.badgeColor = 'green';
    button.badge = 0;
  }
}

// this should catch any bugzilla form submissions that could affect our count
tabs.on('load', (tab) => {
  console.log(tab.url);
  if (BUGZILLA_RE[0].test(tab.url) || BUGZILLA_RE[1].test(tab.url)) {
    // console.log('loaing a bugzilla page, let\'s refresh');
    fetchQueue(email, handleResponse);
  }
});

if (!email) {
  button.badge = '?';
  // button.badgeColor = 'yellow';
  button.label = 'You need to configure your bugzilla email in preferences.'
}
else {
  loop = setInterval(() => {
    fetchQueue(email, handleResponse);
  }, updateFrequency);
  fetchQueue(email, handleResponse);
}
