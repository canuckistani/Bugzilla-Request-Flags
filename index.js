let self = require('sdk/self');
let { Request } = require('sdk/request');
let { ActionButton } = require('sdk/ui/button/action');
let self = require("sdk/self");
let { setInterval, clearInterval } = require('sdk/timers');
let tabs = require('sdk/tabs');
let sp = require('sdk/simple-prefs');

const DEFAULT_FREQUENCY = 5;
const DEFAULT_EMAIL = 'jgriffiths@mozilla.com';

let email, updateFrequency;
let _multiplier = sp.prefs.updateFrequency || DEFAULT_FREQUENCY;
let updateFrequency = (_multiplier * 1000);

sp.on('bugzillaEmail', () => {
  console.log('changed', sp.prefs.bugzillaEmail);
  email = sp.prefs.bugzillaEmail || DEFAULT_EMAIL;
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
  console.log("fetching queue");
  var uri = 'https://bugzilla.mozilla.org/bzapi/bug?field0-0-0=flag.requestee&type0-0-0=equals&value0-0-0='+email+'&include_fields=id%2Csummary%2Cstatus%2Cresolution%2Clast_change_time%2Cflags';
  Request({
    url: uri,
    contentType: 'application/json',
    headers: {Accept: 'application/json'},
    onComplete: (response) => {
      cb(response);
    }
  }).get();
}

function handleResponse(response) {
  if (!response.json) {
    throw "Response did not return JSON??";
  }
  if (response.json.bugs) {
    let length = response.json.bugs.length;
    if (length === 0) {
      //
      button.badgeColor = 'green';
    }
    button.badge = length;
  }
}

let loop = setInterval(() => {
  fetchQueue(email, handleResponse);
}, updateFrequency);

fetchQueue(email, handleResponse);
