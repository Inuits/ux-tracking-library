# UX Tracking Library
Ux Tracking library is a javascript library that you can implement in any web framework to track a users behaviour.
It's one component out of three needed for the Ux-tracker to work.

- [Backend](https://github.com/inuits/ux-tracking-backend)
- [Dashboard](https://github.com/inuits/ux-tracking-frontend)
- Library

# Quickstart
## Create config array
Define your config in the main html file for SPA's (mostly index.html in the root) or in every html file when
when using a static web page.
```javascript
<script lang="javascript">
      uxTrackingConfig = {
        appName: 'appnamehere',
        appKey: 'appkeyhere',
        backendUrl: 'backendurlhere',
        cacheSize: 10,
        sessionType: '{{ SessionType }}',
        sessionId: '{{ sessionId }}'
      };
</script>

//include the library here
```
For more config examples, check [here](https://github.com/inuits/ux-tracking-library/wiki/config)

## Reference the library
```javascript
<script lang="javascript" src="https://bundle.inuits-ux-tracker.tk/bundle.js"></script>
```


For more info please checkout the [Wiki](https://github.com/inuits/ux-tracking-library/wiki)
