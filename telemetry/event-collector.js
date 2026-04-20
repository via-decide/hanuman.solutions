(function (global) {
  'use strict';

  function collectSecurityEvent(event) {
    if (!global.HanumanCollector || !event) return null;
    return global.HanumanCollector.captureMiddlewareEvent(event);
  }

  global.HanumanEventCollector = {
    collectSecurityEvent
  };
})(window);
