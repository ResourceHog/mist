
/**
@module MistAPI
*/

const shell = require('shell');
const ipc = require('ipc');
const web3 = require('web3');
const BigNumber = require('bignumber.js');
const ipcProviderWrapper = require('../ipc/ipcProviderWrapper.js');
require('../loadFavicon.js');

var prefix = 'entry_';

// filterId the id to only contain a-z A-Z 0-9
var filterId = function(str) {
    var newStr = '';
    for (var i = 0; i < str.length; i++) {
        if(/[a-zA-Z0-9_-]/.test(str.charAt(i)))
            newStr += str.charAt(i);
    };
    return newStr;
};

// notifiy the tab to store the webview id
ipc.sendToHost('setWebviewId');

// SET WEB3 PROVIDOR
// destroy the old socket
ipc.send('ipcProvider-destroy');


// create a new one
web3.setProvider(new web3.providers.IpcProvider('', ipcProviderWrapper));

// web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

// var remote = require('remote');
// web3.setProvider(new web3.providers.IpcProvider('/Users/frozeman/Library/Ethereum/geth.ipc', remote.require('net')));


ipc.on('callFunction', function(id) {
    if(mist.menu.entries[id] && mist.menu.entries[id].callback)
        mist.menu.entries[id].callback();
});


// open a[target="_blank"] in external browser
document.addEventListener('click', function(e) {
    if(e.target.nodeName === 'A' && e.target.attributes.target && e.target.attributes.target.value === "_blank") {
        e.preventDefault();
        shell.openExternal(e.target.href);
    }
}, false);


// work up queue every 500ms
var queue = [];
setInterval(function(){
    ipc.sendToHost('menuChanges', queue);
    queue = [];
}, 500);



/**
Mist API

TODO: queue up all changes and send them all together, to prevent multiple update calls in the mist ui db?

@class mist
@constructor
*/
var mist = {
    menu: {
        entries: {},
        /**
        Sets the badge text for the apps menu button

        Example

            mist.menu.setBadge('Some Text')

        @method setBadge
        @param {String} text
        */
        setBadge: function(text){
            ipc.sendToHost('setBadge', text);
        },
        /**
        Adds/Updates a menu entry

        Example

            mist.menu.add('tkrzU', {
                name: 'My Meny Entry',
                badge: 50,
                position: 1,
                selected: true
            }, function(){
                // Router.go('/chat/1245');
            })

        @method add
        @param {String} id          The id of the menu, has to be the same accross page reloads.
        @param {Object} options     The menu options like {badge: 23, name: 'My Entry'}
        @param {Function} callback  Change the callback to be called when the menu is pressed.
        */
        'add': function(id, options, callback){
            id = prefix + filterId(id);

            var entry = {
                id: id,
                position: options.position,
                selected: !!options.selected,
                name: options.name,
                badge: options.badge,
            };

            queue.push({
                action: 'addMenu',
                entry: entry
            });

            if(callback)
                entry.callback = callback;

            this.entries[id] = entry;
        },
        'update': function(){
            this.add.apply(this, arguments);
        },
        /**
        Removes a menu entry from the mist sidebar.

        @method remove
        @param {String} id
        */
        'remove': function(id){
            id = prefix + filterId(id);

            delete this.entries[id];

            queue.push({
                action: 'removeMenu',
                id: id
            });
        },
        /**
        Removes all menu entries.

        @method clear
        */
        'clear': function(){
            queue.push({action: 'clearMenu'});
        }
    },
};

window.mist = mist;
window.BigNumber = BigNumber;
window.web3 = web3;