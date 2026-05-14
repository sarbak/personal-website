/**
 * Shared PostHog bootstrap for the static site.
 * Skip local development so previews do not pollute production analytics.
 */
(function() {
  const host = window.location.hostname;
  const isLocalPreview =
    window.location.protocol === 'file:' ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]';

  if (isLocalPreview) return;

  !function(t, e) {
    let o;
    let n;
    let p;
    let r;

    if (e.__SV) return;

    window.posthog = e;
    e._i = [];
    e.init = function(i, s, a) {
      function g(target, method) {
        const parts = method.split('.');
        if (parts.length === 2) {
          target = target[parts[0]];
          method = parts[1];
        }
        target[method] = function() {
          target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }

      p = t.createElement('script');
      p.type = 'text/javascript';
      p.crossOrigin = 'anonymous';
      p.async = true;
      p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
      r = t.getElementsByTagName('script')[0];
      r.parentNode.insertBefore(p, r);

      const instance = a !== undefined ? (e[a] = []) : e;
      a = a || 'posthog';
      instance.people = instance.people || [];
      instance.toString = function(stub) {
        let name = 'posthog';
        if (a !== 'posthog') name += '.' + a;
        if (!stub) name += ' (stub)';
        return name;
      };
      instance.people.toString = function() {
        return instance.toString(1) + '.people (stub)';
      };

      o = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' ');
      for (n = 0; n < o.length; n += 1) g(instance, o[n]);
      e._i.push([i, s, a]);
    };
    e.__SV = 1;
  }(document, window.posthog || []);

  posthog.init('phc_nT4tpTx39Rq623pQH5vqjUcnTKbF8Q9m8HeY6tDivzuo', {
    api_host: 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    defaults: '2026-01-30'
  });
})();
