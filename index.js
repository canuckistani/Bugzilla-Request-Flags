let self = require('sdk/self');
// let { Request } = require('sdk/request');
let bz = require('./bz');
let { ActionButton } = require('sdk/ui/button/action');
let self = require("sdk/self");
let { setInterval, clearInterval } = require('sdk/timers');
let tabs = require('sdk/tabs');
let sp = require('sdk/simple-prefs');

const DEFAULT_FREQUENCY = 5;
const DEFAULT_EMAIL = null;
let loop, email = sp.prefs.bugzillaEmail;

var bugzilla = bz.createClient();

sp.on('bugzillaEmail', () => {
  email = sp.prefs.bugzillaEmail || DEFAULT_EMAIL;
  if (!email) {
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
  updateFrequency = (_multiplier * 1000);

  clearInterval(loop);
  loop = setInterval(() => {
    fetchQueue(email, handleResponse);
  }, updateFrequency);
});

let button = ActionButton({
  id: 'bz-queue-button',
  label: 'Request Flags',
  icon: './bugzilla.png',
  onClick: () => {
    tabs.open('https://bugzilla.mozilla.org/request.cgi?action=queue&requestee='+ email +'&group=type');
  }
});

function fetchQueue(email, cb) {
  bugzilla.searchBugs({
    'field0-0-0':     'flag.requestee',
    'type0-0-0':      'equals',
    'value0-0-0':      email,
    'include_fields': 'id%2Csummary%2Cstatus%2Cresolution%2Clast_change_time%2Cflags'
  }, cb);
}

function handleResponse(err, bugs) {
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
}

function getTimerFrequency(seconds) {
  return (seconds * 1000);
}

function main() {

  let email = sp.prefs.bugzillaEmail, 
      updateFrequency = getTimerFrequency(sp.prefs.updateFrequency);

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
}

exports.main = main;
