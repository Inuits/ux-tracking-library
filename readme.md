# UX Tracking Library


## Installation
Installing the UX-tracking library consists of 2 steps:

### 1. Creating a config file  
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

#### CacheSize (Default 10)

The amount of actions you want to cache in localstorage before sending all the cached actions.

#### SessionType
To provide a way to organize the logs per session (which user was providing the actions) we give several options:  

* LocalStorage
* Cookies
* More to come..

The two available options are implemented by setting the `{{ sessionType }}` to `localstorage` or `cookies`.

The default is `cookies`.


#### SessionId
This is the id you used for keeping track of the currently logged in user (in a manner defined by the SessionType above).
This could be `cookies.set('sessionId', myUsername);` or `localStorage.setItem('sessionId', myUsername);` or anything else
available by the SessionType.

### 2. Referencing the library in you projects .js, .ts, .html, .. file  
```javascript
<script lang="javascript" src="https://bundle.inuits-ux-tracker.tk/bundle.js"></script>
```


## Build
Building requires the [Browserify](http://browserify.org/) package
```bash
npm install browserify -g
```

Then build the bundle.js from script.js
```bash
browserify script.js -o bundle.js
```

## Development
For developing with a file watcher to automatically build the bundle.js you can use `inotify-tools`
```bash
while inotifywait -e close_write .; do 
    browserify script.js -o bundle.js; 
done
```
