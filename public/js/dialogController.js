var dialogController = function () {};

dialogController.newDialog = function (dialog, opts) {
  dialog(opts);
};

dialogController.dismissAllDialogs = function () {
  console.log('dismissAllDialogs not implemented');
};

dialogController.preventDismiss = function () {
  console.log('preventDismiss not implemented');
};

dialogController.allowDismiss = function () {
  console.log('allowDismiss not implemented');
};
