// Chatwoot SDK Integration
(function(d, t) {
  var BASE_URL = "https://sac1.c6b0ecb69ff9da03d5a614ca0cf55e04.com";
  var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
  g.src = BASE_URL + "/packs/js/sdk.js";
  g.defer = true;
  g.async = true;
  s.parentNode.insertBefore(g, s);
  g.onload = function() {
    if (window.chatwootSDK) {
      window.chatwootSDK.run({
        websiteToken: 'sdoR8MSw9mKmGjAccRoujB16',
        baseUrl: BASE_URL
      });
    }
  };
})(document, "script");

