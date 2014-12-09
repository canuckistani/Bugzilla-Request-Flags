let self = require('sdk/self');
let { Request } = require('sdk/request');
let { ActionButton } = require('sdk/ui/button/action');
// let panels = require("sdk/panel");
let self = require("sdk/self");
let { setInterval, clearInterval } = require('sdk/timers');
let tabs = require('sdk/tabs');

const DEFAULT_TIMER = (5 * 1000); // every minute
const email = 'jgriffiths@mozilla.com';

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
    button.badge = response.json.bugs.length;
  }
}

let loop = setInterval(() => {
  fetchQueue(email, handleResponse);
}, DEFAULT_TIMER);

exports.main = () => {
  fetchQueue(email, handleResponse);
}

fetchQueue(email, handleResponse);
