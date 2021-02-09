# API Reference

The following document is the complete API reference for the animation library for the Azure Maps Web SDK.

**Namespace:**

- atlas
    - animations
        - [FrameBasedAnimationTimer](#FrameBasedAnimationTimer-class)
        - [GroupAnimation](#GroupAnimation-class)
        - [PlayableAnimation](#PlayableAnimation-class)
    - layer
        - [AnimatedTileLayer](#AnimatedTileLayer-class)

- [atlas interfaces](#atlas-namespace)
    - [AnimatedTileLayerOptions](#AnimatedTileLayerOptions-interface)
    - [FrameBasedAnimationEvent](#FrameBasedAnimationEvent-interface)
    - [GroupAnimationOptions](#GroupAnimationOptions-interface)
    - [PathAnimationOptions](#PathAnimationOptions-interface)
    - [PlayableAnimationOptions](#PlayableAnimationOptions-interface)
    - [MapPathAnimationOptions](#MapPathAnimationOptions-interface)
    - [PointPairValueInterpolation](#PointPairValueInterpolation-interface)
    - [RoutePathAnimation](#RoutePathAnimation-interface)
    - [RoutePathAnimationEvent](#RoutePathAnimationEvent-interface)
    - [TimeSpan](#TimeSpan-interface)

## atlas.animations namespace

The following static methods and classes are exposed on the `atlas.animations` namespace.

### Static methods

The following static methods are exposed on the `atlas.animations` namespace.

| Name | Return type | Description |
|------|-------------|-------------|
| `clearInterval(intervalId: number)` | | Disposes a setInterval instance. |
| `clearTimeout(timeoutId: number)` | | Disposes a setTimeout instance. |
| `delay(timeout: number, callback?: string \| Function)` | `IPlayableAnimation` | Creates a playable animation delay. This is useful for group animations.  |
| `drop(shapes: atlas.data.Point \| atlas.data.Feature<atlas.data.Point, any> \| atlas.Shape \| (atlas.data.Point \| atlas.data.Featuree<atlas.data.Point, any> \| atlas.Shape)[], dataSource: atlas.source.DataSource, height?: number, options?: DropAnimationOptions)` | `PlayableAnimation` | Adds an offset array property to point shapes and animates it's y value to simulate dropping. Use with a symbol layer with the icon/text offset property set to `['get', 'offset']` and the opacity set to `['get', 'opacity']`. |
| `dropMarkers(markers: atlas.HtmlMarker \| atlas.HtmlMarker[], map?: atlas.Map, height?: number, options?: PlayableAnimationOptions)` | `PlayableAnimation` | Adds an offset to HtmlMarkers to animate it's `y` value to simulate dropping. Animation modifies `pixelOffset` value of HtmlMarkers. The animation has a default height of 200 pixels. |
| `extractRoutePoints(shapes: atlas.data.FeatureCollection \| atlas.Shape \| atlas.data.Feature<atlas.data.Geometry, any> \| (atlas.Shape \| atlas.data.Feature<atlas.data.Geometry, any>)[], timestampProperty?: string)` | `atlas.data.Feature<atlas.data.Point, any>[]` | Extracts points from a shapes or features that form a time based route and sorts them by time. Timestamps must parsable by the `atlas.math.parseTimestamp` function. All extracted points will have a `_timestamp` property that contains the `Date.getTime()` value. Features must be a Point, MultiPoint, or LineString and must contain properties that include timestamp information. If a timestamp property name is not specified, `_timestamp` will be used. If a feature collection is passed in, the first shape with a matching timestamp property will dictate what is extracted. If the first shape is a Point, all points in the colleciton with the timestamp property will be extracted. If the first shape is a LineString or MultiLineString;<br/><br/>- If it contains a timestamp property with an array of values the same length as coordinates in the feature, new Point features will be created from a combination of the coordinates and timestamp values.<br/>- If the feature has a `waypoints` property that contains an array of Point features with the timestamp property and the same number of coordinates, then these p will be extracted. |
| `flowingDashedLine(layer: atlas.layer.LineLayer, options?: MovingDashLineOptions)` | `IPlayableAnimation` | Animates the dash-array of a line layer to make it appear to flow. The lineCap option of the layer must not be 'round'. If it is, it will be changed to 'butt'. |
| `getEasingFn(easing: string)` | `(progress: number) => number` | Retrieves an easing function by name, or null if a matching easing function is not found. |
| `getEasingNames()` | `string[]` | Retrieves the name of all the built in easing functions. |
| `interval(period: number, callback?: string \| Function, numberOfIntervals?: number)` | `PlayableAnimation` | Creates a playable animation that triggers a callback function on constant interval.   |
| `morph(shape: atlas.Shape, newGeometry: atlas.data.Geometry, options?: PlayableAnimationOptions)` | `PlayableAnimation` | Animates the morphing of a shape from one geometry type or set of coordinates to another. |
| `moveAlongPath(path?: atlas.data.Position[] \| atlas.data.LineString \| atlas.Shape, shape?: atlas.Shape \| atlas.HtmlMarker, options?: PathAnimationOptions)` | `PlayableAnimation` | Animates a map and/or a Point shape along a route path. The movement will vary based on timestamps within the point feature properties. All points must have a `timestamp` property that is a `Date.getTime()` value. Use the `extractRoutePoints` function to preprocess data. |
| `moveAlongRoute(route: atlas.data.Feature<atlas.data.Point, any>[], shape?: atlas.Shape \| atlas.HtmlMarker, options?: RoutePathAnimationOptions)` | `RoutePathAnimation` | Animates a map and/or a Point shape along a route path. The movement will vary based on timestamps within the point feature properties. |
| `setCoordinates(shape: atlas.Shape \| atlas.HtmlMarker, newCoordinates: atlas.data.Position \| atlas.data.Position[] \| atlas.data.Position[][] \| atlas.data.Position[][][], options?: PathAnimationOptions \| MapPathAnimationOptions)` | `PlayableAnimation` | Animates the update of coordinates on a shape or HtmlMarker. Shapes will stay the same type. Only base animation options supported for geometries other than Point. |
| `setInterval(callback: string \| Function, timeout: number)` | number | A version of the setInterval function based on requestAnimationFrame. |
| `setTimeout(callback: string \| Function, timeout: number)` | number | A version of the setTimeout function based on requestAnimationFrame. |
| `snakeline(shape: atlas.Shape, options?: PathAnimationOptions \| MapPathAnimationOptions)` | `PlayableAnimation` | Animates the path of a LineString.|

### FrameBasedAnimationTimer class

Implements: `IPlayableAnimation` interface

A class for frame based animations. The number of frames will be equally spread out throughout the animation and the `onFrame` callback function will be fired when a frame of the animation should be triggered.

**Constructor**

> `FrameBasedAnimationTimer(numberOfFrames: number, onFrame: (frameIdx: number) => void, options?: PlayableAnimationOptions)`

**Methods** 

| Name | Return type | Description |
|------|-------------|-------------|
| `getCurrentFrameIdx()` | `number` | Gets the current frame index of the animation. Returns `-1` if animation hasn't started, or if there is 0 frames. |
| `getDuration()` | `number` | Gets the duration of the animation. |
| `getNumberOfFrames()` | `number` | Gets the number of frames in the animation. |
| `setFrameIdx(frameIdx: number)` | | Sets the frame index of the animation. |
| `setNumberOfFrames(numberOfFrames: number)` | | Sets the number of frames in the animation. |

**Events**

| Name | Return type | Description | 
|------|-------------|-------------|
| `onframe` | `FrameBasedAnimationEvent` | Event fired when a new frame of the animation is loaded. |

### GroupAnimation class

Group animation handler. 

**Constructor**

> `GroupAnimation(animations: (IPlayableAnimation \| GroupAnimation)[], options?: GroupAnimationOptions)`

**Methods**

| Name | Return type | Description |
|------|-------------|-------------|
| `dispose()` | | Disposes the animation. |
| `getDuration()` | `number` | Gets the duration of the animation. |
| `getOptions()` | `GroupAnimationOptions` | Gets the animation options. |
| `isPlaying()` | `boolean` | Checks to see if the animaiton is playing. |
| `play()` | | Plays the group of animations. |
| `reset()` | | Stops all animations and jumps back to the beginning of each animation. |
| `stop()` |  | Stops all animations and jumps to the final state of each animation. |
| `setOptions(options: GroupAnimationOptions)` | | Sets the options of the animation. |

### PlayableAnimation class

Implements: `IPlayableAnimation`

An abstract class which defines an animation that supports a play function.

**Methods**

| Name | Return type | Description |
|------|-------------|-------------|
| `dispose()` | | Disposes the animation. |
| `getDuration()` | `number` | Gets the duration of the animation. |
| `getOptions()` | `PlayableAnimationOptions` | Gets the animation options. |
| `isPlaying()` | `boolean` | Checks to see if the animaiton is playing. |
| `pause()` | | Pauses the animation. |
| `play()` |  | Plays the animation. |
| `reset()` | | Stops the animation and jumps back to the beginning of the animation. |
| `seek(progress: number)` | | Advances the animation to a specific step. |
| `setOptions(options: PlayableAnimationOptions)` | | Sets the options of the animation. |
| `stop()` |  | Stops the animation and jumps back to the end of the animation. |
| `onAnimationProgress(progress: number)` | | Abstract callback function that contains the animation frame logic. Where the progress of the animation is 0 at the start and 1 at the end. Override this function with custom frame animation logic. |

**Events**

| Name | Return type | Description | 
|------|-------------|-------------|
| `oncomplete` | `PlayableAnimationEvent` | Event fired when the animation has completed. |
| `onprogress` | `PlayableAnimationEvent` | Event fired when the animation progress changes. |

#### PlayableAnimationEvent interface 

The event argument returned by the onframe event of a playable animation.

| Name | Type | Description |
|------|------|-------------|
| `animation` | `PlayableAnimation` | The animation the event occurered on. |
| `easingProgress` | `number` | The progress of the animation after being passed through an easing function. |
| `heading` | `number` | The focal heading of an animation frame. Returned by path animations. |
| `position` | `atlas.data.Position` | The focal position of an animation frame. Returned by path animations. |
| `progress` | `number` | Progress of the animation where 0 is the start and 1 is the end. |
| `type` | `string` | The event type |


## atlas.layer namespace

The following are animation layers that are available under the `atlas.layer` namespace.

### AnimatedTileLayer class

A layer that can smoothly animate through an array of tile layers.

**Constructor**

> `AnimatedTileLayer(options?: AnimatedTileLayerOptions)`

**Methods**

| Name | Return type | Description |
|------|-------------|-------------|
| `dispose()` | | Disposes the layer.  |
| `getDuration()` | `number` | Gets the duration of the animation. |
| `getOptions()` | `AnimatedTileLayerOptions` | Gets the options for the layer. |
| `getPlayableAnimation()` | `FrameBasedAnimationTimer` | Gets the underlying frame based animation instance.  |
| `isPlaying()` | `boolean` | Checks to see if the animaiton is playing. |
| `pause()` | | Pauses the animation. |
| `play()` |  | Plays the animation. |
| `reset()` | | Stops the animation and jumps back to the beginning the animation. |
| `setFrameIdx(frameIdx: number)` | | Sets the frame index of the animation. |
| `setOptions(options: AnimatedTileLayerOptions)` | | Sets the options of the layer. |
| `stop()` |  | Stops the animation and jumps to the final state of the animation. Stops looping of animation. |

## atlas namespace

Interfaces are in this namespace to make reference path short. Note that these are just for reference and are not classes that can be created.

### AnimatedTileLayerOptions interface

**Properties**

| Name | Type | Description |
|------|------|-------------|
| `autoPlay` | `boolean` | Specifies if the animation should start automatically or wait for the play function to be called. Default: `false` |
| `disposeOnComplete` | `boolean` | Specifies if the animation should dispose itself once it has completed. Deault: `false` |
| `duration` | `number` | The duration of the animation in ms. Default: `1000` ms |
| `easing` | `string` \| `(progress: number) => number` | The easing of the animaiton. Default: `'linear'` |
| `loop` | `boolean` | Specifies if the animation should loop infinitely. Default: `false` |
| `reverse` | `boolean` | Specifies if the animation should play backwards. Default: `false` |
| `speedMultiplier` | `number` | A multiplier of the duration to speed up or down the animation. Default: `1` | 
| `tileLayerOptions` | `atlas.TileLayerOptions[]` | The array of tile layers options to animate through. Note that fadeDuration and visible options are ignored. |
| `visible` | `boolean` | A boolean specifying if the animated tile layer is visible or not. Default: `true` |

### FrameBasedAnimationEvent interface

**Properties**

| Name | Type | Description |
|------|------|-------------|
| `animation` | `FrameBasedAnimationTimer` | The animation the event occurered on. |
| `frameIdx` | `number` | The index of the frame if using the frame based animation timer. |
| `numFrames` | `number` | The number of frames in the animation. |
| `type` | `string` | The event type.  |

### GroupAnimationOptions interface 

Options for a group of animations.

| Name | Type | Description |
|------|------|-------------|
| `autoPlay` | `boolean` | Specifies if the animation should start automatically or wait for the play function to be called. Default: false |
| `playType` | `'together'` \| `'sequential'` \| `'interval'` | How to play the animations. Default: `together` |
| `interval` | `number` | If the `playType` is set to `interval`, this option specifies the time interval to start each animation in milliseconds. Default: `100`  |

### IPlayableAnimation interface

An interface that all playable animations adhere to.

**Methods**

| Name | Return type | Description |
|------|-------------|-------------|
| `dispose()` | | Disposes the animation. |
| `getDuration()` | `number` | Gets the duration of the animation. |
| `isPlaying()` | `boolean` | Checks to see if the animaiton is playing. |
| `pause()` | | Pauses the animation. |
| `play()` |  | Plays the animation. |
| `reset()` | | Stops the animation and jumps back to the beginning of the animation. |
| `stop()` |  | Stops the animation and jumps back to the end of the animation. |
 
### PathAnimationOptions interface

Extends: `PlayableAnimationOptions` interface

**Properties**

| Name | Type | Description |
|------|------|-------------|
| `captureMetadata` | `boolean` | Specifies if metadata should be captured as properties of the shape. Potential metadata properties that may be captured: `heading` |
| `geodesic` | `boolean` | Specifies if a curved geodesic path should be used between points rather than a straight pixel path. Default: `false` |

### PlayableAnimationOptions interface

**Properties**

| Name | Type | Description |
|------|------|-------------|
| `autoPlay` | `boolean` | Specifies if the animation should start automatically or wait for the play function to be called. Default: `false` |
| `disposeOnComplete` | `boolean` | Specifies if the animation should dispose itself once it has completed. Deault: `false` |
| `duration` | `number` | The duration of the animation in ms. Default: `1000` ms |
| `easing` | `string` \| `(progress: number) => number` | The easing of the animaiton. Default: `'linear'` |
| `loop` | `boolean` | Specifies if the animation should loop infinitely. Default: `false` |
| `reverse` | `boolean` | Specifies if the animation should play backwards. Default: `false` |
| `speedMultiplier` | `number` | A multiplier of the duration to speed up or down the animation. Default: `1` | 

### MapPathAnimationOptions interface

Extends: `PathAnimationOptions` interface

**Properties**

| Name | Type | Description |
|------|------|-------------|
| `map` | `atlas.Map` | Map to animation along path. If set, the map camera will also animate. |
| `pitch` | `number` | A pitch value to set on the map. By default this is not set. |
| `rotate` | `boolean` | Specifies if the map should rotate such that the bearing of the map faces the direction the map is moving. Default: `true`  |
| `rotationOffset` | number | When rotate is set to true, the animation will follow the animation. An offset of 180 will cause the camera to lead the animation and look back. Default: `0`  |
| `zoom` | number | A fixed zoom level to snap the map to on each animation frame. By default the maps current zoom level is used.  |

### MovingDashLineOptions interface

Extends: `PathAnimationOptions` interface

**Properties**

| Name | Type | Description |
|------|------|-------------|
| `dashLength` | `number` | The length of the dashed part of the line. Default: `4` |
| `gapLength` | `number` | The length of the gap part of the line. Default: `4` |

### PointPairValueInterpolation interface 

Defines how the value of property in two points is extrapolated. 

| Name | Type | Description |
|------|------|-------------|
| `interpolation` | `'linear'` \| `'nearest'` \| `'min'` \| `'max'` \| `'avg'` | How the interpolation is performed. Certain interpolations require the data to be a certain value.<br/><br/>- `linear`,`min`, `max`, `avg`: `number` or `Date`<br/>- `nearest`: `any`<br/><br/>Default: `linear` |
| `propertyPath` | `string` |  The path to the property with each sub-property separated with a forward slash "/", for example "property/subproperty1/subproperty2". Array indices can be added as subproperties as well, for example "property/0". |

### RoutePathAnimation interface

Implements: `IPlayableAnimation` interface
Extends: `PathAnimation` class

Animates a map and/or a Point shape along a route path. The movement will vary based on timestamps within the point feature properties.

An instance of this class is returned by the `atlas.animations.moveAlongRoute` function.

**Methods**

| Name | Return type | Description |
|------|-------------|-------------|
| `dispose()` | | Disposes the animation. |
| `getDuration()` | `number` | Gets the duration of the animation. Returns Infinity if the animations loops forever.  |
| `getOptions()` | `RoutePathAnimationOptions` | Gets the animation options. |
| `getPath()` | `atlas.data.Position[]` | Gets the positions that form the route path. |
| `getTimeSpan()` | `TimeSpan` | Gets the time span of the animation. |
| `setOptions(options: RoutePathAnimationOptions)` |  | Sets the options of the animation. |

#### RoutePathAnimationEvent interface 

Extends: `PlayableAnimationEvent`

Event arguments for a RoutePathAnimation state. If the `RoutePathAnimationOptions` includes a value for the `valueInterpolators` option, the calculated values of those interpolators will be included in the event object with the same property path.

| Name | Type | Description |
|------|------|-------------|
| `heading` | `number` |  The current heading on the path. |
| `position` | `atlas.data.Position` | The current position on the path.  |
| `progress` | `number` | Progress of the animation where 0 is the start and 1 is the end. |
| `speed` | `number` | Average speed between points in meters per second. |
| `timestamp` | `number` | Estimated timestamp in the animation based on the timestamp information provided for each point. |

### RoutePathAnimationOptions interface

Options used for animation along a route defined by points with timestamps.

**Properties**

| Name | Type | Description |
|------|------|-------------|
| `autoPlay` | `boolean` | Specifies if the animation should start automatically or wait for the play function to be called. Default: `false` |
| `disposeOnComplete` | `boolean` | Specifies if the animation should dispose itself once it has completed. Deault: `false` |
| `captureMetadata` | `boolean` | Specifies if metadata should be captured as properties of the shape. Potential metadata properties that may be captured: `heading` |
| `loop` | `boolean` | Specifies if the animation should loop infinitely. Default: `false` |
| `map` | `atlas.Map` | Map to animation along path. If set, the map camera will also animate. |
| `pitch` | `number` | A pitch value to set on the map. By default this is not set. |
| `reverse` | `boolean` | Specifies if the animation should play backwards. Default: `false` |
| `rotate` | `boolean` | Specifies if the map should rotate such that the bearing of the map faces the direction the map is moving. Default: `true`  |
| `rotationOffset` | `number` | When rotate is set to true, the animation will follow the animation. An offset of 180 will cause the camera to lead the animation and look back. Default: `0`  |
| `speedMultiplier` | `number` | A multiplier of the duration to speed up or down the animation. Default: `1` | 
| `valueInterpolations` | `PointPairValueInterpolation[]` | Interpolation calculations to perform on property values between points during the animation. Requires `captureMetadata` to be enabled. |
| `zoom` | `number` | A fixed zoom level to snap the map to on each animation frame. By default the maps current zoom level is used. |

### TimeSpan interface

| Name | Type | Description |
|------|------|-------------|
| `begin` | `number` | The start of the time span. Can be a number representing a date/time, or a number representing an order. |
| `end` | `number` | The end of the time span. Can be a number representing a date/time, or a number representing an order. |
