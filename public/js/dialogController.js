/**
* This file is a temporary hack until we get Qiming's dialogController
*/

var dialogController = function () {};
var dialogList = [];

dialogController.newDialog = function (dialog, opts) {
  dialog(opts);
};

dialogController.dismissAllDialogs = function () {
  $('.overlay-name-wrap').remove()
};

dialogController.preventDismiss = function () {
  throw 'preventDismiss not implemented';
};

dialogController.allowDismiss = function () {
  throw 'allowDismiss not implemented';
};
